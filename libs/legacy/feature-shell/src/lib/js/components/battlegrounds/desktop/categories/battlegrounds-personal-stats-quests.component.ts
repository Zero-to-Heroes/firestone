import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { BgsQuestStat } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

// UNUSED
@Component({
	selector: 'battlegrounds-personal-stats-quests',
	styleUrls: [
		`../../../../../css/component/battlegrounds/desktop/categories/battlegrounds-personal-stats-heroes.component.scss`,
	],
	template: `
		<section
			class="battlegrounds-personal-stats-heroes"
			[attr.aria-label]="'Battlegrounds quest stats'"
			role="list"
		>
			<battlegrounds-stats-quest-vignette
				*ngFor="let stat of stats$ | async; trackBy: trackByFn"
				role="listitem"
				[stat]="stat"
			></battlegrounds-stats-quest-vignette>
		</section>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsPersonalStatsQuestsComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit
{
	stats$: Observable<readonly BgsQuestStat[]>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		// this.stats$ = combineLatest(
		// 	this.store.gameStats$(),
		// 	this.store.listen$(
		// 		([main, nav]) => main.battlegrounds.globalStats.getQuestStats(),
		// 		([main, nav]) => main.battlegrounds.globalStats.mmrPercentiles,
		// 		([main, nav, prefs]) => prefs.bgsActiveTimeFilter,
		// 		([main, nav, prefs]) => prefs.bgsActiveRankFilter,
		// 		([main, nav, prefs]) => prefs.bgsActiveHeroSortFilter,
		// 		([main, nav]) => main.battlegrounds.currentBattlegroundsMetaPatch,
		// 	),
		// ).pipe(
		// 	filter(([gameStats, [stats, mmrPercentiles, timeFilter, rankFilter, heroSort, patch]]) => !!stats?.length),
		// 	this.mapData(([gameStats, [stats, mmrPercentiles, timeFilter, rankFilter, heroSort, patch]]) => {
		// 		return buildQuestStats(
		// 			stats,
		// 			mmrPercentiles,
		// 			gameStats,
		// 			timeFilter,
		// 			rankFilter,
		// 			heroSort,
		// 			patch,
		// 			this.allCards,
		// 		);
		// 	}),
		// );
	}

	trackByFn(index: number, stat: BgsQuestStat) {
		return stat.id;
	}
}
