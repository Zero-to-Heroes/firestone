import { GameType } from '@firestone-hs/reference-data';
import { GameStat } from '../mainwindow/stats/game-stat';
import { DeckState } from './deck-state';
import { Metadata } from './metadata';
import { StatsRecap } from './stats-recap';

export class GameState {
	readonly playerDeck: DeckState = new DeckState();
	readonly opponentDeck: DeckState = new DeckState();
	readonly deckStats: readonly GameStat[] = [];
	readonly deckStatsRecap: StatsRecap;
	readonly matchupStatsRecap: StatsRecap;
	readonly mulliganOver: boolean = false;
	readonly metadata: Metadata = new Metadata();
	readonly currentTurn: number | 'mulligan' = 'mulligan';
	readonly gameStarted: boolean;

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
