import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { ExtendedConfig } from '@components/battlegrounds/hero-selection/bgs-hero-selection-overview.component';
import { ALL_BG_RACES, Race, getTribeName, isBattlegroundsDuo } from '@firestone-hs/reference-data';
import {
	BgsMetaHeroStatsService,
	BgsPlayerHeroStatsService,
	BgsStateFacadeService,
	DEFAULT_MMR_PERCENTILE,
} from '@firestone/battlegrounds/common';
import { BgsHeroTier, BgsMetaHeroStatTierItem, buildTiers } from '@firestone/battlegrounds/data-access';
import { getBgsRankFilterLabelFor, getBgsTimeFilterLabelFor } from '@firestone/battlegrounds/view';
import { GameStateFacadeService } from '@firestone/game-state';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent, deepEqual } from '@firestone/shared/framework/common';
import { CardsFacadeService, waitForReady } from '@firestone/shared/framework/core';
import { MainWindowStateFacadeService } from '@legacy-import/src/lib/js/services/mainwindow/store/main-window-state-facade.service';
import { Observable, combineLatest } from 'rxjs';
import { distinctUntilChanged, filter, map, switchMap, takeUntil } from 'rxjs/operators';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { sortByProperties, sumOnArray } from '../../../../services/utils';

@Component({
	selector: 'battlegrounds-tier-list',
	styleUrls: [`../../../../../css/component/battlegrounds/desktop/secondary/battlegrounds-tier-list.component.scss`],
	template: `
		<div class="battlegrounds-tier-list" *ngIf="stats$ | async as stats">
			<div class="title">
				{{
					'app.battlegrounds.tier-list.header'
						| owTranslate: { value: stats.totalMatches.toLocaleString('en-US') }
				}}
				<div class="info" [helpTooltip]="stats.tooltip" helpTooltipClasses="bgs-heroes-tier-list-tooltip">
					<svg>
						<use xlink:href="assets/svg/sprite.svg#info" />
					</svg>
				</div>
			</div>
			<div class="heroes" scrollable>
				<bgs-hero-tier
					*ngFor="let tier of stats.tiers || []; trackBy: trackByTierFn"
					[tier]="tier"
				></bgs-hero-tier>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsTierListComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	@Input() showFilters: boolean;

	stats$: Observable<{ tiers: readonly HeroTier[]; tooltip: string; totalMatches: number }>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly allCards: CardsFacadeService,
		private readonly mainWindowState: MainWindowStateFacadeService,
		private readonly playerHeroStats: BgsPlayerHeroStatsService,
		private readonly metaHeroStats: BgsMetaHeroStatsService,
		private readonly prefs: PreferencesService,
		private readonly bgsState: BgsStateFacadeService,
		private readonly gameState: GameStateFacadeService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(
			this.metaHeroStats,
			this.playerHeroStats,
			this.mainWindowState,
			this.prefs,
			this.bgsState,
			this.gameState,
		);

		// FIXME: looks like the rankFilter changes every time???
		const statsConfig$: Observable<ExtendedConfig> = combineLatest([
			this.gameState.gameState$$,
			this.bgsState.gameState$$,
			this.prefs.preferences$$,
		]).pipe(
			filter(([gameState, bgState, prefs]) => !!gameState && !!bgState && !!prefs),
			this.mapData(([gameState, bgState, prefs]) => {
				const config: ExtendedConfig = {
					gameMode: isBattlegroundsDuo(gameState.metadata.gameType) ? 'battlegrounds-duo' : 'battlegrounds',
					timeFilter: 'last-patch',
					mmrFilter: prefs.bgsActiveUseMmrFilterInHeroSelection ? bgState.currentGame?.mmrAtStart ?? 0 : null,
					rankFilter: DEFAULT_MMR_PERCENTILE,
					tribesFilter: prefs.bgsActiveUseTribesFilterInHeroSelection
						? bgState.currentGame?.availableRaces
						: [],
					anomaliesFilter: [] as readonly string[], //bgState.currentGame?.anomalies ?? [],
				};
				return config;
			}),
			distinctUntilChanged((a, b) => deepEqual(a, b)),
			takeUntil(this.destroyed$),
		);

		const stats$ = statsConfig$.pipe(
			distinctUntilChanged((a, b) => deepEqual(a, b)),
			switchMap((config) => this.playerHeroStats.buildFinalStats(config, config.mmrFilter)),
		);

		this.stats$ = combineLatest([stats$, statsConfig$]).pipe(
			filter(
				([{ stats, mmrPercentile, lastUpdatedDate }, { timeFilter, rankFilter, tribesFilter }]) =>
					!!stats?.length && !!mmrPercentile && !!lastUpdatedDate,
			),
			map(
				([
					{ stats, mmrPercentile, lastUpdatedDate },
					{ timeFilter, rankFilter, tribesFilter, anomaliesFilter },
				]) => ({
					stats: stats,
					mmrPercentile: mmrPercentile,
					allTribes: ALL_BG_RACES,
					lastUpdateDate: lastUpdatedDate,
					timeFilter: timeFilter,
					rankFilter: rankFilter,
					tribesFilter: tribesFilter,
					anomaliesFilter: [] as readonly string[], //BG_USE_ANOMALIES ? anomaliesFilter : [],
				}),
			),
			this.mapData((info) => {
				const stats = info.stats;
				const totalMatches = sumOnArray(stats, (stat) => stat.dataPoints);

				const refTiers = buildTiers(
					[...stats].sort(sortByProperties((s) => [s.averagePosition])),
					this.i18n,
					false,
				);
				const tiers: readonly HeroTier[] = refTiers.map(
					(tier) =>
						({
							tier: tier.label,
							heroes: tier.items,
						} as HeroTier),
				);

				const title = this.i18n.translateString('battlegrounds.hero-selection.tier-list-title-tooltip', {
					totalMatches: totalMatches.toLocaleString('en-US'),
				});
				const lastUpdateText = this.i18n.translateString(
					'battlegrounds.hero-selection.tier-list-title-footer',
					{
						lastUpdateDate: new Date(info.lastUpdateDate).toLocaleString(this.i18n.formatCurrentLocale()),
					},
				);
				return {
					tiers: tiers,
					totalMatches: totalMatches,
					tooltip: `
						<div class="content">
							<div class="title">${title}</div>
							<ul class="filters">
								<li class="filter time">${getBgsTimeFilterLabelFor(info.timeFilter, this.i18n)}</li>
								<li class="filter rank">${getBgsRankFilterLabelFor(info.mmrPercentile, this.i18n)}</li>
								<li class="filter tribesFilter">${this.buildTribesFilterText(info.tribesFilter, info.allTribes)}</li>
								<li class="filter anomaliesFilter">${this.buildAnomaliesFilterText(info.anomaliesFilter)}</li>
							</ul>
							<div class="footer">${lastUpdateText}</div>
						</div>
					`,
				};
			}),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	trackByTierFn(index, item: HeroTier) {
		return item.tier;
	}

	private buildTribesFilterText(tribesFilter: readonly Race[], allTribes: readonly Race[]): string {
		console.debug('tribes filter', tribesFilter, allTribes);
		if (!tribesFilter?.length || tribesFilter.length === allTribes.length) {
			return this.i18n.translateString('app.battlegrounds.filters.tribe.all-tribes');
		}
		return tribesFilter
			.map((tribe) => getTribeName(tribe, this.i18n))
			.sort()
			.join(', ');
	}

	private buildAnomaliesFilterText(anomaliesFilter: readonly string[]): string {
		if (!anomaliesFilter?.length) {
			return this.i18n.translateString('app.battlegrounds.filters.anomaly.all-anomalies');
		}
		return anomaliesFilter
			.map((a) => this.allCards.getCard(a).name)
			.sort()
			.join(', ');
	}
}

interface HeroTier {
	readonly tier: BgsHeroTier;
	readonly heroes: readonly BgsMetaHeroStatTierItem[];
}
