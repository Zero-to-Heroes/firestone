import { Injectable } from '@angular/core';
import { Profile } from '@firestone-hs/api-user-profile';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { ApiRunner } from '@firestone/shared/framework/core';
import { combineLatest, distinctUntilChanged, filter, map } from 'rxjs';
import { GameStatusService } from '../game-status.service';
import { AppUiStoreFacadeService } from '../ui-store/app-ui-store-facade.service';
import { deepEqual } from '../utils';
import { InternalProfileAchievementsService } from './internal/internal-profile-achievements.service';
import { InternalProfileBattlegroundsService } from './internal/internal-profile-battlegrounds.service';
import { InternalProfileCollectionService } from './internal/internal-profile-collection.service';
import { InternalProfileInfoService } from './internal/internal-profile-info.service';

export const PROFILE_UPDATE_URL = 'https://7n2xgqrutsr3by2n2wncsi25ou0mttjp.lambda-url.us-west-2.on.aws/';

@Injectable()
export class ProfileUploaderService {
	public profile$$ = new SubscriberAwareBehaviorSubject<Profile>(null);

	constructor(
		private readonly internalCollection: InternalProfileCollectionService,
		private readonly internalAchievements: InternalProfileAchievementsService,
		private readonly internalBattlegrounds: InternalProfileBattlegroundsService,
		private readonly internalProfileInfo: InternalProfileInfoService,
		private readonly api: ApiRunner,
		private readonly gameStatus: GameStatusService,
		private readonly store: AppUiStoreFacadeService,
	) {
		window['profileClassesProgress'] = this.internalProfileInfo.classesProgress$$;
		window['profileBgHeroStat'] = this.internalBattlegrounds.bgFullTimeStatsByHero$$;
		window['profileDuelsHeroStats'] = this.internalProfileInfo.duelsHeroStats$$;
		this.init();
	}

	private async init() {
		await this.store.initComplete();
		const elligible$ = combineLatest([this.gameStatus.inGame$$, this.store.hasPremiumSub$()]).pipe(
			map(([inGame, hasPremium]) => inGame && hasPremium),
			filter((elligible) => elligible),
			distinctUntilChanged(),
		);

		combineLatest([elligible$, this.internalAchievements.achievementCategories$$])
			.pipe(
				filter(([elligible, data]) => elligible && !!data?.length),
				distinctUntilChanged((a, b) => deepEqual(a, b)),
			)
			.subscribe(([_, data]) => {
				this.api.callPostApiSecure(PROFILE_UPDATE_URL, { achievements: data } as Profile);
			});
		combineLatest([elligible$, this.internalBattlegrounds.bgFullTimeStatsByHero$$])
			.pipe(
				filter(([elligible, data]) => elligible && !!data?.length),
				distinctUntilChanged((a, b) => deepEqual(a, b)),
			)
			.subscribe(([_, data]) => {
				this.api.callPostApiSecure(PROFILE_UPDATE_URL, { bgFullTimeStatsByHero: data } as Profile);
			});
		combineLatest([elligible$, this.internalCollection.sets$$])
			.pipe(
				filter(([elligible, data]) => elligible && !!data?.length),
				distinctUntilChanged((a, b) => deepEqual(a, b)),
			)
			.subscribe(([_, data]) => {
				this.api.callPostApiSecure(PROFILE_UPDATE_URL, { sets: data } as Profile);
			});
		combineLatest([elligible$, this.internalCollection.packsAllTime$$])
			.pipe(
				filter(([elligible, data]) => elligible && !!data?.length),
				distinctUntilChanged((a, b) => deepEqual(a, b)),
			)
			.subscribe(([_, data]) => {
				this.api.callPostApiSecure(PROFILE_UPDATE_URL, { packsAllTime: data } as Profile);
			});
		combineLatest([elligible$, this.internalProfileInfo.classesProgress$$])
			.pipe(
				filter(([elligible, data]) => elligible && !!data?.length),
				distinctUntilChanged((a, b) => deepEqual(a, b)),
			)
			.subscribe(([_, data]) => {
				this.api.callPostApiSecure(PROFILE_UPDATE_URL, { classesProgress: data } as Profile);
			});
		combineLatest([elligible$, this.internalProfileInfo.winsForMode$$])
			.pipe(
				filter(([elligible, data]) => elligible && !!data?.length),
				distinctUntilChanged((a, b) => deepEqual(a, b)),
			)
			.subscribe(([_, data]) => {
				this.api.callPostApiSecure(PROFILE_UPDATE_URL, { winsForModes: data } as Profile);
			});
		// Improvement areas:
		// - mercs info: best mythic bounty level, bounties completed, heroic bounties completed, fewest turns per bounty
		// - arena: wins with each class?
		// - solo adventure progress (dungeon runs & co: wins with each hero, maybe some more detailed info if it is available)
	}
}
