import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { Race } from '@firestone-hs/reference-data';
import { combineLatest, Observable } from 'rxjs';
import { filter, map, takeUntil, tap } from 'rxjs/operators';
import { BgsHeroStat, BgsHeroTier } from '../../../../models/battlegrounds/stats/bgs-hero-stat';
import { getTribeName } from '../../../../services/battlegrounds/bgs-utils';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { cdLog } from '../../../../services/ui-store/app-ui-store.service';
import { groupByFunction, sumOnArray } from '../../../../services/utils';
import { AbstractSubscriptionComponent } from '../../../abstract-subscription.component';
import { getBgsRankFilterLabelFor } from '../filters/battlegrounds-rank-filter-dropdown.component';
import { getBgsTimeFilterLabelFor } from '../filters/battlegrounds-time-filter-dropdown.component';

@Component({
	selector: 'battlegrounds-tier-list',
	styleUrls: [
		`../../../../../css/global/components-global.scss`,
		`../../../../../css/component/battlegrounds/desktop/secondary/battlegrounds-tier-list.component.scss`,
	],
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
			<div class="heroes">
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
	stats$: Observable<{ tiers: readonly HeroTier[]; tooltip: string; totalMatches: number }>;

	constructor(
		private readonly i18n: LocalizationFacadeService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.stats$ = combineLatest(
			this.store.bgHeroStats$(),
			this.store.listen$(
				([main, nav, prefs]) => main.battlegrounds.globalStats.mmrPercentiles,
				([main, nav, prefs]) => main.battlegrounds.globalStats.allTribes,
				([main, nav, prefs]) => prefs.bgsActiveTimeFilter,
				([main, nav, prefs]) => prefs.bgsActiveRankFilter,
				([main, nav, prefs]) => prefs.bgsActiveTribesFilter,
			),
		).pipe(
			filter(([stats, [mmrPercentiles, allTribes, timeFilter, rankFilter, tribesFilter]]) => !!stats),
			map(([stats, [mmrPercentiles, allTribes, timeFilter, rankFilter, tribesFilter]]) => ({
				stats: stats,
				mmrPercentiles: mmrPercentiles,
				allTribes: allTribes,
				timeFilter: timeFilter,
				rankFilter: rankFilter,
				tribesFilter: tribesFilter,
			})),
			map((info) => {
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
				return {
					tiers: tiers,
					totalMatches: totalMatches,
					tooltip: `
						<div class="content">
							<div class="title">Built from ${totalMatches.toLocaleString('en-US')} matches filtering for:</div>
							<ul class="filters">
								<li class="filter time">${getBgsTimeFilterLabelFor(info.timeFilter, null, this.i18n)}</li>
								<li class="filter rank">${getBgsRankFilterLabelFor(
									info.mmrPercentiles.find((percentile) => percentile.percentile === info.rankFilter),
									this.i18n,
								)}</li>
								<li class="filter tribesFilter">${this.buildTribesFilterText(info.tribesFilter, info.allTribes)}</li>
							</ul>
						</div>
					`,
				};
			}),
			// FIXME
			tap((filter) =>
				setTimeout(() => {
					if (!(this.cdr as ViewRef)?.destroyed) {
						this.cdr.detectChanges();
					}
				}, 0),
			),
			tap((info) => cdLog('emitting tiers in ', this.constructor.name, info)),
			takeUntil(this.destroyed$),
		);
	}

	trackByTierFn(index, item: HeroTier) {
		return item.tier;
	}

	private buildTribesFilterText(tribesFilter: readonly Race[], allTribes: readonly Race[]): string {
		if (!tribesFilter?.length || tribesFilter.length === allTribes.length) {
			return 'All tribes';
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
