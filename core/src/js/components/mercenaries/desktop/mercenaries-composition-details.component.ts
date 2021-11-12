import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, takeUntil, tap } from 'rxjs/operators';
import { GameStat } from '../../../models/mainwindow/stats/game-stat';
import {
	MercenariesHeroLevelFilterType,
	MercenariesModeFilterType,
	MercenariesPveDifficultyFilterType,
	MercenariesPvpMmrFilterType,
} from '../../../models/mercenaries/mercenaries-filter-types';
import { CardsFacadeService } from '../../../services/cards-facade.service';
import {
	MercenariesComposition,
	MercenariesCompositionBench,
	MercenariesGlobalStats,
} from '../../../services/mercenaries/mercenaries-state-builder.service';
import { getHeroRole } from '../../../services/mercenaries/mercenaries-utils';
import { OverwolfService } from '../../../services/overwolf.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { cdLog } from '../../../services/ui-store/app-ui-store.service';
import { filterMercenariesCompositions } from '../../../services/ui-store/mercenaries-ui-helper';
import { arraysEqual, groupByFunction, sumOnArray } from '../../../services/utils';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';
import { MercenaryCompositionInfoBench, MercenaryInfo } from './mercenary-info';

@Component({
	selector: 'mercenaries-composition-details',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/mercenaries/desktop/mercenaries-composition-details.component.scss`,
	],
	template: `
		<div class="mercenaries-composition-details" *ngIf="compositionStat$ | async as stats">
			<div class="overview">
				<div class="info">
					<div class="heroes-container starter">
						<div class="portrait" *ngFor="let hero of stats.starterHeroes" [cardTooltip]="hero.cardId">
							<img class="icon" [src]="hero.portraitUrl" />
							<img class="frame" [src]="hero.frameUrl" />
						</div>
					</div>
					<div class="stats">
						<div class="stat">
							<div class="header">Games played</div>
							<div class="values">
								<div class="my-value">{{ stats.playerTotalMatches }}</div>
								<bgs-global-value
									[value]="buildValuePercent(stats.globalTotalMatches)"
								></bgs-global-value>
							</div>
						</div>
						<div class="stat">
							<div class="header">Winrate</div>
							<div class="values">
								<div
									class="my-value percent"
									[ngClass]="{
										'positive': stats.playerWinrate && stats.playerWinrate > 50,
										'negative': stats.playerWinrate && stats.playerWinrate < 50
									}"
								>
									{{ buildValuePercent(stats.playerWinrate, 0) }}
								</div>
								<bgs-global-value [value]="buildValuePercent(stats.globalWinrate)"></bgs-global-value>
							</div>
						</div>
					</div>
				</div>
			</div>
			<!-- TODO: equipment stats -->
			<div class="equipment-overview"></div>
			<div class="benches-overview" *ngIf="!!stats.benches?.length">
				<div class="title">Benches</div>
				<div class="header">
					<div class="starter">Bench</div>
					<div class="stat winrate">Global winrate</div>
					<div class="stat matches">Total matches</div>
				</div>
				<div class="content">
					<div class="item" *ngFor="let bench of stats.benches">
						<mercenaries-composition-stat class="stat" [stat]="bench"></mercenaries-composition-stat>
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesComposiionDetailsComponent extends AbstractSubscriptionComponent {
	compositionStat$: Observable<CompositionStat>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly store: AppUiStoreFacadeService,
		private readonly allCards: CardsFacadeService,
		private readonly cdr: ChangeDetectorRef,
	) {
		super();
		this.compositionStat$ = this.store
			.listen$(
				([main, nav]) => main.mercenaries.globalStats,
				([main, nav]) => main.stats.gameStats,
				([main, nav, prefs]) => nav.navigationMercenaries.selectedCompositionId,
				([main, nav, prefs]) => prefs.mercenariesActiveModeFilter,
				([main, nav, prefs]) => prefs.mercenariesActivePveDifficultyFilter,
				([main, nav, prefs]) => prefs.mercenariesActivePvpMmrFilter,
				([main, nav, prefs]) => prefs.mercenariesActiveHeroLevelFilter2,
			)
			.pipe(
				filter(
					([globalStats, gameStats, heroId, modeFilter, difficultyFilter, mmrFilter, levelFilter]) =>
						!!globalStats && !!heroId,
				),
				// tap((info) => console.debug('ga', info)),
				map(
					([globalStats, gameStats, selectedHeroId, modeFilter, difficultyFilter, mmrFilter, levelFilter]) =>
						[
							globalStats,
							modeFilter === 'pve'
								? gameStats.stats.filter((stat) => (stat.gameMode as any) === 'mercenaries')
								: gameStats.stats.filter((stat) => (stat.gameMode as any) === 'mercenaries-pvp'),
							selectedHeroId,
							modeFilter,
							difficultyFilter,
							mmrFilter,
							levelFilter,
						] as [
							MercenariesGlobalStats,
							readonly GameStat[],
							string,
							MercenariesModeFilterType,
							MercenariesPveDifficultyFilterType,
							MercenariesPvpMmrFilterType,
							MercenariesHeroLevelFilterType,
						],
				),
				distinctUntilChanged((a, b) => arraysEqual(a, b)),
				map(([globalStats, gameStats, compositionId, modeFilter, difficultyFilter, mmrFilter, levelFilter]) => {
					const infos = globalStats.pvp;
					return [
						filterMercenariesCompositions(
							infos.compositions.filter((c) => c.stringifiedHeroes === compositionId),
							mmrFilter,
						),
					] as [readonly MercenariesComposition[]];
				}),
				// tap((info) => console.debug('ga 3', info)),
				distinctUntilChanged((a, b) => arraysEqual(a, b)),
				map(([compositionStats]) => {
					const refHeroStat = compositionStats[0];
					const globalTotalMatches = sumOnArray(compositionStats, (stat) => stat.totalMatches);
					const allBenches = compositionStats.map((comp) => comp.benches).reduce((a, b) => [...a, ...b], []);
					const groupedByBench = groupByFunction((bench: MercenariesCompositionBench) =>
						bench.heroCardIds.join(','),
					)(allBenches);
					const benches: readonly MercenaryCompositionInfoBench[] = Object.values(groupedByBench)
						.map((benches) => {
							const ref = benches[0];
							const globalTotalMatchesForBench = sumOnArray(benches, (stat) => stat.totalMatches);
							return {
								id: 'bench-' + ref.heroCardIds.join(','),
								heroCardIds: ref.heroCardIds,
								globalTotalMatches: globalTotalMatchesForBench,
								globalWinrate:
									(100 * sumOnArray(benches, (stat) => stat.totalWins)) / globalTotalMatchesForBench,
								globalPopularity: globalTotalMatchesForBench / globalTotalMatches,
								playerTotalMatches: 0,
								playerWinrate: null,
							};
						})
						.sort((a, b) => b.globalWinrate - a.globalWinrate)
						.slice(0, 15);
					console.debug('benches', benches, compositionStats);
					return {
						starterHeroes: refHeroStat.heroCardIds.map((cardId) => ({
							cardId: cardId,
							portraitUrl: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${cardId}.jpg`,
							frameUrl: `https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_hero_frame_golden_${getHeroRole(
								this.allCards.getCard(cardId).mercenaryRole,
							)}.png?v=2`,
						})),
						globalTotalMatches: globalTotalMatches,
						globalWinrate:
							(100 * sumOnArray(compositionStats, (stat) => stat.totalWins)) / globalTotalMatches,
						playerTotalMatches: 0,
						playerWinrate: null,
						benches: benches,
					} as CompositionStat;
				}),
				tap((filter) => setTimeout(() => this.cdr?.detectChanges(), 0)),
				tap((info) => cdLog('emitting stats in ', this.constructor.name, info)),
				takeUntil(this.destroyed$),
			);
	}

	trackByFn(index: number, item: MercenaryInfo) {
		return item.id;
	}

	buildValue(value: number, decimals = 2): string {
		if (value === 100) {
			return '100';
		}
		return value == null ? '-' : value.toFixed(decimals);
	}

	buildValuePercent(value: number, decimals = 1): string {
		if (value === 100) {
			return '100%';
		}
		return value == null ? '-' : value.toFixed(decimals) + '%';
	}
}

interface CompositionStat {
	readonly starterHeroes: readonly Hero[];
	readonly globalTotalMatches: number;
	readonly globalWinrate: number;
	readonly playerTotalMatches: number;
	readonly playerWinrate: number;
	readonly benches: readonly MercenaryCompositionInfoBench[];
}

interface Hero {
	readonly cardId: string;
	readonly portraitUrl: string;
	readonly frameUrl: string;
}
