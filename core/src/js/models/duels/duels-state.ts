import { DuelsStat } from '@firestone-hs/duels-global-stats/dist/stat';
import { DuelsLeaderboard } from '@firestone-hs/duels-leaderboard';
import { DungeonCrawlOptionType, ReferenceCard } from '@firestone-hs/reference-data';
import { DuelsRewardsInfo } from '@firestone-hs/retrieve-users-duels-runs/dist/duels-rewards-info';
import { DuelsRunInfo } from '@firestone-hs/retrieve-users-duels-runs/dist/duels-run-info';
import { DeckInfoFromMemory } from '@models/mainwindow/decktracker/deck-info-from-memory';
import { NonFunctionProperties } from '../../services/utils';
import { DuelsCategory } from '../mainwindow/duels/duels-category';
import { PatchInfo } from '../patches';
import { DuelsGroupedDecks } from './duels-grouped-decks';
import { DuelsDeckSummary } from './duels-personal-deck';
import { DuelsDeckStat } from './duels-player-stats';
import { DuelsRun } from './duels-run';

export class DuelsState {
	readonly loading: boolean = true;
	readonly categories: readonly DuelsCategory[];
	readonly duelsRunInfos: readonly DuelsRunInfo[];
	readonly duelsRewardsInfo: readonly DuelsRewardsInfo[];
	readonly runs: readonly DuelsRun[];
	readonly globalStats: DuelsStat;
	readonly topDecks: readonly DuelsGroupedDecks[] = [];
	readonly personalDeckStats: readonly DuelsDeckSummary[] = [];
	// readonly playerStats: DuelsPlayerStats;
	readonly leaderboard: DuelsLeaderboard;
	// Used to store additional deck data loaded during the course of the app's use,
	// like the 12-wins additional data. If we store it directly in the deck stats,
	// it will be erased every time we recompute everything from the global stats
	readonly additionalDeckDetails: readonly DuelsDeckStat[] = [];
	readonly currentDuelsMetaPatch: PatchInfo;

	readonly currentDuelsDeck: DeckInfoFromMemory;
	readonly isOnDuelsMainScreen: boolean;
	readonly treasureSelection: TreasureSelection;
	readonly currentOption: DungeonCrawlOptionType;
	readonly heroOptionsDbfIds: readonly number[];

	public static create(base: Partial<NonFunctionProperties<DuelsState>>): DuelsState {
		return Object.assign(new DuelsState(), base);
	}

	public update(base: Partial<NonFunctionProperties<DuelsState>>): DuelsState {
		return Object.assign(new DuelsState(), this, base);
	}

	public findCategory(categoryId: string) {
		const result = this.categories?.find((cat) => cat.id === categoryId);
		return result;
	}
}

export interface TreasureSelection {
	readonly treasures: readonly ReferenceCard[];
}
