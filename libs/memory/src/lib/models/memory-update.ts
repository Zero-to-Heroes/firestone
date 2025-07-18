import {
	ArenaClientStateType,
	ArenaSessionState,
	DraftMode,
	DraftSlotType,
	GameType,
	RewardTrackType,
	SceneMode,
	Zone,
} from '@firestone-hs/reference-data';
import { CardPackInfo, PackInfo } from './pack-info';

export interface MemoryUpdate {
	readonly ShouldReset: boolean;

	readonly CurrentScene: SceneMode;
	readonly isFriendsListOpen: boolean;
	readonly XpChanges: readonly XpChange[];

	readonly CollectionInit: boolean;
	readonly CollectionCardsCount: number;
	readonly CollectionCardBacksCount: number;
	readonly CollectionCoinsCount: number;
	readonly CollectionBgHeroSkinsCount: number;
	readonly BoostersCount: number;
	readonly IsOpeningPack: boolean;

	readonly NumberOfAchievementsCompleted: number;
	readonly DisplayingAchievementToast: boolean;

	readonly SelectedDeckId: number;

	readonly ArenaDraftStep: DraftSlotType;
	readonly ArenaRewards: readonly Reward[];
	readonly ArenaHeroOptions: readonly string[];
	readonly ArenaCardOptions: readonly ArenaCardOption[];
	readonly ArenaPackageCardOptions: readonly string[];
	readonly ArenaCurrentCardsInDeck: number;
	readonly ArenaDraftScreenHidden: boolean;
	readonly ArenaCurrentMode: GameType;
	readonly ArenaDraftMode: DraftMode;
	readonly ArenaClientState: ArenaClientStateType;
	readonly ArenaSessionState: ArenaSessionState;
	readonly ArenaLatestCardPick: ArenaCardPick;
	readonly ArenaUndergroundLatestCardPick: ArenaCardPick;

	// true means the treasure selection has started, null means nothing changed, and false means it has ended
	readonly MercenariesTreasureSelectionIndex: number;
	readonly MercenariesPendingTreasureSelection: MercenaryTreasureSelection;

	readonly BattlegroundsNewRating: number;
	readonly BattlegroundsSelectedGameMode: string;

	readonly MousedOverCard: MousedOverCard;
	readonly CardChoicesHidden: boolean | null;

	// These are not populated by the regular info updates, as they are costly to compute
	readonly OpenedPacks: readonly PackInfo[];
	readonly MassOpenedPacks: readonly PackInfo[];
	readonly NewCards: readonly CardPackInfo[];
}

export interface ArenaCardPick {
	readonly GameType: GameType;
	readonly RunId: string;
	readonly PickNumber: number;
	readonly CardId: string;
	readonly Options: readonly ArenaCardOption[];
	readonly HeroCardId: string;
}

export interface ArenaCardOption {
	readonly CardId: string;
	readonly PackageCardIds: readonly string[];
}

export interface XpChange {
	readonly RewardTrackType: RewardTrackType;
	readonly CurrentLevel: number;
	readonly CurrentTotalXp: number;
	readonly CurrentXpInLevel: number;
	readonly CurrentXpNeededForLevel: number;
	readonly XpGained: number;
	readonly XpBonusPercent: number;
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

export interface MousedOverCard {
	readonly EntityId: number;
	readonly CardId: string;
	readonly PlayerId: number;
	readonly Zone: Zone;
	readonly Side: Side;
}

export enum Side {
	NEUTRAL = 0,
	FRIENDLY = 1,
	OPPOSING = 2,
}
