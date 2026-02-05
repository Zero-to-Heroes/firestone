import { Injectable } from '@angular/core';
import {
	AbstractFacadeService,
	AppInjector,
	HOTKEY_HANDLER_SERVICE_TOKEN,
	HotkeyChangedUnsubscribe,
	HotkeyHoldUnsubscribe,
	IHotkeyHandlerService,
	WindowManagerService,
} from '@firestone/shared/framework/core';

@Injectable({ providedIn: 'root' })
export class ElectronHotkeyHandlerFacadeService
	extends AbstractFacadeService<ElectronHotkeyHandlerFacadeService>
	implements IHotkeyHandlerService
{
	private hotkeyHandler: IHotkeyHandlerService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'ElectronHotkeyHandlerFacadeService', () => !!this.hotkeyHandler);
	}

	protected override assignSubjects() {
		// Do nothing
	}

	protected async init() {
		this.hotkeyHandler = AppInjector.get(HOTKEY_HANDLER_SERVICE_TOKEN);
	}

	protected override createElectronProxy(ipcRenderer: any): void | Promise<void> {
		// Do nothing yet
	}

	protected override async initElectronSubjects() {
		// Do nothing yet
	}

	public addHotKeyHoldListener(hotkey: string, onDown: () => void, onUp: () => void): HotkeyHoldUnsubscribe {
		// Do nothing yet
		// Not sure how to handle this with the process / main communication later on?
		return () => {};
	}

	public removeHotKeyHoldListener(listener: HotkeyHoldUnsubscribe): void {
		// Do nothing yet
		// Not sure how to handle this with the process / main communication later on?
	}

	public addHotKeyPressedListener(hotkey: string, callback: () => void): void {
		// Do nothing yet
		// Not sure how to handle this with the process / main communication later on?
	}

	public addHotkeyChangedListener(callback: (message: any) => void): HotkeyChangedUnsubscribe {
		// Do nothing yet
		// Not sure how to handle this with the process / main communication later on?
		return () => {};
	}

	public removeHotkeyChangedListener(listener: HotkeyChangedUnsubscribe): void {
		// Do nothing yet
		// Not sure how to handle this with the process / main communication later on?
	}
}
