import { Injectable } from '@angular/core';
import { ProfileBgHeroStat } from '@firestone-hs/api-user-profile';
import { SceneMode, normalizeHeroCardId } from '@firestone-hs/reference-data';
import { AchievementsRefLoaderService, HsRefAchievement } from '@firestone/achievements/data-access';
import { SceneService } from '@firestone/memory';
import { SubscriberAwareBehaviorSubject, groupByFunction } from '@firestone/shared/framework/common';
import { CardsFacadeService, LocalStorageService } from '@firestone/shared/framework/core';
import { combineLatest, debounceTime, distinctUntilChanged, filter, from, map, take } from 'rxjs';
import { AchievementsMemoryMonitor } from '../../achievement/data/achievements-memory-monitor.service';
import { getAchievementSectionIdFromHeroCardId } from '../../battlegrounds/bgs-utils';
import { AppUiStoreFacadeService } from '../../ui-store/app-ui-store-facade.service';
import { deepEqual } from '../../utils';

@Injectable()
export class InternalProfileBattlegroundsService {
	public bgFullTimeStatsByHero$$ = new SubscriberAwareBehaviorSubject<readonly ProfileBgHeroStat[]>([]);

	constructor(
		private readonly store: AppUiStoreFacadeService,
		private readonly achievementsMonitor: AchievementsMemoryMonitor,
		private readonly achievementsRefLoader: AchievementsRefLoaderService,
		private readonly allCards: CardsFacadeService,
		private readonly localStorage: LocalStorageService,
		private readonly sceneService: SceneService,
	) {
		this.init();
	}

	private async init() {
		await this.store.initComplete();
		await this.sceneService.isReady();

		// Only sync info when going into a BG scene
		this.bgFullTimeStatsByHero$$.onFirstSubscribe(() => {
			this.initLocalCache();

			// Don't require premium sub here, as the info is also used elsewhere (on the app's profile)
			this.sceneService.currentScene$$
				.pipe(
					filter((scene) => [SceneMode.BACON, SceneMode.BACON_COLLECTION].includes(scene)),
					take(1),
				)
				.subscribe(() => {
					this.initBattlegrounds();
				});
		});
	}

	private initLocalCache() {
		this.bgFullTimeStatsByHero$$.subscribe((bgHeroStats) => {
			console.debug('[profile-info] will update bgHeroStats local cache', bgHeroStats);
			if (!!bgHeroStats?.length) {
				this.localStorage.setItem(LocalStorageService.LOCAL_STORAGE_BG_HERO_STAT, bgHeroStats);
			}
		});
		const cachedInfo = this.localStorage.getItem<readonly ProfileBgHeroStat[]>(
			LocalStorageService.LOCAL_STORAGE_BG_HERO_STAT,
		);
		if (!!cachedInfo?.length) {
			this.bgFullTimeStatsByHero$$.next(cachedInfo);
		}
	}

	private initBattlegrounds() {
		const uniqueBgHeroes = [
			...new Set(
				this.allCards
					.getCards()
					.filter((c) => c.battlegroundsHero)
					.map((c) => normalizeHeroCardId(c.id, this.allCards)),
			),
		];
		const achievementsData$ = from(this.achievementsRefLoader.refData$$).pipe(
			filter((refData) => !!refData?.achievements?.length),
			map((refData) => {
				return uniqueBgHeroes
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
			this.achievementsMonitor.achievementsFromMemory$$,
			this.sceneService.currentScene$$,
		]).pipe(
			filter(
				([achievementsData, nativeAchievements, currentScene]) =>
					[SceneMode.BACON, SceneMode.BACON_COLLECTION].includes(currentScene) &&
					!!achievementsData?.length &&
					!!nativeAchievements?.length,
			),
			distinctUntilChanged((a, b) => a[0] === b[0] && a[1] === b[1]),
			debounceTime(2000),
			map(([achievementsData, nativeAchievements]) => {
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
				console.debug('[profile] bgFullTimeStatsByHero', bgFullTimeStatsByHero);
				this.bgFullTimeStatsByHero$$.next(bgFullTimeStatsByHero);
			});
	}
}
