import { PreferencesService } from '@firestone/shared/common/service';
import type { IWindowHandlerService } from '@firestone/shared/framework/core';
import {
	AppInjector,
	HotkeyChangedUnsubscribe,
	HotkeyHoldUnsubscribe,
	IHotkeyHandlerService,
	waitForReady,
	WINDOW_HANDLER_SERVICE_TOKEN,
} from '@firestone/shared/framework/core';
import { globalShortcut } from 'electron';
import { BehaviorSubject } from 'rxjs';
import { uIOhook, UiohookKey } from 'uiohook-napi';

/** Maps hotkey names (from OW manifest) to Electron accelerator strings. */
const DEFAULT_ACCELERATORS: Record<string, string> = {
	battlegrounds: 'Alt+B',
	collection: 'Alt+C',
	'live-info': 'Tab',
};

type PressedCallback = () => void;
type HoldCallbacks = { onDown: () => void; onUp: () => void };

export class ElectronHotkeyHandlerService implements IHotkeyHandlerService {
	public liveInfoKeyPressed$$ = new BehaviorSubject<boolean>(false);
	public isCollectionHotkeyActive = true;

	private readonly pressedCallbacks = new Map<string, Set<PressedCallback>>();
	private readonly holdCallbacks = new Map<string, Set<HoldCallbacks>>();
	private readonly holdUnsubs = new Map<HotkeyHoldUnsubscribe, { accelerator: string; entry: HoldCallbacks }>();
	private readonly changedListeners: ((message: any) => void)[] = [];
	private readonly registeredAccelerators = new Set<string>();
	private uiohookStarted = false;

	private windowHandler: IWindowHandlerService;
	private prefs: PreferencesService;

	constructor() {
		this.windowHandler = null;
		this.prefs = null;
	}

	public async init(): Promise<void> {
		this.windowHandler = AppInjector.get(WINDOW_HANDLER_SERVICE_TOKEN) as IWindowHandlerService;
		this.prefs = AppInjector.get(PreferencesService);
		await waitForReady(this.prefs);

		// Register built-in hotkeys
		this.registerBuiltInHotkey('battlegrounds', async () => {
			const prefs = await this.prefs.getPreferences();
			this.windowHandler.toggleBattlegroundsWindow(prefs.bgsUseOverlay);
		});
		this.registerBuiltInHotkey('collection', async () => {
			if (!this.isCollectionHotkeyActive) {
				return;
			}
			const prefs = await this.prefs.getPreferences();
			this.windowHandler.toggleCollectionWindow(prefs.collectionUseOverlay);
		});
		// live-info: Tab hold. Use uiohook for true key-down/key-up (globalShortcut has no key-up).
		this.setupLiveInfoHoldHotkey();
	}

	public async isReady(): Promise<void> {
		return;
	}

	private setupLiveInfoHoldHotkey(): void {
		const accelerator = this.getAcceleratorFor('live-info');
		// Ensure hold callbacks map exists (for addHotKeyHoldListener('live-info', ...))
		if (!this.holdCallbacks.has(accelerator)) {
			this.holdCallbacks.set(accelerator, new Set());
		}
		uIOhook.on('keydown', (e) => {
			if (e.keycode === UiohookKey.Tab) {
				this.liveInfoKeyPressed$$.next(true);
				this.holdCallbacks.get(accelerator)?.forEach(({ onDown }) => {
					try {
						onDown();
					} catch (err) {
						console.error('[electron-hotkey] Error in live-info hold onDown', err);
					}
				});
			}
		});
		uIOhook.on('keyup', (e) => {
			if (e.keycode === UiohookKey.Tab) {
				this.liveInfoKeyPressed$$.next(false);
				this.holdCallbacks.get(accelerator)?.forEach(({ onUp }) => {
					try {
						onUp();
					} catch (err) {
						console.error('[electron-hotkey] Error in live-info hold onUp', err);
					}
				});
			}
		});
		if (!this.uiohookStarted) {
			uIOhook.start();
			this.uiohookStarted = true;
		}
	}

	private getAcceleratorFor(hotkeyName: string): string {
		return DEFAULT_ACCELERATORS[hotkeyName] ?? hotkeyName;
	}

