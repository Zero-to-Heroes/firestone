import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { BgsBestStat } from '@firestone-hs/user-bgs-post-match-stats';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { groupByFunction } from '../../../../services/utils';
import { AbstractSubscriptionComponent } from '../../../abstract-subscription.component';
import { HeroStat } from './hero-stat';

declare let amplitude;

@Component({
	selector: 'battlegrounds-heroes-records-broken',
	styleUrls: [
		`../../../../../css/component/battlegrounds/desktop/secondary/battlegrounds-heroes-records-broken.component.scss`,
		`../../../../../css/global/components-global.scss`,
	],
	template: `
		<div class="battlegrounds-heroes-records-broken">
			<div class="title" [owTranslate]="'app.battlegrounds.personal-stats.records.title'"></div>
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
export class BattlegroundsHeroesRecordsBrokenComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit {
	stats$: Observable<readonly HeroStat[]>;

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.stats$ = this.store
			.listen$(([main, nav]) => main.stats.bestBgsUserStats)
			.pipe(
				filter(([bestBgsUserStats]) => !!bestBgsUserStats?.length),
				this.mapData(([bestBgsUserStats]) => {
					const groupingByHero = groupByFunction((stat: BgsBestStat) => stat.heroCardId);
					const validRecords = bestBgsUserStats.filter((stat) => stat.heroCardId);
					const statsByHero: (readonly BgsBestStat[])[] = Object.values(groupingByHero(validRecords));
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
			);

		amplitude.getInstance().logEvent('records-broken-page-view');
	}

	trackByFn(index, item: HeroStat) {
		return item.heroId;
	}
}
