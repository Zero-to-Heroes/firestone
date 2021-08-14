import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { DuelsHeroStat, DuelsTreasureStat } from '@firestone-hs/duels-global-stats/dist/stat';
import { CardsFacadeService } from '@services/cards-facade.service';
import { Observable } from 'rxjs';
import { distinctUntilChanged, map, tap } from 'rxjs/operators';
import { DuelsHeroSortFilterType } from '../../../models/duels/duels-hero-sort-filter.type';
import { DuelsHeroPlayerStat } from '../../../models/duels/duels-player-stats';
import { DuelsRun } from '../../../models/duels/duels-run';
import { DuelsStateBuilderService } from '../../../services/duels/duels-state-builder.service';
import { AppUiStoreService, cdLog } from '../../../services/ui-store/app-ui-store.service';
import {
	buildDuelsHeroTreasurePlayerStats,
	filterDuelsRuns,
	filterDuelsTreasureStats,
} from '../../../services/ui-store/duels-ui-helper';
import { arraysEqual } from '../../../services/utils';

@Component({
	selector: 'duels-treasure-stats',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/duels/desktop/duels-treasure-stats.component.scss`,
	],
	template: `
		<div *ngIf="stats$ | async as stats; else emptyState" class="duels-treasure-stats" scrollable>
			<duels-hero-stat-vignette *ngFor="let stat of stats" [stat]="stat"></duels-hero-stat-vignette>
		</div>
		<ng-template #emptyState>
			<duels-empty-state></duels-empty-state>
		</ng-template>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsTreasureStatsComponent {
	stats$: Observable<readonly DuelsHeroPlayerStat[]>;

	constructor(
		private readonly allCards: CardsFacadeService,
		private readonly store: AppUiStoreService,
		private readonly cdr: ChangeDetectorRef,
	) {
		this.stats$ = this.store
			.listen$(
				([main, nav]) => main.duels.globalStats?.treasures,
				([main, nav]) => main.duels.runs,
				([main, nav, prefs]) => prefs.duelsActiveTreasureStatTypeFilter,
				([main, nav, prefs]) => prefs.duelsActiveGameModeFilter,
				([main, nav, prefs]) => prefs.duelsActiveHeroSortFilter,
				([main, nav, prefs]) => prefs.duelsActiveTimeFilter,
				([main, nav, prefs]) => prefs.duelsActiveTopDecksClassFilter,
				([main, nav, prefs]) => prefs.duelsHideStatsBelowThreshold,
				([main, nav, prefs]) => main.duels.currentDuelsMetaPatch?.number,
			)
			.pipe(
				map(
					([
						duelStats,
						runs,
						statType,
						gameMode,
						treasureSorting,
						timeFilter,
						classFilter,
						hideThreshold,
						lastPatchNumber,
					]) =>
						[
							filterDuelsTreasureStats(duelStats, timeFilter, classFilter, statType, this.allCards),
							filterDuelsRuns(runs, timeFilter, classFilter, gameMode, lastPatchNumber),
							treasureSorting,
							hideThreshold,
						] as [readonly DuelsTreasureStat[], readonly DuelsRun[], DuelsHeroSortFilterType, boolean],
				),
				distinctUntilChanged((a, b) => this.areEqual(a, b)),
				map(([duelStats, duelsRuns, treasureSorting, hideThreshold]) =>
					[...buildDuelsHeroTreasurePlayerStats(duelStats, duelsRuns)]
						.sort(this.sortBy(treasureSorting))
						.filter((stat) =>
							hideThreshold ? stat.globalTotalMatches >= DuelsStateBuilderService.STATS_THRESHOLD : true,
						),
				),
				distinctUntilChanged((a, b) => arraysEqual(a, b)),
				// FIXME
				tap((filter) => setTimeout(() => this.cdr?.detectChanges(), 0)),
				tap((info) => cdLog('emitting stats in ', this.constructor.name, info)),
			);
	}

	private sortBy(heroSorting: DuelsHeroSortFilterType): (a: DuelsHeroPlayerStat, b: DuelsHeroPlayerStat) => number {
		switch (heroSorting) {
			case 'games-played':
				return (a, b) => b.playerTotalMatches - a.playerTotalMatches;
			case 'global-winrate':
				return (a, b) => b.globalWinrate - a.globalWinrate;
			case 'player-winrate':
				return (a, b) => b.playerWinrate - a.playerWinrate;
		}
	}

	private areEqual(
		a: [readonly DuelsHeroStat[], readonly DuelsRun[], DuelsHeroSortFilterType, boolean],
		b: [readonly DuelsHeroStat[], readonly DuelsRun[], DuelsHeroSortFilterType, boolean],
	): boolean {
		if (a[2] !== b[2] || a[3] !== b[3]) {
			return false;
		}
		return arraysEqual(a[0], b[0]) && arraysEqual(a[1], b[1]);
	}
}
