import { GameType } from '@firestone-hs/reference-data';
import { GameStat } from '../mainwindow/stats/game-stat';
import { DeckState } from './deck-state';
import { Metadata } from './metadata';
import { StatsRecap } from './stats-recap';

// The goal of this state is ultimately to store all the information linked to the live data
// (tracker, BG, constructed second screen, etc.)
export class GameState {
	readonly playerDeck: DeckState = new DeckState();
	readonly opponentDeck: DeckState = new DeckState();
	readonly mulliganOver: boolean = false;
	readonly metadata: Metadata = new Metadata();
	readonly currentTurn: number | 'mulligan' = 'mulligan';
	readonly gameStarted: boolean;
	readonly gameEnded: boolean;
	readonly spectating: boolean;

	// When adding new stuff, don't forget to clean them in twitch-auth.service.ts
	readonly deckStats: readonly GameStat[] = [];
	readonly deckStatsRecap: StatsRecap;
	readonly matchupStatsRecap: StatsRecap;
	// readonly archetypesConfig: readonly ArchetypeConfig[];
	// readonly archetypesStats: ArchetypeStats;
	// readonly constructedState: ConstructedState = new ConstructedState();

	public static create(): GameState {
		return Object.assign(new GameState());
	}

	public update(value: GameState): GameState {
		return Object.assign(new GameState(), this, value);
	}

	public isBattlegrounds(): boolean {
		return (
			this.metadata.gameType === GameType.GT_BATTLEGROUNDS ||
			this.metadata.gameType === GameType.GT_BATTLEGROUNDS_FRIENDLY
		);
	}
}
