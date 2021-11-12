import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, takeUntil, tap } from 'rxjs/operators';
import { MercenariesPvpMmrFilterType } from '../../../models/mercenaries/mercenaries-filter-types';
import {
	MercenariesComposition,
	MercenariesGlobalStatsPvp,
} from '../../../services/mercenaries/mercenaries-state-builder.service';
import { OverwolfService } from '../../../services/overwolf.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { cdLog } from '../../../services/ui-store/app-ui-store.service';
import { filterMercenariesCompositions } from '../../../services/ui-store/mercenaries-ui-helper';
import { arraysEqual, groupByFunction, sumOnArray } from '../../../services/utils';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';
import { MercenaryCompositionInfo, MercenaryInfo } from './mercenary-info';

@Component({
	selector: 'mercenaries-compositions-stats',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/mercenaries/desktop/mercenaries-compositions-stats.component.scss`,
	],
	template: `
		<div
			class="mercenaries-compositions-stats"
			*ngIf="{ showMercNames: showMercNames$ | async } as value"
			[ngClass]="{ 'show-merc-names': value.showMercNames }"
			scrollable
		>
			<ng-container *ngIf="stats$ | async as stats; else emptyState">
				<div class="header">
					<div class="starter">Team</div>
					<!-- <div class="bench" helpTooltip="An example of a possible bench for this composition">Bench</div> -->
					<div class="stat winrate">Global winrate</div>
					<div class="stat matches">Total matches</div>
				</div>
				<mercenaries-composition-stat
					*ngFor="let stat of stats; trackBy: trackByFn"
					[stat]="stat"
					[showMercNames]="value.showMercNames"
				></mercenaries-composition-stat>
			</ng-container>
			<ng-template #emptyState> <mercenaries-empty-state></mercenaries-empty-state></ng-template>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesCompositionsStatsComponent extends AbstractSubscriptionComponent {
	stats$: Observable<readonly MercenaryCompositionInfo[]>;
	showMercNames$: Observable<boolean>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly store: AppUiStoreFacadeService,
		private readonly cdr: ChangeDetectorRef,
	) {
		super();
		this.showMercNames$ = this.store
			.listen$(([main, nav, prefs]) => prefs.mercenariesShowMercNamesInTeams)
			.pipe(
				map(([pref]) => pref),
				tap((filter) => setTimeout(() => this.cdr?.detectChanges(), 0)),
				tap((info) => cdLog('emitting showMercNames in ', this.constructor.name, info)),
				takeUntil(this.destroyed$),
			);
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
						!!globalStats?.pvp?.compositions?.length,
				),
				map(
					([globalStats, gameStats, modeFilter, difficultyFilter, mmrFilter]) =>
						[
							globalStats.pvp,
							// modeFilter === 'pve'
							// 	? gameStats.stats.filter((stat) => (stat.gameMode as any) === 'mercenaries')
							// 	: gameStats.stats.filter((stat) => (stat.gameMode as any) === 'mercenaries-pvp'),
							// modeFilter,
							// difficultyFilter,
							mmrFilter,
						] as [
							MercenariesGlobalStatsPvp,
							// readonly GameStat[],
							// MercenariesModeFilterType,
							// MercenariesPveDifficultyFilterType,
							MercenariesPvpMmrFilterType,
						],
				),
				distinctUntilChanged((a, b) => arraysEqual(a, b)),
				map(([pvpStats, mmrFilter]) => filterMercenariesCompositions(pvpStats.compositions, mmrFilter)),
				map((compositionStats) => {
					const statsByStarterTrio = groupByFunction((stat: MercenariesComposition) =>
						stat.heroCardIds.join(','),
					)(compositionStats);
					const totalMatches = sumOnArray(compositionStats, (stat) => stat.totalMatches);
					return Object.keys(statsByStarterTrio)
						.map((compositionKey: string) => {
							const compositions: readonly MercenariesComposition[] = statsByStarterTrio[compositionKey];
							const ref = compositions[0];
							const globalTotalMatches = sumOnArray(compositions, (stat) => stat.totalMatches);
							// const benches: readonly MercenaryCompositionInfoBench[] = compositions
							// 	.map((comp) => comp.benches)
							// 	.map((benches) => {
							// 		const ref = benches[0];
							// 		const globalTotalMatchesForBench = sumOnArray(benches, (stat) => stat.totalMatches);
							// 		return {
							// 			id: 'bench-' + ref.heroCardIds.join(','),
							// 			heroCardIds: ref.heroCardIds,
							// 			globalTotalMatches: globalTotalMatchesForBench,
							// 			globalWinrate:
							// 				sumOnArray(benches, (stat) => stat.totalWins) / globalTotalMatchesForBench,
							// 			globalPopularity: globalTotalMatchesForBench / globalTotalMatches,
							// 			playerTotalMatches: null,
							// 			playerWinrate: null,
							// 		};
							// 	})
							// 	.sort((a, b) => b.globalWinrate - a.globalWinrate)
							// 	.slice(0, 15);
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
								// benches: benches,
							} as MercenaryCompositionInfo;
						})
						.filter((stat) => stat.globalTotalMatches >= 100)
						.sort((a, b) => b.globalWinrate - a.globalWinrate)
						.slice(0, 15);
				}),
				map((stats) => (!stats?.length ? null : stats)),
				tap((filter) => setTimeout(() => this.cdr?.detectChanges(), 0)),
				tap((info) => cdLog('emitting stats in ', this.constructor.name, info)),
				takeUntil(this.destroyed$),
			);
	}

	trackByFn(index: number, item: MercenaryInfo) {
		return item.id;
	}
}
