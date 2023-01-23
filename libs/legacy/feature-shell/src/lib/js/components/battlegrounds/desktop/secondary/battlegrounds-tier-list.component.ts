import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
} from '@angular/core';
import { MmrPercentile } from '@firestone-hs/bgs-global-stats';
import { Race } from '@firestone-hs/reference-data';
import { OverwolfService } from '@firestone/shared/framework/core';
import { combineLatest, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { BgsHeroStat, BgsHeroTier } from '../../../../models/battlegrounds/stats/bgs-hero-stat';
import { getTribeName } from '../../../../services/battlegrounds/bgs-utils';
import { BgsFilterLiveMmrEvent } from '../../../../services/battlegrounds/store/events/bgs-filter-live-mmr-event';
import { BgsFilterLiveTribesEvent } from '../../../../services/battlegrounds/store/events/bgs-filter-live-tribes-event';
import { BattlegroundsStoreEvent } from '../../../../services/battlegrounds/store/events/_battlegrounds-store-event';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { groupByFunction, sumOnArray } from '../../../../services/utils';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';
import { getBgsRankFilterLabelFor } from '../filters/battlegrounds-rank-filter-dropdown.component';
import { getBgsTimeFilterLabelFor } from '../filters/battlegrounds-time-filter-dropdown.component';

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
			<div class="filters" *ngIf="showFilters">
				<preference-toggle
					field="bgsUseTribeFilterInHeroSelection"
					[label]="'settings.battlegrounds.general.use-tribe-filter-for-live-stats-label-short' | owTranslate"
					[tooltip]="'settings.battlegrounds.general.use-tribe-filter-for-live-stats-tooltip' | owTranslate"
					[toggleFunction]="toggleUseTribeFilter"
				></preference-toggle>
				<preference-toggle
					field="bgsUseMmrFilterInHeroSelection"
					[label]="'settings.battlegrounds.general.use-mmr-filter-for-live-stats-label-short' | owTranslate"
					[tooltip]="'settings.battlegrounds.general.use-mmr-filter-for-live-stats-tooltip' | owTranslate"
					[toggleFunction]="toggleUseMmrFilter"
				></preference-toggle>
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
export class BattlegroundsTierListComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterViewInit, AfterContentInit
{
	@Input() showFilters: boolean;

	stats$: Observable<{ tiers: readonly HeroTier[]; tooltip: string; totalMatches: number }>;

	private battlegroundsUpdater: EventEmitter<BattlegroundsStoreEvent>;
	private percentiles: readonly MmrPercentile[] = [];

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly ow: OverwolfService,
	) {
		super(store, cdr);
	}

	async ngAfterViewInit() {
		this.battlegroundsUpdater = (await this.ow.getMainWindow()).battlegroundsUpdater;
	}

	ngAfterContentInit() {
		this.store
			.listen$(([main, nav, prefs]) => main.battlegrounds.globalStats.mmrPercentiles)
			.pipe(this.mapData(([percentiles]) => percentiles))
			.subscribe((percentiles) => {
				this.percentiles = percentiles;
			});
		this.stats$ = combineLatest(
			this.store.bgHeroStats$(),
			this.store.listen$(
				([main, nav, prefs]) => main.battlegrounds.globalStats.mmrPercentiles,
				([main, nav, prefs]) => main.battlegrounds.globalStats.allTribes,
				([main, nav, prefs]) => main.battlegrounds.globalStats.lastUpdateDate,
				([main, nav, prefs]) => prefs.bgsActiveTimeFilter,
				([main, nav, prefs]) => prefs.bgsActiveRankFilter,
				([main, nav, prefs]) => prefs.bgsActiveTribesFilter,
			),
		).pipe(
			filter(
				([stats, [mmrPercentiles, allTribes, lastUpdateDate, timeFilter, rankFilter, tribesFilter]]) =>
					!!stats?.length,
			),
			map(([stats, [mmrPercentiles, allTribes, lastUpdateDate, timeFilter, rankFilter, tribesFilter]]) => ({
				stats: stats,
				mmrPercentiles: mmrPercentiles,
				allTribes: allTribes,
				lastUpdateDate: lastUpdateDate,
				timeFilter: timeFilter,
				rankFilter: rankFilter,
				tribesFilter: tribesFilter,
			})),
			this.mapData((info) => {
				const stats = info.stats;
				const totalMatches = sumOnArray(stats, (stat) => stat.totalMatches);
				const groupingByTier = groupByFunction((overview: BgsHeroStat) => overview.tier);
				const groupedByTier: (readonly BgsHeroStat[])[] = Object.values(groupingByTier(stats));
				const tiers: readonly HeroTier[] = [
					{
						tier: 'S' as BgsHeroTier,
						heroes: [
							...(groupedByTier.find((heroes) => heroes.find((hero) => hero.tier === 'S')) ?? []),
						].sort((a, b) => a.averagePosition - b.averagePosition),
					},
					{
						tier: 'A' as BgsHeroTier,
						heroes: [
							...(groupedByTier.find((heroes) => heroes.find((hero) => hero.tier === 'A')) ?? []),
						].sort((a, b) => a.averagePosition - b.averagePosition),
					},
					{
						tier: 'B' as BgsHeroTier,
						heroes: [
							...(groupedByTier.find((heroes) => heroes.find((hero) => hero.tier === 'B')) ?? []),
						].sort((a, b) => a.averagePosition - b.averagePosition),
					},
					{
						tier: 'C' as BgsHeroTier,
						heroes: [
							...(groupedByTier.find((heroes) => heroes.find((hero) => hero.tier === 'C')) ?? []),
						].sort((a, b) => a.averagePosition - b.averagePosition),
					},
					{
						tier: 'D' as BgsHeroTier,
						heroes: [
							...(groupedByTier.find((heroes) => heroes.find((hero) => hero.tier === 'D')) ?? []),
						].sort((a, b) => a.averagePosition - b.averagePosition),
					},
					{
						tier: 'E' as BgsHeroTier,
						heroes: [
							...(groupedByTier.find((heroes) => heroes.find((hero) => hero.tier === 'E')) ?? []),
						].sort((a, b) => a.averagePosition - b.averagePosition),
					},
				].filter((tier) => !!tier.heroes?.length);
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
								<li class="filter time">${getBgsTimeFilterLabelFor(info.timeFilter, null, this.i18n)}</li>
								<li class="filter rank">${getBgsRankFilterLabelFor(
									info.mmrPercentiles?.find(
										(percentile) => percentile.percentile === info.rankFilter,
									),
									this.i18n,
								)}</li>
								<li class="filter tribesFilter">${this.buildTribesFilterText(info.tribesFilter, info.allTribes)}</li>
							</ul>
							<div class="footer">${lastUpdateText}</div>
						</div>
					`,
				};
			}),
		);
	}

	trackByTierFn(index, item: HeroTier) {
		return item.tier;
	}

	toggleUseTribeFilter = (newValue: boolean) => {
		this.battlegroundsUpdater?.next(new BgsFilterLiveTribesEvent(newValue));
	};

	toggleUseMmrFilter = (newValue: boolean) => {
		this.battlegroundsUpdater?.next(new BgsFilterLiveMmrEvent(newValue, this.percentiles));
	};

	private buildTribesFilterText(tribesFilter: readonly Race[], allTribes: readonly Race[]): string {
		if (!tribesFilter?.length || tribesFilter.length === allTribes.length) {
			return this.i18n.translateString('app.battlegrounds.filters.tribe.all-tribes');
		}
		return tribesFilter
			.map((tribe) => getTribeName(tribe, this.i18n))
			.sort()
			.join(', ');
	}
}

interface HeroTier {
	readonly tier: BgsHeroTier;
	readonly heroes: readonly BgsHeroStat[];
}
