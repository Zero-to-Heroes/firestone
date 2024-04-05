import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { ALL_BG_RACES, Race, getTribeName } from '@firestone-hs/reference-data';
import { BG_USE_ANOMALIES, BgsMetaHeroStatsService, BgsPlayerHeroStatsService } from '@firestone/battlegrounds/common';
import { BgsHeroTier, BgsMetaHeroStatTierItem, buildTiers } from '@firestone/battlegrounds/data-access';
import { getBgsRankFilterLabelFor, getBgsTimeFilterLabelFor } from '@firestone/battlegrounds/view';
import { deepEqual } from '@firestone/shared/framework/common';
import { CardsFacadeService, OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { MainWindowStateFacadeService } from '@legacy-import/src/lib/js/services/mainwindow/store/main-window-state-facade.service';
import { Observable, combineLatest } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { sortByProperties, sumOnArray } from '../../../../services/utils';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

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
export class BattlegroundsTierListComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	@Input() showFilters: boolean;

	stats$: Observable<{ tiers: readonly HeroTier[]; tooltip: string; totalMatches: number }>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly ow: OverwolfService,
		private readonly allCards: CardsFacadeService,
		private readonly mainWindowState: MainWindowStateFacadeService,
		private readonly playerHeroStats: BgsPlayerHeroStatsService,
		private readonly metaHeroStats: BgsMetaHeroStatsService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.metaHeroStats, this.playerHeroStats, this.mainWindowState);

		this.stats$ = combineLatest([
			this.playerHeroStats.tiersWithPlayerData$$,
			this.metaHeroStats.metaHeroStats$$.pipe(
				this.mapData(
					(stats) => ({
						mmrPercentiles: stats?.mmrPercentiles,
						lastUpdateDate: stats?.lastUpdateDate,
					}),
					(a, b) => deepEqual(a, b),
				),
			),
			this.store.listen$(
				([main, nav, prefs]) => prefs.bgsActiveTimeFilter,
				([main, nav, prefs]) => prefs.bgsActiveRankFilter,
				([main, nav, prefs]) => prefs.bgsActiveTribesFilter,
				([main, nav, prefs]) => prefs.bgsActiveAnomaliesFilter,
			),
		]).pipe(
			filter(
				([stats, { mmrPercentiles, lastUpdateDate }, [timeFilter, rankFilter, tribesFilter]]) =>
					!!stats?.length && !!mmrPercentiles?.length && !!lastUpdateDate,
			),
			map(
				([
					stats,
					{ mmrPercentiles, lastUpdateDate },
					[timeFilter, rankFilter, tribesFilter, anomaliesFilter],
				]) => ({
					stats: stats,
					mmrPercentiles: mmrPercentiles,
					allTribes: ALL_BG_RACES,
					lastUpdateDate: lastUpdateDate,
					timeFilter: timeFilter,
					rankFilter: rankFilter,
					tribesFilter: tribesFilter,
					anomaliesFilter: BG_USE_ANOMALIES ? anomaliesFilter : [],
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
								<li class="filter rank">${getBgsRankFilterLabelFor(
									info.mmrPercentiles?.find(
										(percentile) => percentile.percentile === info.rankFilter,
									),
									this.i18n,
								)}</li>
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
