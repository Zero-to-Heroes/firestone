import { BattlegroundsBoardState } from './battlegrounds-board-state';

export class BattlegroundsPlayer {
	readonly name: string;
	readonly cardId: string;
	readonly leaderboardPlace: number;
	readonly tavernTier: number;
	readonly boardState: BattlegroundsBoardState;

	public static create(cardId: string): BattlegroundsPlayer {
		return Object.assign(new BattlegroundsPlayer(), {
			cardId: cardId,
			leaderboardPlace: 1, // The value by default in the game
		} as BattlegroundsPlayer);
	}

	private constructor() {}

	public addNewBoardState(boardState: BattlegroundsBoardState): BattlegroundsPlayer {
		return Object.assign(new BattlegroundsPlayer(), this, {
			boardState: boardState,
		} as BattlegroundsPlayer);
	}

	public update(newValue: BattlegroundsPlayer): BattlegroundsPlayer {
		return Object.assign(new BattlegroundsPlayer(), this, newValue);
	}
}
