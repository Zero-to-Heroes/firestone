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
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ElectronHotkeyHandlerFacadeService
	extends AbstractFacadeService<ElectronHotkeyHandlerFacadeService>
	implements IHotkeyHandlerService
{
	public liveInfoKeyPressed$$: BehaviorSubject<boolean>;

	private hotkeyHandler: IHotkeyHandlerService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'ElectronHotkeyHandlerFacadeService', () => !!this.hotkeyHandler);
	}

	protected override assignSubjects() {
		this.liveInfoKeyPressed$$ = this.mainInstance.liveInfoKeyPressed$$;
	}

	protected async init() {
		this.liveInfoKeyPressed$$ = new BehaviorSubject<boolean>(false);
		this.hotkeyHandler = AppInjector.get(HOTKEY_HANDLER_SERVICE_TOKEN);
	}

	protected override createElectronProxy(ipcRenderer: any): void | Promise<void> {
		this.liveInfoKeyPressed$$ = new BehaviorSubject<boolean>(false);
	}

	protected override async initElectronSubjects() {
		this.setupElectronSubject(this.liveInfoKeyPressed$$, 'ElectronHotkeyHandlerFacadeService-liveInfoKeyPressed');
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
