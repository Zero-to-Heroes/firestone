import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { combineLatest, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { BgsHeroStat, BgsQuestStat } from '../../../../models/battlegrounds/stats/bgs-hero-stat';
import { CardsFacadeService } from '../../../../services/cards-facade.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { buildQuestStats } from '../../../../services/ui-store/bgs-ui-helper';
import { AbstractSubscriptionComponent } from '../../../abstract-subscription.component';

@Component({
	selector: 'battlegrounds-personal-stats-quests',
	styleUrls: [
		`../../../../../css/global/components-global.scss`,
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
	extends AbstractSubscriptionComponent
	implements AfterContentInit {
	stats$: Observable<readonly BgsQuestStat[]>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.stats$ = combineLatest(
			this.store.gameStats$(),
			this.store.listen$(
				([main, nav]) => main.battlegrounds.globalStats.getQuestStats(),
				([main, nav]) => main.battlegrounds.globalStats.mmrPercentiles,
				([main, nav, prefs]) => prefs.bgsActiveTimeFilter,
				([main, nav, prefs]) => prefs.bgsActiveRankFilter,
				([main, nav, prefs]) => prefs.bgsActiveHeroSortFilter,
				([main, nav]) => main.battlegrounds.currentBattlegroundsMetaPatch,
			),
		).pipe(
			filter(([gameStats, [stats, mmrPercentiles, timeFilter, rankFilter, heroSort, patch]]) => !!stats?.length),
			this.mapData(([gameStats, [stats, mmrPercentiles, timeFilter, rankFilter, heroSort, patch]]) => {
				return buildQuestStats(
					stats,
					mmrPercentiles,
					gameStats,
					timeFilter,
					rankFilter,
					heroSort,
					patch,
					this.allCards,
				);
			}),
		);
	}

	trackByFn(index: number, stat: BgsQuestStat) {
		return stat.id;
	}
}
