import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { ALL_BG_RACES } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import {
	BgsMetaHeroStatTier,
	BgsMetaHeroStatTierItem,
	buildHeroStats,
	buildTiers,
	enhanceHeroStat,
} from '@legacy-import/src/lib/js/services/battlegrounds/bgs-meta-hero-stats';
import { isBattlegrounds } from '@legacy-import/src/lib/js/services/battlegrounds/bgs-utils';
import { LocalizationFacadeService } from '@legacy-import/src/lib/js/services/localization-facade.service';
import { filterBgsMatchStats } from '@legacy-import/src/lib/js/services/ui-store/bgs-ui-helper';
import { sortByProperties } from '@legacy-import/src/lib/js/services/utils';
import { combineLatest, distinctUntilChanged, map, Observable } from 'rxjs';
import { AppUiStoreFacadeService } from '../../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../../abstract-subscription-store.component';

@Component({
	selector: 'battlegrounds-meta-stats-heroes',
	styleUrls: [
		`../../../../../../css/component/battlegrounds/desktop/categories/meta/battlegrounds-meta-stats-hero-columns.scss`,
		`../../../../../../css/component/battlegrounds/desktop/categories/meta/battlegrounds-meta-stats-heroes.component.scss`,
	],
	template: `
		<section
			class="battlegrounds-meta-stats-heroes"
			[attr.aria-label]="'Battlegrounds meta hero stats'"
			*ngIf="{ tiers: tiers$ | async } as value"
		>
			<div class="header">
				<div class="portrait"></div>
				<div class="hero-details" [owTranslate]="'app.battlegrounds.tier-list.header-hero-details'"></div>
				<div class="position" [owTranslate]="'app.battlegrounds.tier-list.header-average-position'"></div>
				<div
					class="placement"
					[owTranslate]="'app.battlegrounds.tier-list.header-placement-distribution'"
				></div>
				<div
					class="net-mmr"
					[owTranslate]="'app.battlegrounds.tier-list.header-net-mmr'"
					[helpTooltip]="'app.battlegrounds.personal-stats.hero.net-mmr-tooltip' | owTranslate"
				></div>
				<!-- <div class="winrate" [owTranslate]="'app.battlegrounds.tier-list.header-combat-winrate'"></div> -->
			</div>
			<div class="heroes-list" role="list" scrollable>
				<battlegrounds-meta-stats-hero-tier
					*ngFor="let tier of value.tiers; trackBy: trackByFn"
					role="listitem"
					[tier]="tier"
				></battlegrounds-meta-stats-hero-tier>
			</div>
		</section>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsMetaStatsHeroesComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit
{
	tiers$: Observable<readonly BgsMetaHeroStatTier[]>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly allCards: CardsFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		combineLatest([
			this.store.bgsMetaStatsHero$(),
			this.store.listenPrefs$((prefs) => prefs.bgsActiveHeroSortFilter),
		]).pipe(
			this.mapData(([stats, [heroSort]]) => {
				switch (heroSort) {
					case 'tier':
						return buildTiers([...stats].sort(sortByProperties((s) => [s.averagePosition])), this.i18n);
					case 'average-position':
						// Make sure we keep the items without data at the end
						return this.buildMonoTier(
							[...stats].sort(sortByProperties((s) => [s.playerAveragePosition ?? 9])),
						);
					case 'games-played':
						return this.buildMonoTier([...stats].sort(sortByProperties((s) => [-s.playerDataPoints])));
					case 'mmr':
						return this.buildMonoTier(
							[...stats].sort(sortByProperties((s) => [-(s.playerNetMmr ?? -10000)])),
						);
					case 'last-played':
						return this.buildMonoTier(
							[...stats].sort(sortByProperties((s) => [-s.playerLastPlayedTimestamp])),
						);
				}
			}),
		);

		const statsWithOnlyGlobalData$ = combineLatest([
			this.store.listen$(([main]) => main.battlegrounds.getMetaHeroStats()),
			this.store.listenPrefs$(
				(prefs) => prefs.bgsActiveRankFilter,
				(prefs) => prefs.bgsActiveTribesFilter,
			),
		]).pipe(
			this.mapData(([[stats], [bgsActiveRankFilter, bgsActiveTribesFilter]]) => {
				console.debug('showing meta hero stats', stats);
				const result: readonly BgsMetaHeroStatTierItem[] = buildHeroStats(
					stats?.heroStats,
					bgsActiveRankFilter,
					bgsActiveTribesFilter,
				);
				console.debug('built global stats', result);
				return result;
			}),
		);

		const playerBgGames$ = combineLatest([
			this.store.gameStats$(),
			this.store.listen$(
				([main]) => main.battlegrounds.getMetaHeroStats()?.mmrPercentiles ?? [],
				([main]) => main.battlegrounds.currentBattlegroundsMetaPatch,
			),
			this.store.listenPrefs$(
				(prefs) => prefs.bgsActiveRankFilter,
				(prefs) => prefs.bgsActiveTribesFilter,
				(prefs) => prefs.bgsActiveTimeFilter,
			),
		]).pipe(
			distinctUntilChanged(),
			map(([games, [mmrPercentiles, patchInfo], [rankFilter, tribesFilter, timeFilter]]) => {
				const targetRank: number =
					!mmrPercentiles?.length || !rankFilter
						? 0
						: mmrPercentiles.find((m) => m.percentile === rankFilter)?.mmr ?? 0;
				console.debug('targetRank', targetRank);
				const bgGames = games
					.filter((g) => isBattlegrounds(g.gameMode))
					.filter(
						(g) =>
							!tribesFilter?.length ||
							tribesFilter.length === ALL_BG_RACES.length ||
							tribesFilter.some((t) => g.bgsAvailableTribes?.includes(t)),
					);
				console.debug('will filter', bgGames, timeFilter, targetRank, patchInfo);
				const afterFilter = filterBgsMatchStats(bgGames, timeFilter, targetRank, patchInfo);
				return afterFilter;
			}),
			distinctUntilChanged(),
			this.mapData((info) => info),
		);

		const enhancedStats$ = combineLatest([statsWithOnlyGlobalData$, playerBgGames$]).pipe(
			this.mapData(([stats, playerBgGames]) =>
				stats.map((stat) => enhanceHeroStat(stat, playerBgGames, this.allCards)),
			),
		);

		this.tiers$ = combineLatest([
			enhancedStats$,
			this.store.listenPrefs$((prefs) => prefs.bgsActiveHeroSortFilter),
		]).pipe(
			this.mapData(([stats, [heroSort]]) => {
				switch (heroSort) {
					case 'tier':
						return buildTiers(stats.sort(sortByProperties((s) => [s.averagePosition])), this.i18n);
					case 'average-position':
						// Make sure we keep the items without data at the end
						return this.buildMonoTier(stats.sort(sortByProperties((s) => [s.playerAveragePosition ?? 9])));
					case 'games-played':
						return this.buildMonoTier(stats.sort(sortByProperties((s) => [-s.playerDataPoints])));
					case 'mmr':
						return this.buildMonoTier(stats.sort(sortByProperties((s) => [-(s.playerNetMmr ?? -10000)])));
					case 'last-played':
						return this.buildMonoTier(stats.sort(sortByProperties((s) => [-s.playerLastPlayedTimestamp])));
				}
			}),
		);
	}

	trackByFn(index: number, stat: BgsMetaHeroStatTier) {
		return stat.label;
	}

	private buildMonoTier(items: BgsMetaHeroStatTierItem[]): readonly BgsMetaHeroStatTier[] {
		return [
			{
				label: null,
				tooltip: null,
				items: items,
			},
		];
	}
}
