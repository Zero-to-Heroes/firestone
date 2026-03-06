import { Injectable } from '@angular/core';
import {
	AbstractFacadeService,
	AppInjector,
	HotkeyChangedUnsubscribe,
	HotkeyHoldUnsubscribe,
	IHotkeyHandlerService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';
import { ElectronHotkeyHandlerService } from './electron-hotkey-handler.service';

@Injectable({ providedIn: 'root' })
export class ElectronHotkeyHandlerFacadeService
	extends AbstractFacadeService<ElectronHotkeyHandlerFacadeService>
	implements IHotkeyHandlerService
{
	public liveInfoKeyPressed$$: BehaviorSubject<boolean>;

	private hotkeyHandler: ElectronHotkeyHandlerService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'ElectronHotkeyHandlerFacadeService', () => !!this.hotkeyHandler);
	}

	protected override assignSubjects() {
		this.liveInfoKeyPressed$$ = this.mainInstance.liveInfoKeyPressed$$;
	}

	protected async init() {
		this.hotkeyHandler = AppInjector.get(ElectronHotkeyHandlerService);
		this.liveInfoKeyPressed$$ = this.hotkeyHandler.liveInfoKeyPressed$$;
	}

	protected override createElectronProxy(ipcRenderer: any): void | Promise<void> {
		this.liveInfoKeyPressed$$ = new BehaviorSubject<boolean>(false);
	}

	protected override async initElectronSubjects() {
		this.setupElectronSubject(this.liveInfoKeyPressed$$, 'ElectronHotkeyHandlerFacadeService-liveInfoKeyPressed');
	}

	public addHotKeyHoldListener(hotkey: string, onDown: () => void, onUp: () => void): HotkeyHoldUnsubscribe {
		return this.hotkeyHandler?.addHotKeyHoldListener(hotkey, onDown, onUp) ?? (() => {});
	}

	public removeHotKeyHoldListener(listener: HotkeyHoldUnsubscribe): void {
		this.hotkeyHandler?.removeHotKeyHoldListener(listener);
	}

	public addHotKeyPressedListener(hotkey: string, callback: () => void): void {
		this.hotkeyHandler?.addHotKeyPressedListener(hotkey, callback);
	}

	public addHotkeyChangedListener(callback: (message: any) => void): HotkeyChangedUnsubscribe {
		return this.hotkeyHandler?.addHotkeyChangedListener(callback) ?? (() => {});
	}

	public removeHotkeyChangedListener(listener: HotkeyChangedUnsubscribe): void {
		this.hotkeyHandler?.removeHotkeyChangedListener(listener);
	}
}
