import { Injectable } from '@angular/core';
import { Profile, ProfileAchievementCategory } from '@firestone-hs/api-user-profile';
import { AchievementsRefLoaderService } from '@firestone/achievements/data-access';
import { ApiRunner } from '@firestone/shared/framework/core';
import { Observable, combineLatest, debounceTime, distinctUntilChanged, filter, map } from 'rxjs';
import { AchievementsMemoryMonitor } from '../../achievement/achievements-memory-monitor.service';
import { AppUiStoreFacadeService } from '../../ui-store/app-ui-store-facade.service';
import { deepEqual } from '../../utils';
import { PROFILE_UPDATE_URL } from '../profile-uploader.service';

@Injectable()
export class InternalProfileAchievementsService {
	constructor(
		private readonly store: AppUiStoreFacadeService,
		private readonly api: ApiRunner,
		private readonly achievementsMonitor: AchievementsMemoryMonitor,
		private readonly achievementsRefLoader: AchievementsRefLoaderService,
	) {
		this.init();
	}

	private async init() {
		await this.store.initComplete();
		this.initAchievements();
	}

	private initAchievements() {
		const achievementsToUpload$: Observable<readonly ProfileAchievementCategory[]> = combineLatest([
			this.store.isPremiumUser$(),
			this.achievementsMonitor.achievementCategories$$,
		]).pipe(
			filter(([premium, achievementCategories]) => premium),
			debounceTime(10000),
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
				console.debug('[profile] will upload achievementCategories', achievementCategories);
				const payload: Profile = {
					achievementCategories: achievementCategories,
				};
				console.debug('[profile] updating profile with payload', payload);
				this.api.callPostApiSecure(PROFILE_UPDATE_URL, payload);
			});
	}
}
