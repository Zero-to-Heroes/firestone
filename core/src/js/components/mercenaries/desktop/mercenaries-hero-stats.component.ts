import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter } from '@angular/core';
import { TagRole } from '@firestone-hs/reference-data';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, tap } from 'rxjs/operators';
import { GameStat } from '../../../models/mainwindow/stats/game-stat';
import { MercenariesHeroLevelFilterType } from '../../../models/mercenaries/mercenaries-hero-level-filter.type';
import { MercenariesModeFilterType } from '../../../models/mercenaries/mercenaries-mode-filter.type';
import { MercenariesPveDifficultyFilterType } from '../../../models/mercenaries/mercenaries-pve-difficulty-filter.type';
import { MercenariesPvpMmrFilterType } from '../../../models/mercenaries/mercenaries-pvp-mmr-filter.type';
import { MercenariesRoleFilterType } from '../../../models/mercenaries/mercenaries-role-filter.type';
import { MercenariesStarterFilterType } from '../../../models/mercenaries/mercenaries-starter-filter.type';
import { CardsFacadeService } from '../../../services/cards-facade.service';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import {
	MercenariesGlobalStats,
	MercenariesHeroStat,
	MercenariesReferenceData,
} from '../../../services/mercenaries/mercenaries-state-builder.service';
import { getHeroRole, normalizeMercenariesHeroCardId } from '../../../services/mercenaries/mercenaries-utils';
import { OverwolfService } from '../../../services/overwolf.service';
import { AppUiStoreService, cdLog } from '../../../services/ui-store/app-ui-store.service';
import { filterMercenariesHeroStats, filterMercenariesRuns } from '../../../services/ui-store/mercenaries-ui-helper';
import { arraysEqual, groupByFunction, sumOnArray } from '../../../services/utils';
import { MercenaryInfo } from './mercenary-info';

@Component({
	selector: 'mercenaries-hero-stats',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/mercenaries/desktop/mercenaries-hero-stats.component.scss`,
	],
	template: `
		<div class="mercenaries-pve-stats" scrollable>
			<mercenaries-hero-stat
				*ngFor="let stat of stats$ | async; trackBy: trackByFn"
				[stat]="stat"
			></mercenaries-hero-stat>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesHeroStatsComponent implements AfterViewInit {
	stats$: Observable<readonly MercenaryInfo[]>;

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
				([main, nav]) => main.mercenaries.referenceData,
				([main, nav]) => main.stats.gameStats,
				([main, nav, prefs]) => prefs.mercenariesActiveModeFilter,
				([main, nav, prefs]) => prefs.mercenariesActiveRoleFilter,
				([main, nav, prefs]) => prefs.mercenariesActivePveDifficultyFilter,
				([main, nav, prefs]) => prefs.mercenariesActivePvpMmrFilter,
				([main, nav, prefs]) => prefs.mercenariesActiveStarterFilter,
				([main, nav, prefs]) => prefs.mercenariesActiveHeroLevelFilter,
			)
			.pipe(
				filter(
					([
						globalStats,
						referenceData,
						gameStats,
						modeFilter,
						roleFilter,
						difficultyFilter,
						mmrFilter,
						starterFilter,
						levelFilter,
					]) => !!globalStats && !!gameStats?.stats,
				),
				map(
					([
						globalStats,
						referenceData,
						gameStats,
						modeFilter,
						roleFilter,
						difficultyFilter,
						mmrFilter,
						starterFilter,
						levelFilter,
					]) =>
						[
							globalStats,
							referenceData,
							modeFilter === 'pve'
								? gameStats.stats.filter((stat) => (stat.gameMode as any) === 'mercenaries')
								: gameStats.stats.filter((stat) => (stat.gameMode as any) === 'mercenaries-pvp'),
							modeFilter,
							roleFilter,
							difficultyFilter,
							mmrFilter,
							starterFilter,
							levelFilter,
						] as [
							MercenariesGlobalStats,
							MercenariesReferenceData,
							readonly GameStat[],
							MercenariesModeFilterType,
							MercenariesRoleFilterType,
							MercenariesPveDifficultyFilterType,
							MercenariesPvpMmrFilterType,
							MercenariesStarterFilterType,
							MercenariesHeroLevelFilterType,
						],
				),
				distinctUntilChanged((a, b) => arraysEqual(a, b)),
				map(
					([
						globalStats,
						referenceData,
						gameStats,
						modeFilter,
						roleFilter,
						difficultyFilter,
						mmrFilter,
						starterFilter,
						levelFilter,
					]) => {
						const infos = modeFilter === 'pve' ? globalStats.pve : globalStats.pvp;
						return [
							filterMercenariesHeroStats(
								infos.heroStats,
								modeFilter,
								roleFilter,
								difficultyFilter,
								mmrFilter,
								starterFilter,
								levelFilter,
							),
							filterMercenariesRuns(
								gameStats,
								modeFilter,
								roleFilter,
								difficultyFilter,
								mmrFilter,
								starterFilter,
								levelFilter,
							),
							roleFilter,
							referenceData,
						] as [
							readonly MercenariesHeroStat[],
							readonly GameStat[],
							MercenariesRoleFilterType,
							MercenariesReferenceData,
						];
					},
				),
				map(([heroStats, gameStats, roleFilter, referenceData]) => {
					if (!!heroStats.length) {
						const heroStatsByHero = groupByFunction((stat: MercenariesHeroStat) => stat.heroCardId)(
							heroStats,
						);
						const gameStatsByHero = groupByFunction((stat: GameStat) =>
							normalizeMercenariesHeroCardId(stat.playerCardId),
						)(gameStats);
						const totalMatches = sumOnArray(heroStats, (stat) => stat.totalMatches);
						return Object.keys(heroStatsByHero)
							.map((heroCardId) => {
								const heroStats = heroStatsByHero[heroCardId];
								// The hero card id is already normalized in the global stats
								const gameStats = gameStatsByHero[heroCardId];
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
											: (100 * sumOnArray(heroStats, (stat) => stat.totalWins)) /
											  globalTotalMatches,
									globalPopularity: (100 * globalTotalMatches) / totalMatches,
									playerTotalMatches: gameStats?.length ?? 0,
									playerWinrate: !gameStats?.length
										? null
										: (100 * gameStats.filter((stat) => stat.result === 'won').length) /
										  gameStats.length,
								} as MercenaryInfo;
							})
							.sort((a, b) => b.globalWinrate - a.globalWinrate);
					} else {
						return referenceData.mercenaries
							.map((mercenary) => {
								const mercenaryCard = this.allCards.getCardFromDbfId(mercenary.cardDbfId);
								if (
									!mercenaryCard.mercenaryRole ||
									mercenaryCard.mercenaryRole === TagRole[TagRole.NEUTRAL] ||
									mercenary.equipments.length !== 3 ||
									mercenary.abilities.length !== 3
								) {
									return null;
								}

								if (roleFilter !== 'all' && roleFilter !== getHeroRole(mercenaryCard.mercenaryRole)) {
									return null;
								}

								return {
									id: mercenaryCard.id,
									name: mercenaryCard?.name,
									role: getHeroRole(mercenaryCard.mercenaryRole),
									globalTotalMatches: 0,
									globalWinrate: null,
									globalPopularity: null,
									playerTotalMatches: 0,
									playerWinrate: null,
								} as MercenaryInfo;
							})
							.filter((merc) => !!merc)
							.sort((a, b) => (a.name < b.name ? -1 : 1));
					}
				}),
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
