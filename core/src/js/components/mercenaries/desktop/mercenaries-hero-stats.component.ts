import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { ScenarioId } from '@firestone-hs/reference-data';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, takeUntil, tap } from 'rxjs/operators';
import { GameStat } from '../../../models/mainwindow/stats/game-stat';
import {
	MercenariesHeroLevelFilterType,
	MercenariesPvpMmrFilterType,
	MercenariesRoleFilterType,
	MercenariesStarterFilterType,
} from '../../../models/mercenaries/mercenaries-filter-types';
import { CardsFacadeService } from '../../../services/cards-facade.service';
import {
	MercenariesGlobalStats,
	MercenariesHeroStat,
	MercenariesReferenceData,
} from '../../../services/mercenaries/mercenaries-state-builder.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { cdLog } from '../../../services/ui-store/app-ui-store.service';
import { filterMercenariesHeroStats } from '../../../services/ui-store/mercenaries-ui-helper';
import { arraysEqual, groupByFunction, sumOnArray } from '../../../services/utils';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';
import { MercenaryInfo } from './mercenary-info';

const THRESHOLD = 50;

@Component({
	selector: 'mercenaries-hero-stats',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/mercenaries/desktop/mercenaries-hero-stats.component.scss`,
	],
	template: `
		<div class="mercenaries-stats" scrollable>
			<mercenaries-hero-stat
				*ngFor="let stat of stats$ | async; trackBy: trackByFn"
				[stat]="stat"
			></mercenaries-hero-stat>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesHeroStatsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
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
				([main, nav]) => main.mercenaries.globalStats,
				([main, nav]) => main.mercenaries.referenceData,
				([main, nav]) => main.stats.gameStats,
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
						gameStats,
						heroSearchString,
						roleFilter,
						mmrFilter,
						starterFilter,
						levelFilter,
					]) => !!globalStats?.pvp?.heroStats?.length,
				),
				map(
					([
						globalStats,
						referenceData,
						gameStats,
						heroSearchString,
						roleFilter,
						mmrFilter,
						starterFilter,
						levelFilter,
					]) =>
						[
							globalStats,
							referenceData,
							gameStats.stats.filter((stat) => stat.scenarioId === ScenarioId.LETTUCE_PVP),
							heroSearchString,
							roleFilter,
							mmrFilter,
							starterFilter,
							levelFilter,
						] as [
							MercenariesGlobalStats,
							MercenariesReferenceData,
							readonly GameStat[],
							string,
							MercenariesRoleFilterType,
							MercenariesPvpMmrFilterType,
							MercenariesStarterFilterType,
							MercenariesHeroLevelFilterType,
						],
				),
				distinctUntilChanged((a, b) => arraysEqual(a, b)),
				tap((info) => console.debug('filtering', info)),
				map(
					([
						globalStats,
						referenceData,
						gameStats,
						heroSearchString,
						roleFilter,
						mmrFilter,
						starterFilter,
						levelFilter,
					]) => {
						return [
							filterMercenariesHeroStats(
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
							),
							// filterMercenariesRuns(
							// 	gameStats,
							// 	'pvp',
							// 	roleFilter,
							// 	null,
							// 	mmrFilter,
							// 	starterFilter,
							// 	levelFilter,
							// ),
							roleFilter,
							heroSearchString,
							referenceData,
						] as [
							readonly MercenariesHeroStat[],
							// readonly GameStat[],
							MercenariesRoleFilterType,
							string,
							MercenariesReferenceData,
						];
					},
				),
				map(([heroStats, roleFilter, heroSearchString, referenceData]) => {
					console.debug('heroStats', heroStats);
					const heroStatsByHero = groupByFunction((stat: MercenariesHeroStat) => stat.heroCardId)(heroStats);
					// const gameStatsByHero = groupByFunction((stat: GameStat) =>
					// 	normalizeMercenariesCardId(stat.playerCardId),
					// )(gameStats);
					const totalMatches = sumOnArray(heroStats, (stat) => stat.totalMatches);
					return Object.keys(heroStatsByHero)
						.map((heroCardId) => {
							const heroStats = heroStatsByHero[heroCardId];
							// The hero card id is already normalized in the global stats
							// const gameStats = gameStatsByHero[heroCardId];
							const refHeroStat = heroStats[0];
							const globalTotalMatches = sumOnArray(heroStats, (stat) => stat.totalMatches);
							return {
								id: heroCardId,
								name: this.allCards.getCard(heroCardId)?.name ?? heroCardId,
								role: refHeroStat.heroRole,
								globalTotalMatches: globalTotalMatches,
								globalWinrate:
									globalTotalMatches === 0
										? null
										: (100 * sumOnArray(heroStats, (stat) => stat.totalWins)) / globalTotalMatches,
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
				}),
				tap((filter) =>
					setTimeout(() => {
						if (!(this.cdr as ViewRef)?.destroyed) {
							this.cdr.detectChanges();
						}
					}, 0),
				),
				tap((info) => cdLog('emitting stats in ', this.constructor.name, info)),
				takeUntil(this.destroyed$),
			);
	}

	trackByFn(index: number, item: MercenaryInfo) {
		return item.id;
	}
}
