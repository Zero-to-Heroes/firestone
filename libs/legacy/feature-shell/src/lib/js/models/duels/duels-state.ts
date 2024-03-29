import { DungeonCrawlOptionType, ReferenceCard } from '@firestone-hs/reference-data';
import { DeckInfoFromMemory, MemoryDuelsHeroPowerOption } from '@firestone/memory';
import { DuelsDeckbuilder } from '@models/duels/duels-deckbuilder';
import { ExtendedDuelsStatDecks } from '../../services/duels/duels-state-builder.service';
import { NonFunctionProperties } from '../../services/utils';
import { DuelsCategory } from '../mainwindow/duels/duels-category';
import { DuelsDeckStat } from './duels-player-stats';

export class DuelsState {
	readonly loading: boolean = true;
	readonly categories: readonly DuelsCategory[];
	// readonly config: DuelsConfig;
	// readonly duelsRunInfos: readonly DuelsRunInfo[];
	// readonly duelsRewardsInfo: readonly DuelsRewardsInfo[];
	// readonly globalStats: DuelsStat;
	readonly globalStatsDecks: ExtendedDuelsStatDecks;
	// readonly bucketsData: readonly DuelsBucketsData[] = [];
	// readonly leaderboard: DuelsLeaderboard;
	// Used to store additional deck data loaded during the course of the app's use,
	// like the 12-wins additional data. If we store it directly in the deck stats,
	// it will be erased every time we recompute everything from the global stats
	readonly additionalDeckDetails: readonly DuelsDeckStat[] = [];
	// readonly currentDuelsMetaPatch: PatchInfo;

	readonly deckbuilder: DuelsDeckbuilder = new DuelsDeckbuilder();

	readonly currentDuelsDeck: DeckInfoFromMemory;
	// readonly tempDuelsDeck: DuelsDeck;
	readonly isOnDuelsMainScreen: boolean;
	readonly isOnDuelsDeckBuildingLobbyScreen: boolean;
	readonly treasureSelection: TreasureSelection;
	readonly currentOption: DungeonCrawlOptionType;
	readonly heroOptions: readonly MemoryDuelsHeroPowerOption[];
	readonly heroPowerOptions: readonly MemoryDuelsHeroPowerOption[];
	readonly signatureTreasureOptions: readonly MemoryDuelsHeroPowerOption[];
	// readonly adventuresInfo: AdventuresInfo;
	readonly decksSearchString: string;

	readonly initComplete: boolean;

	// readonly topDecks: readonly DuelsGroupedDecks[] = undefined;

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

// Tmp
export interface DuelsBucketsData {
	readonly bucketId: string;
	readonly bucketName: string;
	readonly cards: readonly BucketCard[];
}

interface BucketCard {
	readonly cardId: string;
	readonly cardName: string;
	readonly totalOffered: number;
}
