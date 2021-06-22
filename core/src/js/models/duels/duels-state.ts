import { DuelsGlobalStats } from '@firestone-hs/duels-global-stats/dist/stat';
import { DuelsRewardsInfo } from '@firestone-hs/retrieve-users-duels-runs/dist/duels-rewards-info';
import { DuelsRunInfo } from '@firestone-hs/retrieve-users-duels-runs/dist/duels-run-info';
import { DuelsCategory } from '../mainwindow/duels/duels-category';
import { PatchInfo } from '../patches';
import { DuelsClassFilterType } from './duels-class-filter.type';
import { DuelsGameModeFilterType } from './duels-game-mode-filter.type';
import { DuelsHeroSortFilterType } from './duels-hero-sort-filter.type';
import { DuelsDeckStat, DuelsPlayerStats } from './duels-player-stats';
import { DuelsRun } from './duels-run';
import { DuelsStatTypeFilterType } from './duels-stat-type-filter.type';
import { DuelsTimeFilterType } from './duels-time-filter.type';
import { DuelsTopDecksDustFilterType } from './duels-top-decks-dust-filter.type';
import { DuelsTreasureSortFilterType } from './duels-treasure-sort-filter.type';
import { DuelsTreasureStatTypeFilterType } from './duels-treasure-stat-type-filter.type';

export class DuelsState {
	readonly loading: boolean = true;
	readonly categories: readonly DuelsCategory[];
	readonly duelsRunInfos: readonly DuelsRunInfo[];
	readonly duelsRewardsInfo: readonly DuelsRewardsInfo[];
	readonly runs: readonly DuelsRun[];
	readonly globalStats: DuelsGlobalStats;
	readonly playerStats: DuelsPlayerStats;
	// Used to store additional deck data loaded during the course of the app's use,
	// like the 12-wins additional data. If we store it directly in the deck stats,
	// it will be erased every time we recompute everything from the global stats
	readonly additionalDeckDetails: readonly DuelsDeckStat[] = [];
	readonly currentDuelsMetaPatch: PatchInfo;

	readonly activeHeroSortFilter: DuelsHeroSortFilterType;
	readonly activeStatTypeFilter: DuelsStatTypeFilterType;
	readonly activeTreasureSortFilter: DuelsTreasureSortFilterType;
	readonly activeTreasureStatTypeFilter: DuelsTreasureStatTypeFilterType;
	readonly activeTimeFilter: DuelsTimeFilterType;
	readonly activeGameModeFilter: DuelsGameModeFilterType;
	readonly activeTopDecksClassFilter: DuelsClassFilterType;
	readonly activeTopDecksDustFilter: DuelsTopDecksDustFilterType;
	readonly activeMmrFilter: string;

	public static create(base: DuelsState): DuelsState {
		return Object.assign(new DuelsState(), base);
	}

	public update(base: DuelsState): DuelsState {
		return Object.assign(new DuelsState(), this, base);
	}
}
