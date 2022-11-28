import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { MercenariesComposition } from '../../../services/mercenaries/mercenaries-state-builder.service';
import { OverwolfService } from '../../../services/overwolf.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { filterMercenariesCompositions } from '../../../services/ui-store/mercenaries-ui-helper';
import { groupByFunction, sumOnArray } from '../../../services/utils';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';
import { MercenaryCompositionInfo, MercenaryInfo } from './mercenary-info';

@Component({
	selector: 'mercenaries-compositions-stats',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/mercenaries/desktop/mercenaries-compositions-stats.component.scss`,
	],
	template: `
		<!-- Unused -->
		<div
			class="mercenaries-compositions-stats"
			*ngIf="{ showMercNames: showMercNames$ | async } as value"
			[ngClass]="{ 'show-merc-names': value.showMercNames }"
			scrollable
		>
			<ng-container *ngIf="stats$ | async as stats; else emptyState">
				<div class="header">
					<div class="starter" [owTranslate]="'mercenaries.teams.team'"></div>
					<!-- <div class="bench" helpTooltip="An example of a possible bench for this composition">Bench</div> -->
					<div class="stat winrate" [owTranslate]="'mercenaries.teams.global-winrate'"></div>
					<div class="stat matches" [owTranslate]="'mercenaries.teams.total-matches'"></div>
				</div>
				<mercenaries-composition-stat
					*ngFor="let stat of stats"
					[stat]="stat"
					[showMercNames]="value.showMercNames"
				></mercenaries-composition-stat>
			</ng-container>
			<ng-template #emptyState> <mercenaries-empty-state></mercenaries-empty-state></ng-template>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesCompositionsStatsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	stats$: Observable<readonly MercenaryCompositionInfo[]>;
	showMercNames$: Observable<boolean>;

	constructor(
		private readonly ow: OverwolfService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.showMercNames$ = this.listenForBasicPref$((prefs) => prefs.mercenariesShowMercNamesInTeams);
		this.stats$ = this.store
			.listen$(
				([main, nav]) => main.mercenaries.getGlobalStats(),
				([main, nav, prefs]) => prefs.mercenariesActivePvpMmrFilter,
			)
			.pipe(
				filter(([globalStats, mmrFilter]) => !!globalStats?.pvp?.compositions?.length),
				this.mapData(([globalStats, mmrFilter]) => {
					const compositionStats = filterMercenariesCompositions(globalStats.pvp.compositions, mmrFilter);
					const statsByStarterTrio = groupByFunction((stat: MercenariesComposition) =>
						stat.heroCardIds.join(','),
					)(compositionStats);
					const totalMatches = sumOnArray(compositionStats, (stat) => stat.totalMatches);
					const finalStats = Object.keys(statsByStarterTrio)
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
						.filter((stat) => stat.globalTotalMatches >= 20)
						.sort((a, b) => b.globalWinrate - a.globalWinrate)
						.slice(0, 15);
					return !finalStats?.length ? null : finalStats;
				}),
			);
	}

	trackByFn(index: number, item: MercenaryInfo) {
		return item.id;
	}
}
