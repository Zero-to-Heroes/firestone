import { Injectable } from '@angular/core';
import { AbstractFacadeService, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';
import { MainWindowState } from '../model/main-window-state';
import { MainWindowStoreEvent } from './events/main-window-store-event';
import { IMainWindowStoreService, MAIN_WINDOW_STORE_SERVICE_TOKEN } from './main-window-store.interface';

@Injectable({ providedIn: 'root' })
export class MainWindowStateFacadeService extends AbstractFacadeService<MainWindowStateFacadeService> {
	public mainWindowState$$: BehaviorSubject<MainWindowState | null>;

	private store: IMainWindowStoreService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'MainWindowStateFacadeService', () => !!this.mainWindowState$$);
	}

	protected override assignSubjects() {
		this.mainWindowState$$ = this.mainInstance.mainWindowState$$;
	}

	protected async init() {
		this.mainWindowState$$ = new BehaviorSubject<MainWindowState | null>(new MainWindowState());
		this.store = AppInjector.get(MAIN_WINDOW_STORE_SERVICE_TOKEN);

		this.store.mainWindowState$$.subscribe((state) => {
			this.mainWindowState$$.next(state);
		});
	}

	protected override async initElectronMainProcess() {
		this.registerMainProcessMethod('sendInternal', (event: MainWindowStoreEvent) => this.sendInternal(event));
	}

	protected override async initElectronSubjects() {
		this.setupElectronSubject(this.mainWindowState$$, 'MainWindowStateFacadeService-mainWindowState');
	}

	protected override async createElectronProxy(ipcRenderer: any) {
		this.mainWindowState$$ = new BehaviorSubject<MainWindowState | null>(null);
	}

	public send(event: MainWindowStoreEvent) {
		this.callOnMainProcess('sendInternal', event);
	}
	private sendInternal(event: MainWindowStoreEvent) {
		this.store.send(event);
	}
}
