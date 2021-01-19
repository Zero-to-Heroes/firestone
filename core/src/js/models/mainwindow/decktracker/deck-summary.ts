import { GameStat } from '../stats/game-stat';
import { MatchupStat } from '../stats/matchup-stat';

export class DeckSummary {
	readonly deckstring: string;
	readonly deckName: string;
	readonly deckArchetype: string;
	readonly class: string;
	readonly skin: string;
	readonly totalGames: number;
	readonly winRatePercentage: number;
	readonly lastUsedTimestamp: number;
	readonly matchupStats: readonly MatchupStat[];
	readonly hidden: boolean;
	readonly replays: readonly GameStat[];
}
