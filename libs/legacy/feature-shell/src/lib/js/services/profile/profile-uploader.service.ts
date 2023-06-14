import { Injectable } from '@angular/core';
import { Profile } from '@firestone-hs/api-user-profile';
import { Mutable } from '@firestone/shared/framework/common';
import { ApiRunner } from '@firestone/shared/framework/core';
import { combineLatest, debounceTime, distinctUntilChanged } from 'rxjs';
import { deepEqual } from '../utils';
import { InternalProfileAchievementsService } from './internal/internal-profile-achievements.service';
import { InternalProfileBattlegroundsService } from './internal/internal-profile-battlegrounds.service';
import { InternalProfileCollectionService } from './internal/internal-profile-collection.service';

export const PROFILE_UPDATE_URL = 'https://7n2xgqrutsr3by2n2wncsi25ou0mttjp.lambda-url.us-west-2.on.aws/';

@Injectable()
export class ProfileUploaderService {
	constructor(
		private readonly internalCollection: InternalProfileCollectionService,
		private readonly internalAchievements: InternalProfileAchievementsService,
		private readonly internalBattlegrounds: InternalProfileBattlegroundsService,
		private readonly api: ApiRunner,
	) {
		this.init();
	}

	private init() {
		combineLatest([
			this.internalAchievements.achievementCategories$$,
			this.internalBattlegrounds.bgFullTimeStatsByHero$$,
			this.internalCollection.sets$$,
			this.internalCollection.packsAllTime$$,
		])
			.pipe(
				debounceTime(10000),
				distinctUntilChanged((a, b) => deepEqual(a, b)),
			)
			.subscribe(async ([achievementCategories, bgFullTimeStatsByHero, sets, packsAllTime]) => {
				const payload: Mutable<Profile> = {};
				if (!!achievementCategories?.length) {
					payload.achievementCategories = achievementCategories;
				}
				if (!!bgFullTimeStatsByHero?.length) {
					payload.bgFullTimeStatsByHero = bgFullTimeStatsByHero;
				}
				if (!!sets?.length) {
					payload.sets = sets;
				}
				if (!!packsAllTime?.length) {
					payload.packsAllTime = packsAllTime;
				}
				console.debug('[profile] updating profile with payload', payload);
				this.api.callPostApiSecure(PROFILE_UPDATE_URL, payload);
			});
	}
}
