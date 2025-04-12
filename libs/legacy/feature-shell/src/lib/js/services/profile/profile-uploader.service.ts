import { Injectable } from '@angular/core';
import {
	CardsForSet,
	Profile,
	ProfileAchievementCategory,
	ProfileBgHeroStat,
	ProfileClassProgress,
	ProfilePackStat,
	ProfileSet,
	ProfileWinsForMode,
} from '@firestone-hs/api-user-profile';
import { DiskCacheService, GameStatusService } from '@firestone/shared/common/service';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { ApiRunner, waitForReady } from '@firestone/shared/framework/core';
import { combineLatest, distinctUntilChanged, filter, map, skip, take } from 'rxjs';
import { AdService } from '../ad.service';
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
		private readonly diskCache: DiskCacheService,
		private readonly ads: AdService,
	) {
		window['profileClassesProgress'] = this.internalProfileInfo.classesProgress$$;
		window['profileBgHeroStat'] = this.internalBattlegrounds.bgFullTimeStatsByHero$$;
		this.init();
	}

	private async init() {
		await this.store.initComplete();
		await waitForReady(this.ads);

		const elligible$ = combineLatest([this.gameStatus.inGame$$, this.ads.hasPremiumSub$$]).pipe(
			map(([inGame, hasPremium]) => inGame && hasPremium),
			filter((elligible) => elligible),
			distinctUntilChanged(),
		);

		// Wait until we know the user is a premium user AND in game to subscribe
		elligible$
			.pipe(
				filter((elligible) => elligible),
				take(1),
			)
			.subscribe(() => {
				combineLatest([elligible$, this.internalAchievements.achievementCategories$$])
					.pipe(
						filter(([elligible, data]) => elligible && !!data?.length),
						distinctUntilChanged(
							([_, a], [__, b]) =>
								a?.length === b?.length &&
								!!a?.every((info, index) => equalProfileAchievementCategory(info, b[index])),
						),
					)
					.subscribe(async ([_, data]) => {
						const lastUpload = await this.diskCache.getItem(
							DiskCacheService.DISK_CACHE_KEYS.PROFILE_ACHIEVEMENTS,
						);
						if (!deepEqual(lastUpload, data)) {
							this.api.callPostApiSecure(PROFILE_UPDATE_URL, { achievements: data } as Profile);
							this.diskCache.storeItem(DiskCacheService.DISK_CACHE_KEYS.PROFILE_ACHIEVEMENTS, data);
						}
					});
				combineLatest([elligible$, this.internalBattlegrounds.bgFullTimeStatsByHero$$])
					.pipe(
						filter(([elligible, data]) => elligible && !!data?.length),
						distinctUntilChanged(
							([_, a], [__, b]) =>
								a?.length === b?.length &&
								!!a?.every((info, index) => equalProfileBgHeroStat(info, b[index])),
						),
					)
					.subscribe(async ([_, data]) => {
						const lastUpload = await this.diskCache.getItem(
							DiskCacheService.DISK_CACHE_KEYS.PROFILE_BG_FULL_TIME_STATS_BY_HERO,
						);
						if (!deepEqual(lastUpload, data)) {
							this.api.callPostApiSecure(PROFILE_UPDATE_URL, { bgFullTimeStatsByHero: data } as Profile);
							this.diskCache.storeItem(
								DiskCacheService.DISK_CACHE_KEYS.PROFILE_BG_FULL_TIME_STATS_BY_HERO,
								data,
							);
						}
					});
				combineLatest([elligible$, this.internalCollection.sets$$])
					.pipe(
						filter(([elligible, data]) => elligible && !!data?.length),
						distinctUntilChanged(
							([_, a], [__, b]) =>
								a?.length === b?.length && !!a?.every((info, index) => equalProfileSet(info, b[index])),
						),
					)
					.subscribe(async ([_, data]) => {
						const lastUpload = await this.diskCache.getItem(DiskCacheService.DISK_CACHE_KEYS.PROFILE_SETS);
						if (!deepEqual(lastUpload, data)) {
							this.api.callPostApiSecure(PROFILE_UPDATE_URL, { sets: data } as Profile);
							this.diskCache.storeItem(DiskCacheService.DISK_CACHE_KEYS.PROFILE_SETS, data);
						}
					});
				combineLatest([elligible$, this.internalCollection.packsAllTime$$])
					.pipe(
						filter(([elligible, data]) => elligible && !!data?.length),
						distinctUntilChanged(
							([_, a], [__, b]) =>
								a?.length === b?.length &&
								!!a?.every((info, index) => equalProfilePackStat(info, b[index])),
						),
					)
					.subscribe(async ([_, data]) => {
						const lastUpload = await this.diskCache.getItem(DiskCacheService.DISK_CACHE_KEYS.PROFILE_PACKS);
						if (!deepEqual(lastUpload, data)) {
							this.api.callPostApiSecure(PROFILE_UPDATE_URL, { packsAllTime: data } as Profile);
							this.diskCache.storeItem(DiskCacheService.DISK_CACHE_KEYS.PROFILE_PACKS, data);
						}
					});
				// Don't upload on startup
				combineLatest([elligible$, this.internalProfileInfo.classesProgress$$.pipe(skip(1))])
					.pipe(
						filter(([elligible, data]) => elligible && !!data?.length),
						distinctUntilChanged(
							([_, a], [__, b]) =>
								a?.length === b?.length &&
								!!a?.every((info, index) => equalProfileClassProgress(info, b[index])),
						),
					)
					.subscribe(async ([_, data]) => {
						const lastUpload = await this.diskCache.getItem(
							DiskCacheService.DISK_CACHE_KEYS.PROFILE_CLASSES_PROGRESS,
						);
						// console.debug('[profile] classesProgress', data, lastUpload);
						if (!deepEqual(lastUpload, data)) {
							this.api.callPostApiSecure(PROFILE_UPDATE_URL, { classesProgress: data } as Profile);
							this.diskCache.storeItem(DiskCacheService.DISK_CACHE_KEYS.PROFILE_CLASSES_PROGRESS, data);
						}
					});
				combineLatest([elligible$, this.internalProfileInfo.winsForMode$$.pipe(skip(1))])
					.pipe(
						filter(([elligible, data]) => elligible && !!data?.length),
						distinctUntilChanged(([_, a], [__, b]) => equalProfileWinsForMode(a, b)),
					)
					.subscribe(async ([_, data]) => {
						const lastUpload = await this.diskCache.getItem(
							DiskCacheService.DISK_CACHE_KEYS.PROFILE_WINS_FOR_MODE,
						);
						// console.debug('[profile] winsForMode', data, lastUpload);
						if (!deepEqual(lastUpload, data)) {
							this.api.callPostApiSecure(PROFILE_UPDATE_URL, { winsForModes: data } as Profile);
							this.diskCache.storeItem(DiskCacheService.DISK_CACHE_KEYS.PROFILE_WINS_FOR_MODE, data);
						}
					});
			});
		// Improvement areas:
		// - mercs info: best mythic bounty level, bounties completed, heroic bounties completed, fewest turns per bounty
		// - arena: wins with each class?
		// - solo adventure progress (dungeon runs & co: wins with each hero, maybe some more detailed info if it is available)
	}
}

