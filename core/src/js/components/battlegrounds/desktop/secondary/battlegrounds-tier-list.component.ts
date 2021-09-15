import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { combineLatest, Observable } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';
import { BgsHeroStat, BgsHeroTier } from '../../../../models/battlegrounds/stats/bgs-hero-stat';
import { OverwolfService } from '../../../../services/overwolf.service';
import { AppUiStoreService, cdLog } from '../../../../services/ui-store/app-ui-store.service';
import { groupByFunction, sumOnArray } from '../../../../services/utils';
import { getBgsRankFilterLabelFor } from '../filters/battlegrounds-rank-filter-dropdown.component';
import { getBgsTimeFilterLabelFor } from '../filters/battlegrounds-time-filter-dropdown.component';

@Component({
	selector: 'battlegrounds-tier-list',
	styleUrls: [
		`../../../../../css/global/components-global.scss`,
		`../../../../../css/component/battlegrounds/desktop/secondary/battlegrounds-tier-list.component.scss`,
	],
	template: `
		<div class="battlegrounds-tier-list" *ngIf="{ stats: stats$ | async } as value">
			<div class="title">
				Heroes Tier List ({{ value.stats.totalMatches.toLocaleString('en-US') }} matches)
				<div class="info" [helpTooltip]="value.stats.tooltip" helpTooltipClasses="bgs-heroes-tier-list-tooltip">
					<svg>
						<use xlink:href="assets/svg/sprite.svg#info" />
					</svg>
				</div>
			</div>
			<div class="heroes">
				<bgs-hero-tier
					*ngFor="let tier of value.stats.tiers || []; trackBy: trackByTierFn"
					[tier]="tier"
				></bgs-hero-tier>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsTierListComponent {
	stats$: Observable<{ tiers: readonly HeroTier[]; tooltip: string; totalMatches: number }>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly store: AppUiStoreService,
		private readonly cdr: ChangeDetectorRef,
	) {
		this.stats$ = combineLatest(
			this.store.bgHeroStats$(),
			this.store.listen$(
				([main, nav, prefs]) => main.battlegrounds.globalStats.mmrPercentiles,
				([main, nav, prefs]) => prefs.bgsActiveTimeFilter,
				([main, nav, prefs]) => prefs.bgsActiveRankFilter,
			),
		).pipe(
			filter(([stats, [mmrPercentiles, timeFilter, rankFilter]]) => !!stats),
			map(([stats, [mmrPercentiles, timeFilter, rankFilter]]) => ({
				stats: stats,
				mmrPercentiles: mmrPercentiles,
				timeFilter: timeFilter,
				rankFilter: rankFilter,
			})),
			map((info) => {
				const stats = info.stats;
				const totalMatches = sumOnArray(stats, (stat) => stat.totalMatches);
				const groupingByTier = groupByFunction((overview: BgsHeroStat) => overview.tier);
				const groupedByTier: BgsHeroStat[][] = Object.values(groupingByTier(stats));
				const tiers: readonly HeroTier[] = [
					{
						tier: 'S' as BgsHeroTier,
						heroes: groupedByTier
							.find((heroes) => heroes.find((hero) => hero.tier === 'S'))
							?.sort((a, b) => a.averagePosition - b.averagePosition),
					},
					{
						tier: 'A' as BgsHeroTier,
						heroes: groupedByTier
							.find((heroes) => heroes.find((hero) => hero.tier === 'A'))
							?.sort((a, b) => a.averagePosition - b.averagePosition),
					},
					{
						tier: 'B' as BgsHeroTier,
						heroes: groupedByTier
							.find((heroes) => heroes.find((hero) => hero.tier === 'B'))
							?.sort((a, b) => a.averagePosition - b.averagePosition),
					},
					{
						tier: 'C' as BgsHeroTier,
						heroes: groupedByTier
							.find((heroes) => heroes.find((hero) => hero.tier === 'C'))
							?.sort((a, b) => a.averagePosition - b.averagePosition),
					},
					{
						tier: 'D' as BgsHeroTier,
						heroes: groupedByTier
							.find((heroes) => heroes.find((hero) => hero.tier === 'D'))
							?.sort((a, b) => a.averagePosition - b.averagePosition),
					},
				].filter((tier) => tier.heroes);
				return {
					tiers: tiers,
					totalMatches: totalMatches,
					tooltip: `
						<div class="content">
							<div class="title">Built from ${totalMatches.toLocaleString('en-US')} matches filtering for:</div>
							<ul class="filters">
								<li class="filter time">${getBgsTimeFilterLabelFor(info.timeFilter)}</li>
								<li class="filter rank">${getBgsRankFilterLabelFor(
									info.mmrPercentiles.find((percentile) => percentile.percentile === info.rankFilter),
								)}</li>
							</ul>
						</div>
					`,
				};
			}),
			// FIXME
			tap((filter) => setTimeout(() => this.cdr?.detectChanges(), 0)),
			tap((info) => cdLog('emitting tiers in ', this.constructor.name, info)),
		);
	}

	trackByTierFn(index, item: HeroTier) {
		return item.tier;
	}
}

interface HeroTier {
	readonly tier: BgsHeroTier;
	readonly heroes: readonly BgsHeroStat[];
}
