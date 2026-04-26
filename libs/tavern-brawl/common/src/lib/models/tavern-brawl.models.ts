import {
	ConstructedCardData,
	ConstructedCoinPlayInfo,
	ConstructedDiscoverCardData,
	ConstructedMatchupInfo,
	GameFormat,
	RankBracket,
	TimePeriod,
} from '@firestone-hs/constructed-deck-stats';
import { BrawlInfo, DeckStat, StatForClass, TavernBrawlDetailedStats } from '@firestone-hs/tavern-brawl-stats';

export interface ExtendedDeckStats extends TavernBrawlDetailedStats {
	deckStats: readonly ExtendedDeckStat[];
}

export interface ExtendedDeckStat extends DeckStat {
	readonly allCardsInDeck: readonly string[];
	readonly totalGames: number;
	readonly rankBracket: RankBracket | null;
	readonly timePeriod: TimePeriod | null;
	readonly format: GameFormat | null;
	readonly archetypeId: number | null;
	readonly archetypeName: string | null;
	readonly lastUpdate: Date | null;
	readonly totalWins: number;
	readonly cardsData: readonly ConstructedCardData[];
	readonly discoverData: readonly ConstructedDiscoverCardData[];
	readonly matchupInfo: readonly ConstructedMatchupInfo[];
	readonly coinPlayInfo: readonly ConstructedCoinPlayInfo[];
	readonly cardVariations: {
		readonly added: readonly string[];
		readonly removed: readonly string[];
	};
	readonly archetypeCoreCards?: readonly string[];
}

export interface ExtendedBrawlInfo extends BrawlInfo {
	readonly nameLabel: string;
}

export interface TavernStatWithCollection extends StatForClass {
	readonly buildableDecklist: string | undefined;
	readonly hasBuildableDecks: boolean;
}
