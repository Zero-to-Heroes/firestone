import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { CardsFacadeService } from '../../../services/cards-facade.service';
import { MercenariesHeroStat } from '../../../services/mercenaries/mercenaries-state-builder.service';
import { getHeroRole } from '../../../services/mercenaries/mercenaries-utils';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { filterMercenariesHeroStats } from '../../../services/ui-store/mercenaries-ui-helper';
import { groupByFunction, sumOnArray } from '../../../services/utils';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';
import { MercenaryInfo } from './mercenary-info';

const THRESHOLD = 50;

@Component({
	selector: 'mercenaries-meta-hero-stats',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/mercenaries/desktop/mercenaries-meta-hero-stats.component.scss`,
	],
	template: `
		<div class="mercenaries-stats" *ngIf="(stats$ | async)?.length; else searchEmptyState" scrollable>
			<mercenaries-meta-hero-stat
				*ngFor="let stat of stats$ | async; trackBy: trackByFn"
				[stat]="stat"
			></mercenaries-meta-hero-stat>
		</div>
		<ng-template #searchEmptyState>
			<mercenaries-empty-state
				[title]="'mercenaries.search-empty-state.title' | owTranslate"
				[subtitle]="'mercenaries.search-empty-state.subtitle' | owTranslate"
			></mercenaries-empty-state>
		</ng-template>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesMetaHeroStatsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	stats$: Observable<readonly MercenaryInfo[]>;

	constructor(
		private readonly allCards: CardsFacadeService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		// TODO: split into 2 obs: one where the actual data updates, and one that just
		// shows/hide data (like role of search string)
		this.stats$ = this.store
			.listen$(
				([main, nav]) => main.mercenaries.getGlobalStats(),
				([main, nav]) => main.mercenaries.getReferenceData(),
				([main, nav]) => nav.navigationMercenaries.heroSearchString,
				([main, nav, prefs]) => prefs.mercenariesActiveRoleFilter,
				([main, nav, prefs]) => prefs.mercenariesActivePvpMmrFilter,
				([main, nav, prefs]) => prefs.mercenariesActiveStarterFilter,
				([main, nav, prefs]) => prefs.mercenariesActiveHeroLevelFilter2,
			)
			.pipe(
				filter(
					([
						globalStats,
						referenceData,
						heroSearchString,
						roleFilter,
						mmrFilter,
						starterFilter,
						levelFilter,
					]) => !!globalStats?.pvp?.heroStats?.length && !!referenceData,
				),
				this.mapData(
					([
						globalStats,
						referenceData,
						heroSearchString,
						roleFilter,
						mmrFilter,
						starterFilter,
						levelFilter,
					]) => {
						const heroStats = filterMercenariesHeroStats(
							globalStats.pvp.heroStats,
							'pvp',
							roleFilter,
							null,
							mmrFilter,
							starterFilter,
							levelFilter,
							this.allCards,
							referenceData,
							heroSearchString,
						);
						const heroStatsByHero = groupByFunction((stat: MercenariesHeroStat) => stat.heroCardId)(
							heroStats,
						);
						// const gameStatsByHero = groupByFunction((stat: GameStat) =>
						// 	normalizeMercenariesCardId(stat.playerCardId),
						// )(gameStats);
						const totalMatches = sumOnArray(heroStats, (stat) => stat.totalMatches);
						const result = Object.keys(heroStatsByHero)
							.map((heroCardId) => {
								const heroStats = heroStatsByHero[heroCardId];
								// The hero card id is already normalized in the global stats
								// const gameStats = gameStatsByHero[heroCardId];
								// const refHeroStat = heroStats[0];
								const globalTotalMatches = sumOnArray(heroStats, (stat) => stat.totalMatches);
								return {
									id: heroCardId,
									name: this.allCards.getCard(heroCardId)?.name ?? heroCardId,
									role: getHeroRole(this.allCards.getCard(heroCardId).mercenaryRole),
									globalTotalMatches: globalTotalMatches,
									globalWinrate:
										globalTotalMatches === 0
											? null
											: (100 * sumOnArray(heroStats, (stat) => stat.totalWins)) /
											  globalTotalMatches,
									globalPopularity: (100 * globalTotalMatches) / totalMatches,
									// playerTotalMatches: gameStats?.length ?? 0,
									// playerWinrate: !gameStats?.length
									// 	? null
									// 	: (100 * gameStats.filter((stat) => stat.result === 'won').length) /
									// 	  gameStats.length,
								} as MercenaryInfo;
							})
							.filter((stat) => stat.globalTotalMatches > THRESHOLD)
							.sort((a, b) => b.globalWinrate - a.globalWinrate);
						return result;
					},
				),
			);
	}

	trackByFn(index: number, item: MercenaryInfo) {
		return item.id;
	}
}
