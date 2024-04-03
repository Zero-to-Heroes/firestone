import { Injectable } from '@angular/core';
import { sleep } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	AppInjector,
	OverwolfService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { BehaviorSubject, distinctUntilChanged, map } from 'rxjs';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../models/mainwindow/navigation/navigation-state';

@Injectable()
export class MainWindowStateFacadeService extends AbstractFacadeService<MainWindowStateFacadeService> {
	public mainWindowState$$: BehaviorSubject<MainWindowState | null>;

	private ow: OverwolfService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'MainWindowStateFacadeService', () => !!this.mainWindowState$$);
	}

	protected override assignSubjects() {
		this.mainWindowState$$ = this.mainInstance.mainWindowState$$;
	}

	protected async init() {
		this.mainWindowState$$ = new BehaviorSubject<MainWindowState | null>(null);
		this.ow = AppInjector.get(OverwolfService);

		while (!this.ow.getMainWindow().mainWindowStoreMerged) {
			await sleep(50);
		}

		this.ow
			.getMainWindow()
			.mainWindowStoreMerged.pipe(
				map((event: [MainWindowState, NavigationState]) => event[0]),
				distinctUntilChanged(),
			)
			.subscribe((event: MainWindowState) => {
				this.mainWindowState$$.next(event);
			});
	}
}
