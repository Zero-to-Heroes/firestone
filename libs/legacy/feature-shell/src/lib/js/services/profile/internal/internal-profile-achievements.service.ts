import { Injectable } from '@angular/core';
import { ProfileAchievementCategory } from '@firestone-hs/api-user-profile';
import { BehaviorSubject, Observable, combineLatest, debounceTime, distinctUntilChanged, filter, map } from 'rxjs';
import { AchievementsMemoryMonitor } from '../../achievement/data/achievements-memory-monitor.service';
import { AppUiStoreFacadeService } from '../../ui-store/app-ui-store-facade.service';
import { deepEqual } from '../../utils';

@Injectable()
export class InternalProfileAchievementsService {
	public achievementCategories$$ = new BehaviorSubject<readonly ProfileAchievementCategory[]>([]);

	constructor(
		private readonly store: AppUiStoreFacadeService,
		private readonly achievementsMonitor: AchievementsMemoryMonitor,
	) {
		this.init();
	}

	private async init() {
		await this.store.initComplete();
		this.initAchievements();
	}

	private initAchievements() {
		const achievementsToUpload$: Observable<readonly ProfileAchievementCategory[]> = combineLatest([
			this.store.enablePremiumFeatures$(),
			this.achievementsMonitor.achievementCategories$$,
		]).pipe(
			filter(([premium, achievementCategories]) => premium),
			debounceTime(2000),
			map(([premium, achievementCategories]) => {
				return achievementCategories.map((category) => {
					return {
						id: category.id,
						availablePoints: category.availablePoints,
						points: category.points,
						totalAchievements: category.totalAchievements,
						completedAchievements: category.completedAchievements,
					} as ProfileAchievementCategory;
				});
			}),
		);
		achievementsToUpload$
			.pipe(
				filter((achievementCategories) => !!achievementCategories?.length),
				distinctUntilChanged((a, b) => deepEqual(a, b)),
			)
			.subscribe(async (achievementCategories) => {
				console.debug('[profile] achievementCategories', achievementCategories);
				this.achievementCategories$$.next(achievementCategories);
			});
	}
}
