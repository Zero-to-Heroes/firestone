import { BnetRegion, Board } from '@firestone-hs/reference-data';
import { ArenaInfo } from '../../external-models/arena-info';
import { AccountInfo } from '../../models/account';
import { MemoryBgsPlayerInfo } from '../../models/battlegrounds-player-state';
import { BoostersInfo } from '../../models/boosters-info';
import { CoinInfo } from '../../models/coin-info';
import { DeckInfoFromMemory } from '../../models/deck-info-from-memory';
import { MemoryMercenariesCollectionInfo } from '../../models/memory-mercenaries-collection-info';
import { MemoryMercenariesInfo } from '../../models/memory-mercenaries-info';
import { MemoryPlayerProfileInfo } from '../../models/memory-profile-info';
import { MemoryUpdate } from '../../models/memory-update';
import { MemoryQuestsLog } from '../../models/quests';
import { RewardsTrackInfos } from '../../models/rewards-track-info';
import { InternalHsAchievementsCategory } from './operations/get-achievements-categories-operation';
import { InternalHsAchievementsInfo } from './operations/get-achievements-info-operation';

export interface IMindVisionFacade {
	// Event listeners
	globalEventListener: (first: string, second: string) => Promise<void>;
	memoryUpdateListener: (changes: string | 'reset') => Promise<void>;

	// Core functionality
	listenForUpdates(): Promise<void>;
	isBootstrapped(): Promise<boolean | null>;
	getMemoryChanges(): Promise<MemoryUpdate | null>;

	// Collection methods
	getCollection(throwException?: boolean, debug?: boolean): Promise<any[] | null>;
	getCollectionSize(throwException?: boolean, debug?: boolean): Promise<number | null>;
	getBattlegroundsOwnedHeroSkinDbfIds(): Promise<readonly number[] | null>;
	getCardBacks(): Promise<any[] | null>;
	getCoins(): Promise<CoinInfo[] | null>;

	// Match and game state methods
	getMatchInfo(): Promise<any>;
	getCurrentBoard(): Promise<Board | null>;
	getCurrentScene(): Promise<number | null>;
	getGameUniqueId(): Promise<string | null>;
	getRegion(): Promise<BnetRegion | null>;

	// Battlegrounds methods
	getBgsPlayerTeammateBoard(): Promise<MemoryBgsPlayerInfo | null>;
	getBgsPlayerBoard(): Promise<MemoryBgsPlayerInfo | null>;
	getBattlegroundsInfo(forceReset?: boolean): Promise<{ Rating: number } | null>;
	getBattlegroundsSelectedMode(forceReset?: boolean): Promise<'solo' | 'duos' | null>;

	// Mercenaries methods
	getMercenariesInfo(forceReset?: boolean): Promise<MemoryMercenariesInfo | null>;
	getMercenariesCollectionInfo(forceReset?: boolean): Promise<MemoryMercenariesCollectionInfo | null>;

	// Arena methods
	getArenaInfo(): Promise<ArenaInfo | null>;
	getArenaDeck(): Promise<DeckInfoFromMemory | null>;

	// Deck methods
	getActiveDeck(selectedDeckId: number | undefined, forceReset?: boolean): Promise<any>;
	getSelectedDeckId(forceReset: boolean): Promise<number | null>;
	getWhizbangDeck(deckId: number | undefined): Promise<any>;

	// Rewards and progression methods
	getRewardsTrackInfo(): Promise<RewardsTrackInfos | null>;
	getBoostersInfo(): Promise<BoostersInfo | null>;
	getActiveQuests(): Promise<MemoryQuestsLog | null>;

	// Achievements methods
	getAchievementsInfo(forceReset?: boolean): Promise<InternalHsAchievementsInfo | null>;
	getAchievementCategories(forceReset?: boolean): Promise<readonly InternalHsAchievementsCategory[] | null>;
	getInGameAchievementsProgressInfo(achievementIds: readonly number[]): Promise<InternalHsAchievementsInfo | null>;
	getInGameAchievementsProgressInfoByIndex(
		achievementIds: readonly number[],
	): Promise<InternalHsAchievementsInfo | null>;

	// Player info methods
	getPlayerProfileInfo(): Promise<MemoryPlayerProfileInfo | null>;
	getAccountInfo(): Promise<AccountInfo | null>;

	// Plugin lifecycle methods
	initializePlugin(): Promise<void>;
	reset(): Promise<void>;
	tearDown(): Promise<void>;
}