	async getHotkeyBinding(hotkeyName: string): Promise<string | null> {
		return DEFAULT_ACCELERATORS[hotkeyName] ?? null;
	}

	private registerBuiltInHotkey(hotkeyName: string, callback: () => void): void {
		const accelerator = this.getAcceleratorFor(hotkeyName);
		this.ensureRegistered(accelerator);
		this.pressedCallbacks.get(accelerator)!.add(callback);
	}

	private ensureRegistered(accelerator: string): void {
		if (!this.pressedCallbacks.has(accelerator)) {
			this.pressedCallbacks.set(accelerator, new Set());
		}
		if (!this.holdCallbacks.has(accelerator)) {
			this.holdCallbacks.set(accelerator, new Set());
		}
		if (this.registeredAccelerators.has(accelerator)) {
			return;
		}
		this.registeredAccelerators.add(accelerator);
		const ok = globalShortcut.register(accelerator, () => {
			this.dispatchHotkey(accelerator);
		});
		if (!ok) {
			console.warn('[electron-hotkey] Failed to register:', accelerator, '(may be in use by another app)');
		}
	}

	private dispatchHotkey(accelerator: string): void {
		const pressed = this.pressedCallbacks.get(accelerator);
		if (pressed) {
			pressed.forEach((cb) => {
				void Promise.resolve(cb()).catch((e) =>
					console.error('[electron-hotkey] Error in pressed callback', e),
				);
			});
		}
		const hold = this.holdCallbacks.get(accelerator);
		if (hold) {
			hold.forEach(({ onDown, onUp }) => {
				try {
					onDown();
				} catch (e) {
					console.error('[electron-hotkey] Error in hold onDown', e);
				}
				// globalShortcut has no key-up; emit onUp after short delay as fallback
				setTimeout(() => {
					try {
						onUp();
					} catch (e) {
						console.error('[electron-hotkey] Error in hold onUp', e);
					}
				}, 300);
			});
		}
	}

	/** Unregister all hotkeys. Call on app quit. */
	public unregisterAll(): void {
		globalShortcut.unregisterAll();
		if (this.uiohookStarted) {
			uIOhook.stop();
			this.uiohookStarted = false;
		}
		this.registeredAccelerators.clear();
		this.pressedCallbacks.clear();
		this.holdCallbacks.clear();
		this.holdUnsubs.clear();
	}

	addHotKeyHoldListener(hotkey: string, onDown: () => void, onUp: () => void): HotkeyHoldUnsubscribe {
		const accelerator = this.getAcceleratorFor(hotkey);
		// live-info (Tab) uses uiohook, not globalShortcut
		if (hotkey === 'live-info') {
			if (!this.holdCallbacks.has(accelerator)) {
				this.holdCallbacks.set(accelerator, new Set());
			}
		} else {
			this.ensureRegistered(accelerator);
		}
		const entry: HoldCallbacks = { onDown, onUp };
		this.holdCallbacks.get(accelerator)!.add(entry);
		const unsub: HotkeyHoldUnsubscribe = () => {
			this.holdCallbacks.get(accelerator)?.delete(entry);
			this.holdUnsubs.delete(unsub);
		};
		this.holdUnsubs.set(unsub, { accelerator, entry });
		return unsub;
	}

	removeHotKeyHoldListener(listener: HotkeyHoldUnsubscribe): void {
		listener();
	}

	addHotKeyPressedListener(hotkey: string, callback: () => void): void {
		const accelerator = this.getAcceleratorFor(hotkey);
		this.ensureRegistered(accelerator);
		this.pressedCallbacks.get(accelerator)!.add(callback);
	}

	addHotkeyChangedListener(callback: (message: any) => void): HotkeyChangedUnsubscribe {
		this.changedListeners.push(callback);
		return () => {
			const idx = this.changedListeners.indexOf(callback);
			if (idx >= 0) {
				this.changedListeners.splice(idx, 1);
			}
		};
	}

	removeHotkeyChangedListener(listener: HotkeyChangedUnsubscribe): void {
		listener();
	}
}
