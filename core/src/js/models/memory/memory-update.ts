import { DungeonCrawlOptionType, SceneMode } from '@firestone-hs/reference-data';
import { CardPackInfo, PackInfo } from './pack-info';

export interface MemoryUpdate {
	readonly ShouldReset: boolean;
	readonly DisplayingAchievementToast: boolean;
	readonly CurrentScene: SceneMode;
	readonly XpChanges: readonly XpChange[];
	readonly SelectedDeckId: number;
	readonly ArenaRewards: readonly Reward[];
	readonly IsOpeningPack: boolean;
	// true means the treasure selection has started, null means nothing changed, and false means it has ended
	readonly IsMercenariesSelectingTreasure: boolean;
	readonly IsMercenariesTasksUpdated: boolean;
	readonly MercenariesPendingTreasureSelection: MercenaryTreasureSelection;
	readonly BattlegroundsNewRating: number;
	readonly IsDuelsMainRunScreen: boolean;
	// readonly IsDuelsSelectingTreasure: boolean;
	// readonly DuelsPendingTreasureSelection: DuelsTreasureSelection;
	readonly DuelsCurrentOptionSelection: DungeonCrawlOptionType;

	// These are not populated by the regular info updates, as they are costly to compute
	readonly OpenedPack: PackInfo;
	readonly NewCards: readonly CardPackInfo[];
}

export interface XpChange {
	readonly CurrentLevel: number;
	readonly CurrentXp: number;
	readonly PreviousLevel: number;
	readonly PreviousXp: number;
	readonly RewardSourceId: number;
	readonly RewardSourceType: number;
}

export interface Reward {
	readonly Type: number;
	readonly Amount: number;
	readonly BoosterId: number;
}

export interface MercenaryTreasureSelection {
	readonly MercenaryId: number;
	readonly Options: readonly number[];
}

export interface DuelsTreasureSelection {
	readonly Options: readonly number[];
}
