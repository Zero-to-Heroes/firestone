import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AbstractFacadeService } from './abstract-facade-service';
import { AppInjector } from './app-injector';
import { HOTKEY_HANDLER_SERVICE_TOKEN, IHotkeyHandlerService } from './hotkey-handler.interface';
import { WindowManagerService } from './window-manager.service';

const USER_MAPPING_UPDATE_URL = 'https://gpiulkkg75uipxcgcbfr4ixkju0ntere.lambda-url.us-west-2.on.aws/';

@Injectable({ providedIn: 'root' })
export class HotkeyFacadeService extends AbstractFacadeService<HotkeyFacadeService> {
	public liveInfoPressed$$: BehaviorSubject<boolean>;

	private hotkeyHandler: IHotkeyHandlerService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'HotkeyFacadeService', () => !!this.liveInfoPressed$$);
	}

	protected override assignSubjects() {
		this.liveInfoPressed$$ = this.mainInstance.liveInfoPressed$$;
	}

	protected async init() {
		this.liveInfoPressed$$ = new BehaviorSubject<boolean>(false);
		this.hotkeyHandler = AppInjector.get(HOTKEY_HANDLER_SERVICE_TOKEN);

		this.hotkeyHandler.liveInfoKeyPressed$$.subscribe((pressed) => {
			this.liveInfoPressed$$.next(pressed);
		});
	}

	protected override async initElectronSubjects() {
		this.setupElectronSubject(this.liveInfoPressed$$, 'HotkeyFacadeService-liveInfoPressed');
	}

	protected override async createElectronProxy(ipcRenderer: any) {
		this.liveInfoPressed$$ = new BehaviorSubject<boolean>(false);
	}
}
