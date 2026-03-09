import { Injectable } from '@angular/core';
import { uuidShort } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	AppInjector,
	ELECTRON_HOTKEY_HANDLER_IMPL_TOKEN,
	HotkeyChangedUnsubscribe,
	HotkeyHoldUnsubscribe,
	IHotkeyHandlerService,
	isMainProcess,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';

const HOTKEY_HOLD_DOWN_CHANNEL = 'ElectronHotkeyHandlerFacadeService-hotkey-hold-down';
const HOTKEY_HOLD_UP_CHANNEL = 'ElectronHotkeyHandlerFacadeService-hotkey-hold-up';
const HOTKEY_PRESSED_CHANNEL = 'ElectronHotkeyHandlerFacadeService-hotkey-pressed';

type HoldCallbacks = { onDown: () => void; onUp: () => void };

/**
 * Electron facade for IHotkeyHandlerService. Proxies to the main process via IPC when
 * running in a renderer (e.g. electron-frontend). In main process, delegates to
 * ElectronHotkeyHandlerService (registered with ELECTRON_HOTKEY_HANDLER_IMPL_TOKEN).
 *
 * All methods work in both main and renderer:
 * - getHotkeyBinding: Uses callOnMainProcess in renderer.
 * - Listener methods: In renderer, registers with main via IPC; main broadcasts events
 *   when hotkeys fire; renderer invokes local callbacks when it receives broadcasts.
 */
@Injectable({ providedIn: 'root' })
export class ElectronHotkeyHandlerFacadeService
	extends AbstractFacadeService<ElectronHotkeyHandlerFacadeService>
	implements IHotkeyHandlerService
{
	public liveInfoKeyPressed$$: BehaviorSubject<boolean>;

	private hotkeyHandler: IHotkeyHandlerService;

	private readonly holdCallbacks = new Map<string, Set<HoldCallbacks>>();
	private readonly pressedCallbacks = new Map<string, Set<() => void>>();
	private readonly holdBroadcastRegistered = new Set<string>();
	private readonly pressedBroadcastRegistered = new Set<string>();
	private readonly _id = uuidShort();
	protected override debug = true;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'ElectronHotkeyHandlerFacadeService', () => !!this.liveInfoKeyPressed$$);
	}

	protected override assignSubjects() {
		this.liveInfoKeyPressed$$ = this.mainInstance.liveInfoKeyPressed$$;
	}

	protected async init() {
		this.hotkeyHandler = AppInjector.get(ELECTRON_HOTKEY_HANDLER_IMPL_TOKEN);
		this.liveInfoKeyPressed$$ = this.hotkeyHandler.liveInfoKeyPressed$$;
	}

	protected override createElectronProxy(ipcRenderer: any): void {
		this.liveInfoKeyPressed$$ = new BehaviorSubject<boolean>(false);
		// ipcRenderer?.on(HOTKEY_HOLD_DOWN_CHANNEL, (_: unknown, hotkey: string) => {
		// 	this.holdCallbacks.get(hotkey)?.forEach((cb) => cb.onDown());
		// });
		// ipcRenderer?.on(HOTKEY_HOLD_UP_CHANNEL, (_: unknown, hotkey: string) => {
		// 	this.holdCallbacks.get(hotkey)?.forEach((cb) => cb.onUp());
		// });
		// ipcRenderer?.on(HOTKEY_PRESSED_CHANNEL, (_: unknown, hotkey: string) => {
		// 	this.pressedCallbacks.get(hotkey)?.forEach((cb) => cb());
		// });
	}

	protected override async initElectronSubjects() {
		this.setupElectronSubject(this.liveInfoKeyPressed$$, 'ElectronHotkeyHandlerFacadeService-liveInfoKeyPressed');
	}

	protected override async initElectronMainProcess() {
		this.registerMainProcessMethod('getHotkeyBinding', async (hotkeyName: string) =>
			this.getHotkeyBinding(hotkeyName),
		);
		// TODO: check these, not sure they work well
		this.registerMainProcessMethod('addHotkeyHoldBroadcast', (hotkey: string) => {
			if (!this.holdBroadcastRegistered.has(hotkey)) {
				this.holdBroadcastRegistered.add(hotkey);
				const handler = AppInjector.get(ELECTRON_HOTKEY_HANDLER_IMPL_TOKEN);
				handler.addHotKeyHoldListener(
					hotkey,
					() => this.broadcastToRenderers(HOTKEY_HOLD_DOWN_CHANNEL, hotkey),
					() => this.broadcastToRenderers(HOTKEY_HOLD_UP_CHANNEL, hotkey),
				);
			}
		});
		this.registerMainProcessMethod('addHotkeyPressedBroadcast', (hotkey: string) => {
			if (!this.pressedBroadcastRegistered.has(hotkey)) {
				this.pressedBroadcastRegistered.add(hotkey);
				const handler = AppInjector.get(ELECTRON_HOTKEY_HANDLER_IMPL_TOKEN);
				handler.addHotKeyPressedListener(hotkey, () =>
					this.broadcastToRenderers(HOTKEY_PRESSED_CHANNEL, hotkey),
				);
			}
		});
	}

	public async getHotkeyBinding(hotkeyName: string): Promise<string | null> {
		if (this.isElectronContext && !isMainProcess()) {
			return this.callOnMainProcess('getHotkeyBinding', hotkeyName);
		}
		return this.hotkeyHandler.getHotkeyBinding(hotkeyName);
	}

	public addHotKeyHoldListener(hotkey: string, onDown: () => void, onUp: () => void): HotkeyHoldUnsubscribe {
		if (this.hotkeyHandler && isMainProcess()) {
			return this.hotkeyHandler.addHotKeyHoldListener(hotkey, onDown, onUp);
		}
		if (!this.holdCallbacks.has(hotkey)) {
			this.holdCallbacks.set(hotkey, new Set());
		}
		const entry: HoldCallbacks = { onDown, onUp };
		this.holdCallbacks.get(hotkey)!.add(entry);
		this.callOnMainProcess('addHotkeyHoldBroadcast', hotkey);
		return () => {
			this.holdCallbacks.get(hotkey)?.delete(entry);
		};
	}

	public removeHotKeyHoldListener(listener: HotkeyHoldUnsubscribe): void {
		if (this.hotkeyHandler && isMainProcess()) {
			this.hotkeyHandler.removeHotKeyHoldListener(listener);
		} else {
			listener();
		}
	}

	public addHotKeyPressedListener(hotkey: string, callback: () => void): void {
		if (this.hotkeyHandler && isMainProcess()) {
			this.hotkeyHandler.addHotKeyPressedListener(hotkey, callback);
			return;
		}
		if (!this.pressedCallbacks.has(hotkey)) {
			this.pressedCallbacks.set(hotkey, new Set());
		}
		this.pressedCallbacks.get(hotkey)!.add(callback);
		this.callOnMainProcess('addHotkeyPressedBroadcast', hotkey);
	}

	public addHotkeyChangedListener(callback: (message: unknown) => void): HotkeyChangedUnsubscribe {
		return this.hotkeyHandler?.addHotkeyChangedListener(callback) ?? (() => {});
	}

	public removeHotkeyChangedListener(listener: HotkeyChangedUnsubscribe): void {
		this.hotkeyHandler?.removeHotkeyChangedListener(listener);
	}
}
