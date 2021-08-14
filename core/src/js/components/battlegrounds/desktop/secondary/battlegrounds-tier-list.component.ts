import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, tap } from 'rxjs/operators';
import { BgsHeroStat, BgsHeroTier } from '../../../../models/battlegrounds/stats/bgs-hero-stat';
import { OverwolfService } from '../../../../services/overwolf.service';
import { AppUiStoreService, cdLog } from '../../../../services/ui-store/app-ui-store.service';
import { arraysEqual, groupByFunction } from '../../../../services/utils';

@Component({
	selector: 'battlegrounds-tier-list',
	styleUrls: [
		`../../../../../css/component/battlegrounds/desktop/secondary/battlegrounds-tier-list.component.scss`,
		`../../../../../css/global/components-global.scss`,
	],
	template: `
		<div class="battlegrounds-tier-list">
			<div class="title">Heroes Tier List</div>
			<bgs-hero-tier
				*ngFor="let tier of (tiers$ | async) || []; trackBy: trackByTierFn"
				[tier]="tier"
			></bgs-hero-tier>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsTierListComponent {
	tiers$: Observable<readonly HeroTier[]>;

	constructor(private readonly ow: OverwolfService, private readonly store: AppUiStoreService) {
		this.tiers$ = this.store
			.listen$(([main, nav]) => main.battlegrounds.stats.heroStats)
			.pipe(
				filter(([stats]) => !!stats),
				map(([stats]) => stats),
				distinctUntilChanged((a, b) => arraysEqual(a, b)),
				map((stats) => {
					const relevant: readonly BgsHeroStat[] = stats.filter((stat) => stat.id !== 'average');
					const groupingByTier = groupByFunction((overview: BgsHeroStat) => overview.tier);
					const groupedByTier: BgsHeroStat[][] = Object.values(groupingByTier(relevant));
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
					return tiers;
				}),
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
