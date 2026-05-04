/* eslint-disable no-case-declarations */
import { Injectable } from '@angular/core';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { AbstractFacadeService, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';
import {
	AchievementsLiveProgressTrackingService,
	AchievementsProgressTracking,
} from './achievements-live-progress-tracking.service';

@Injectable({ providedIn: 'root' })
export class AchievementsLiveTrackingFacadeService extends AbstractFacadeService<AchievementsLiveTrackingFacadeService> {
	public achievementsProgressTracking$$: SubscriberAwareBehaviorSubject<readonly AchievementsProgressTracking[]>;

	private service: AchievementsLiveProgressTrackingService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'AchievementsLiveTrackingFacadeService', () => !!this.achievementsProgressTracking$$);
	}

	protected override assignSubjects() {
		this.achievementsProgressTracking$$ = this.mainInstance.achievementsProgressTracking$$;
	}

	protected async init() {
		this.achievementsProgressTracking$$ = new SubscriberAwareBehaviorSubject<
			readonly AchievementsProgressTracking[]
		>([]);
		this.service = AppInjector.get(AchievementsLiveProgressTrackingService);

		this.achievementsProgressTracking$$.onFirstSubscribe(() => {
			this.service.achievementsProgressTracking$$.subscribe(this.achievementsProgressTracking$$);
		});
	}

	protected override initElectronSubjects(): void {
		this.setupElectronSubject(
			this.achievementsProgressTracking$$,
			'AchievementsLiveTrackingFacadeService-achievementsProgressTracking',
		);
	}

	protected override createElectronProxy(ipcRenderer: any): void | Promise<void> {
		this.achievementsProgressTracking$$ = new SubscriberAwareBehaviorSubject<
			readonly AchievementsProgressTracking[]
		>([]);
	}
}
