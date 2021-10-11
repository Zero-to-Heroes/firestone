import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, tap } from 'rxjs/operators';
import { GameStat } from '../../../models/mainwindow/stats/game-stat';
import { MercenariesModeFilterType } from '../../../models/mercenaries/mercenaries-mode-filter.type';
import { MercenariesPveDifficultyFilterType } from '../../../models/mercenaries/mercenaries-pve-difficulty-filter.type';
import { MercenariesPvpMmrFilterType } from '../../../models/mercenaries/mercenaries-pvp-mmr-filter.type';
import { CardsFacadeService } from '../../../services/cards-facade.service';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import {
	MercenariesComposition,
	MercenariesGlobalStats,
} from '../../../services/mercenaries/mercenaries-state-builder.service';
import { OverwolfService } from '../../../services/overwolf.service';
import { AppUiStoreService, cdLog } from '../../../services/ui-store/app-ui-store.service';
import { filterMercenariesCompositions } from '../../../services/ui-store/mercenaries-ui-helper';
import { arraysEqual, groupByFunction, sumOnArray } from '../../../services/utils';
import { MercenaryCompositionInfo, MercenaryCompositionInfoBench, MercenaryInfo } from './mercenary-info';

@Component({
	selector: 'mercenaries-compositions-stats',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/mercenaries/desktop/mercenaries-compositions-stats.component.scss`,
	],
	template: `
		<div class="mercenaries-compositions-stats" scrollable>
			<ng-container *ngIf="stats$ | async as stats; else emptyState">
				<div class="header">
					<div
						class="starter"
						helpTooltip="The 3 heroes that start the match. Compositions are grouped based on this starter trio"
					>
						Starters
					</div>
					<div class="bench" helpTooltip="An example of a possible bench for this composition">Bench</div>
					<div class="stat winrate">Global winrate</div>
					<div class="stat matches">Total matches</div>
				</div>
				<mercenaries-composition-stat
					*ngFor="let stat of stats; trackBy: trackByFn"
					[stat]="stat"
				></mercenaries-composition-stat>
			</ng-container>
			<ng-template #emptyState> <mercenaries-empty-state></mercenaries-empty-state></ng-template>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesCompositionsStatsComponent implements AfterViewInit {
	stats$: Observable<readonly MercenaryCompositionInfo[]>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly store: AppUiStoreService,
		private readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
	) {
		this.stats$ = this.store
			.listen$(
				([main, nav]) => main.mercenaries.globalStats,
				([main, nav]) => main.stats.gameStats,
				([main, nav, prefs]) => prefs.mercenariesActiveModeFilter,
				([main, nav, prefs]) => prefs.mercenariesActivePveDifficultyFilter,
				([main, nav, prefs]) => prefs.mercenariesActivePvpMmrFilter,
			)
			.pipe(
				filter(
					([globalStats, gameStats, modeFilter, difficultyFilter, mmrFilter]) =>
						!!globalStats && !!gameStats?.stats,
				),
				map(
					([globalStats, gameStats, modeFilter, difficultyFilter, mmrFilter]) =>
						[
							globalStats,
							modeFilter === 'pve'
								? gameStats.stats.filter((stat) => (stat.gameMode as any) === 'mercenaries')
								: gameStats.stats.filter((stat) => (stat.gameMode as any) === 'mercenaries-pvp'),
							modeFilter,
							difficultyFilter,
							mmrFilter,
						] as [
							MercenariesGlobalStats,
							readonly GameStat[],
							MercenariesModeFilterType,
							MercenariesPveDifficultyFilterType,
							MercenariesPvpMmrFilterType,
						],
				),
				distinctUntilChanged((a, b) => arraysEqual(a, b)),
				map(([globalStats, gameStats, modeFilter, difficultyFilter, mmrFilter]) => {
					const infos = modeFilter === 'pve' ? globalStats.pve : globalStats.pvp;
					return [
						filterMercenariesCompositions(infos.compositions, modeFilter, difficultyFilter, mmrFilter),
					] as [readonly MercenariesComposition[]];
				}),
				map(([compositionStats]) => {
					const statsByStarterTrio = groupByFunction((stat: MercenariesComposition) =>
						stat.heroCardIds.join(','),
					)(compositionStats);
					const totalMatches = sumOnArray(compositionStats, (stat) => stat.totalMatches);
					return Object.keys(statsByStarterTrio)
						.map((compositionKey: string) => {
							const compositions: readonly MercenariesComposition[] = statsByStarterTrio[compositionKey];
							const ref = compositions[0];
							const globalTotalMatches = sumOnArray(compositions, (stat) => stat.totalMatches);
							const benches: readonly MercenaryCompositionInfoBench[] = compositions
								.map((comp) => comp.benches)
								.map((benches) => {
									const ref = benches[0];
									const globalTotalMatchesForBench = sumOnArray(benches, (stat) => stat.totalMatches);
									return {
										id: 'bench-' + ref.heroCardIds.join(','),
										heroCardIds: ref.heroCardIds,
										globalTotalMatches: globalTotalMatchesForBench,
										globalWinrate:
											sumOnArray(benches, (stat) => stat.totalWins) / globalTotalMatchesForBench,
										globalPopularity: globalTotalMatchesForBench / globalTotalMatches,
										playerTotalMatches: null,
										playerWinrate: null,
									};
								})
								.sort((a, b) => b.globalWinrate - a.globalWinrate)
								.slice(0, 15);
							return {
								id: compositionKey,
								heroCardIds: ref.heroCardIds,
								globalTotalMatches: globalTotalMatches,
								globalWinrate:
									globalTotalMatches === 0
										? null
										: (100 * sumOnArray(compositions, (stat) => stat.totalWins)) /
										  globalTotalMatches,
								globalPopularity: (100 * globalTotalMatches) / totalMatches,
								playerTotalMatches: 0,
								playerWinrate: null,
								benches: benches,
							} as MercenaryCompositionInfo;
						})
						.sort((a, b) => b.globalWinrate - a.globalWinrate)
						.slice(0, 15);
				}),
				map((stats) => (!stats?.length ? null : stats)),
				tap((filter) => setTimeout(() => this.cdr?.detectChanges(), 0)),
				tap((info) => cdLog('emitting stats in ', this.constructor.name, info)),
			);
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	trackByFn(index: number, item: MercenaryInfo) {
		return item.id;
	}
}
