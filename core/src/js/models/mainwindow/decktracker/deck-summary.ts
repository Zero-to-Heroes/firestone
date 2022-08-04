import { GameStat } from '../stats/game-stat';
import { MatchupStat } from '../stats/matchup-stat';
import { StatGameFormatType } from '../stats/stat-game-format.type';

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
}
