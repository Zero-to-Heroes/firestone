import { Injectable } from '@angular/core';
import {
	AbstractFacadeService,
	AppInjector,
	OverwolfService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';
import { CurrentAppType } from '../models/pref-model';
import { ENABLE_TEBEX } from './feature-flags';

@Injectable()
export class AppNavigationService extends AbstractFacadeService<AppNavigationService> {
	public currentTab$$: BehaviorSubject<CurrentAppType | null>;

	private ow: OverwolfService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'AppNavigationService', () => !!this.currentTab$$);
	}

	protected override assignSubjects() {
		this.currentTab$$ = this.mainInstance.currentTab$$;
	}

	protected async init() {
		this.currentTab$$ = new BehaviorSubject<CurrentAppType | null>(null);
		this.ow = AppInjector.get(OverwolfService);
	}

	public goToPremium() {
		if (ENABLE_TEBEX) {
			this.selectTab('premium');
		} else {
			this.ow.openStore();
		}
	}

	public selectTab(tab: CurrentAppType) {
		this.mainInstance.selectTabInternal(tab);
	}

	public selectTabInternal(tab: CurrentAppType) {
		console.debug('[navigation] selecting tab', tab);
		this.currentTab$$.next(tab);
	}
}
