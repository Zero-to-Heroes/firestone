import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { BgsBestStat } from '@firestone-hs/user-bgs-post-match-stats';
import { BgsBestUserStatsService } from '@legacy-import/src/lib/js/services/battlegrounds/bgs-best-user-stats.service';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { groupByFunction } from '../../../../services/utils';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';
import { HeroStat } from './hero-stat';

@Component({
	selector: 'battlegrounds-heroes-records-broken',
	styleUrls: [
		`../../../../../css/component/battlegrounds/desktop/secondary/battlegrounds-heroes-records-broken.component.scss`,
	],
	template: `
		<div class="battlegrounds-heroes-records-broken" *ngIf="stats$ | async as stats">
			<with-loading [isLoading]="!stats?.length">
				<div class="title" [owTranslate]="'app.battlegrounds.personal-stats.records.title'"></div>
				<ul class="list">
					<battlegrounds-hero-records-broken
						*ngFor="let stat of stats; trackBy: trackByFn"
						[stat]="stat"
					></battlegrounds-hero-records-broken>
				</ul>
			</with-loading>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsHeroesRecordsBrokenComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit
{
	stats$: Observable<readonly HeroStat[]>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly bgsBgsUserStats: BgsBestUserStatsService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		await this.bgsBgsUserStats.isReady();

		this.stats$ = this.bgsBgsUserStats.bestStats$$.pipe(
			filter((bestBgsUserStats) => !!bestBgsUserStats?.length),
			this.mapData((bestBgsUserStats) => {
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

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	trackByFn(index, item: HeroStat) {
		return item.heroId;
	}
}
