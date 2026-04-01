import { GameStat, StatGameFormatType } from '@firestone/stats/data-access';

export interface DeckSummary {
	readonly deckstring: string;
	readonly deckName: string;
	readonly deckArchetype: string;
	readonly class: string;
	readonly skin: string;
	readonly totalGames: number;
	readonly totalWins: number;
	readonly winRatePercentage: number;
	readonly lastUsedTimestamp: number;
	readonly matchupStats: readonly MatchupStat[];
	readonly hidden: boolean;
	// Format of the deck. A Standard deck can have Wild matches attached to it
	readonly format: StatGameFormatType;
	readonly replays: readonly GameStat[];
	readonly isPersonalDeck?: boolean;
	readonly allVersions: readonly DeckSummaryVersion[];
	readonly allCardsInDeck: readonly string[];
	/** True when this row groups deckstrings from more than one class. */
	readonly versionGroupHasMultipleClasses?: boolean;
	/** Copy of `constructedDeckVersions[].groupName` when the row is a merged group. */
	readonly versionGroupName?: string;
}

export interface DeckSummaryVersion extends DeckSummary {
	readonly differentCards: readonly string[];
	readonly backgroundImage: string;
}

export interface MatchupStat {
	readonly opponentClass: string;
	readonly totalGames: number;
	readonly totalWins: number;
	readonly totalGamesFirst: number;
	readonly totalGamesCoin: number;
	readonly totalWinsFirst: number;
	readonly totalWinsCoin: number;
}