export const equalProfileAchievementCategory = (
	a: ProfileAchievementCategory | null | undefined,
	b: ProfileAchievementCategory | null | undefined,
): boolean => {
	if (!a && !b) {
		return true;
	}
	if (!a || !b) {
		return false;
	}
	if (a.id !== b.id) {
		return false;
	}
	return (
		a.availablePoints === b.availablePoints &&
		a.completedAchievements === b.completedAchievements &&
		a.id === b.id &&
		a.points === b.points &&
		a.totalAchievements === b.totalAchievements
	);
};
export const equalProfileBgHeroStat = (
	a: ProfileBgHeroStat | null | undefined,
	b: ProfileBgHeroStat | null | undefined,
): boolean => {
	if (!a && !b) {
		return true;
	}
	if (!a || !b) {
		return false;
	}
	if (a.heroCardId !== b.heroCardId) {
		return false;
	}
	return a.gamesPlayed === b.gamesPlayed && a.top1 === b.top1 && a.top4 === b.top4 && a.heroCardId === b.heroCardId;
};
export const equalProfileSet = (a: ProfileSet | null | undefined, b: ProfileSet | null | undefined): boolean => {
	if (!a && !b) {
		return true;
	}
	if (!a || !b) {
		return false;
	}
	if (a.id !== b.id) {
		return false;
	}
	return (
		equalCardsForSet(a.global, b.global) &&
		equalCardsForSet(a.vanilla, b.vanilla) &&
		equalCardsForSet(a.golden, b.golden) &&
		equalCardsForSet(a.diamond, b.diamond) &&
		equalCardsForSet(a.signature, b.signature)
	);
};
const equalCardsForSet = (a: CardsForSet | null | undefined, b: CardsForSet | null | undefined): boolean => {
	if (!a && !b) {
		return true;
	}
	if (!a || !b) {
		return false;
	}
	return a.common === b.common && a.epic === b.epic && a.legendary === b.legendary && a.rare === b.rare;
};
export const equalProfilePackStat = (
	a: ProfilePackStat | null | undefined,
	b: ProfilePackStat | null | undefined,
): boolean => {
	if (!a && !b) {
		return true;
	}
	if (!a || !b) {
		return false;
	}
	if (a.id !== b.id) {
		return false;
	}
	return a.totalObtained === b.totalObtained && a.id === b.id;
};
const equalProfileClassProgress = (
	a: ProfileClassProgress | null | undefined,
	b: ProfileClassProgress | null | undefined,
): boolean => {
	if (!a && !b) {
		return true;
	}
	if (!a || !b) {
		return false;
	}
	if (a.playerClass !== b.playerClass) {
		return false;
	}
	return (
		a.level === b.level &&
		a.wins === b.wins &&
		a.losses === b.losses &&
		a.ties === b.ties &&
		a.playerClass === b.playerClass &&
		equalProfileWinsForMode(a.winsForModes, b.winsForModes)
	);
};
const equalProfileWinsForMode = (
	a: readonly ProfileWinsForMode[] | null | undefined,
	b: readonly ProfileWinsForMode[] | null | undefined,
): boolean => {
	if (!a && !b) {
		return true;
	}
	if (!a || !b) {
		return false;
	}
	if (a.length !== b.length) {
		return false;
	}
	return a.every((info, index) => equalProfileWinsForModeInfo(info, b[index]));
};
const equalProfileWinsForModeInfo = (
	a: ProfileWinsForMode | null | undefined,
	b: ProfileWinsForMode | null | undefined,
): boolean => {
	if (!a && !b) {
		return true;
	}
	if (!a || !b) {
		return false;
	}
	if (a.mode !== b.mode) {
		return false;
	}
	return a.wins === b.wins && a.losses === b.losses && a.ties === b.ties && a.mode === b.mode;
};
