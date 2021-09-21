import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BgsBestStat } from '@firestone-hs/user-bgs-post-match-stats';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, tap } from 'rxjs/operators';
import { AppUiStoreService, cdLog } from '../../../../services/ui-store/app-ui-store.service';
import { arraysEqual, groupByFunction } from '../../../../services/utils';
import { HeroStat } from './hero-stat';

@Component({
	selector: 'battlegrounds-heroes-records-broken',
	styleUrls: [
		`../../../../../css/component/battlegrounds/desktop/secondary/battlegrounds-heroes-records-broken.component.scss`,
		`../../../../../css/global/components-global.scss`,
	],
	template: `
		<div class="battlegrounds-heroes-records-broken">
			<div class="title">Best record heroes</div>
			<ul class="list">
				<battlegrounds-hero-records-broken
					*ngFor="let stat of (stats$ | async) || []; trackBy: trackByFn"
					[stat]="stat"
				></battlegrounds-hero-records-broken>
			</ul>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsHeroesRecordsBrokenComponent {
	stats$: Observable<readonly HeroStat[]>;

	constructor(private readonly store: AppUiStoreService) {
		this.stats$ = this.store
			.listen$(([main, nav]) => main.stats.bestBgsUserStats)
			.pipe(
				filter(([bestBgsUserStats]) => !!bestBgsUserStats?.length),
				map(([bestBgsUserStats]) => {
					const groupingByHero = groupByFunction((stat: BgsBestStat) => stat.heroCardId);
					const validRecords = bestBgsUserStats.filter((stat) => stat.heroCardId);
					const statsByHero: readonly BgsBestStat[][] = Object.values(groupingByHero(validRecords));
					return statsByHero
						.filter((stats) => stats.length > 0)
						.map(
							(stats) =>
								({
									heroId: stats[0].heroCardId,
									numberOfRecords: stats.length,
								} as HeroStat),
						)
						.sort((a, b) => b.numberOfRecords - a.numberOfRecords);
				}),
				distinctUntilChanged((a, b) => arraysEqual(a, b)),
				tap((info) => cdLog('emitting record broken heroes in ', this.constructor.name, info)),
			);
	}

	trackByFn(index, item: HeroStat) {
		return item.heroId;
	}
}
