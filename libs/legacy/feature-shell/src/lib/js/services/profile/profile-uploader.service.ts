import { Injectable } from '@angular/core';
import { CardsForSet, Profile, ProfileAchievementCategory, ProfileBgHeroStat } from '@firestone-hs/api-user-profile';
import { normalizeHeroCardId } from '@firestone-hs/reference-data';
import { AchievementsRefLoaderService, HsRefAchievement } from '@firestone/achievements/data-access';
import { groupByFunction } from '@firestone/shared/framework/common';
import { ApiRunner, CardsFacadeService } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, combineLatest, debounceTime, distinctUntilChanged, filter, map } from 'rxjs';
import { CollectionCardType } from '../../models/collection/collection-card-type.type';
import { Set as CollectionSet } from '../../models/set';
import { AchievementsMemoryMonitor } from '../achievement/achievements-memory-monitor.service';
import { getAchievementSectionIdFromHeroCardId } from '../battlegrounds/bgs-utils';
import { AppUiStoreFacadeService } from '../ui-store/app-ui-store-facade.service';
import { deepEqual } from '../utils';

const PROFILE_UPDATE_URL = 'https://7n2xgqrutsr3by2n2wncsi25ou0mttjp.lambda-url.us-west-2.on.aws/';

@Injectable()
export class ProfileUploaderService {
	private uniqueBgHeroes: readonly string[];

	private refAchievements$$ = new BehaviorSubject<readonly HsRefAchievement[]>([]);

	constructor(
		private readonly store: AppUiStoreFacadeService,
		private readonly achievementsMonitor: AchievementsMemoryMonitor,
		private readonly api: ApiRunner,
		private readonly allCards: CardsFacadeService,
		private readonly achievementsRefLoader: AchievementsRefLoaderService,
	) {
		this.init();
	}

	private async init() {
		await this.store.initComplete();
		this.achievementsRefLoader.loadRefData();

		this.initCollection();
		this.initAchievements();
		this.initBattlegrounds();
	}

	private initCollection() {
		// TODO: don't upload if the collection didn't change since last upload
		const setsToUpload$ = combineLatest([this.store.isPremiumUser$(), this.store.sets$()]).pipe(
			filter(([premium, sets]) => premium),
			// So that we don't spam the server when the user is opening packs
			debounceTime(10000),
			map(([premium, sets]) => {
				console.debug('[profile] sets', sets);
				return sets.map((set) => {
					return {
						id: set.id,
						global: this.buildCardsSetForPremium(set, null),
						vanilla: this.buildCardsSetForPremium(set, 'NORMAL'),
						golden: this.buildCardsSetForPremium(set, 'GOLDEN'),
						diamond: this.buildCardsSetForPremium(set, 'DIAMOND'),
						signature: this.buildCardsSetForPremium(set, 'SIGNATURE'),
					};
				});
			}),
		);
		setsToUpload$
			.pipe(
				filter((sets) => !!sets?.length),
				distinctUntilChanged((a, b) => deepEqual(a, b)),
			)
			.subscribe(async (sets) => {
				console.debug('[profile] will upload sets', sets);
				const payload: Profile = {
					sets: sets,
				};
				console.debug('[profile] updating profile with payload', payload);
				this.api.callPostApiSecure(PROFILE_UPDATE_URL, payload);
			});
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

	private initBattlegrounds() {
		this.uniqueBgHeroes = [
			...new Set(
				this.allCards
					.getCards()
					.filter((c) => c.battlegroundsHero)
					.map((c) => normalizeHeroCardId(c.id, this.allCards)),
			),
		];
		const achievementsData$ = this.achievementsRefLoader.refData$$.pipe(
			filter((refData) => !!refData?.achievements?.length),
			map((refData) => {
				return this.uniqueBgHeroes
					.map((heroCardId) => {
						const sectionId = getAchievementSectionIdFromHeroCardId(heroCardId);
						const achievementsForSection = refData.achievements
							.filter((ach) => ach.sectionId === sectionId)
							.filter((ach) => ach.quota === 1);
						if (!achievementsForSection?.length) {
							return null;
						}
						const groupedBySortOrder = groupByFunction((ach: HsRefAchievement) => ach.sortOrder)(
							achievementsForSection,
						);
						// They "should" be sorted by default. Sorting them manually is definitely possible, but
						// bothersome enough that we can skip it for now
						const placementAchievements: readonly HsRefAchievement[] = Object.values(
							groupedBySortOrder,
						).find((achs) => achs.length === 3);
						// console.debug(
						// 	'[profile] placementAchievements',
						// 	placementAchievements,
						// 	achievementsForSection,
						// 	sectionId,
						// 	heroCardId,
						// 	refData,
						// );
						return {
							sectionId: sectionId,
							heroCardId: heroCardId,
							heroName: this.allCards.getCard(heroCardId).name,
							steps: placementAchievements.map((a) => a.id),
						};
					})
					.filter((data) => !!data);
			}),
		);
		const bgFullTimeStatsByHero$ = combineLatest([
			achievementsData$,
			this.store.isPremiumUser$(),
			this.achievementsMonitor.nativeAchievements$$,
		]).pipe(
			filter(
				([achievementsData, premium, nativeAchievements]) =>
					premium && !!achievementsData?.length && !!nativeAchievements?.length,
			),
			debounceTime(10000),
			map(([achievementsData, premium, nativeAchievements]) => {
				return achievementsData.map((data) => {
					return {
						heroCardId: data.heroCardId,
						// heroName: data.heroName,
						gamesPlayed: nativeAchievements.find((a) => a.id === data.steps[0])?.progress ?? 0,
						top4: nativeAchievements.find((a) => a.id === data.steps[1])?.progress ?? 0,
						top1: nativeAchievements.find((a) => a.id === data.steps[2])?.progress ?? 0,
					} as ProfileBgHeroStat;
				});
			}),
		);
		bgFullTimeStatsByHero$
			.pipe(distinctUntilChanged((a, b) => deepEqual(a, b)))
			.subscribe(async (bgFullTimeStatsByHero) => {
				console.debug('[profile] will upload bgFullTimeStatsByHero', bgFullTimeStatsByHero);
				const payload: Profile = {
					bgFullTimeStatsByHero: bgFullTimeStatsByHero,
				};
				console.debug('[profile] updating profile with payload', payload);
				this.api.callPostApiSecure(PROFILE_UPDATE_URL, payload);
			});
	}

	private buildCardsSetForPremium(set: CollectionSet, premium: CollectionCardType): CardsForSet {
		return {
			common: set.ownedForRarity('Common', premium),
			rare: set.ownedForRarity('Rare', premium),
			epic: set.ownedForRarity('Epic', premium),
			legendary: set.ownedForRarity('Legendary', premium),
		};
	}
}
