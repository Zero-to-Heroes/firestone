import { SceneMode } from '@firestone-hs/reference-data';
import { CardPackInfo, PackInfo } from './pack-info';

export interface MemoryUpdate {
	readonly DisplayingAchievementToast: boolean;
	readonly CurrentScene: SceneMode;
	readonly XpChanges: readonly XpChange[];
	readonly OpenedPack: PackInfo;
	readonly SelectedDeckId: number;
	readonly ArenaRewards: readonly Reward[];

	// These are not populated by the regular info updates, as they are costly to compute
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
