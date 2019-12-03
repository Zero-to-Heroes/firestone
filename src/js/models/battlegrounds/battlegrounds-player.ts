import { BattlegroundsBoardState } from './battlegrounds-board-state';

export class BattlegroundsPlayer {
	readonly name: string;
	readonly cardId: string;
	readonly leaderboardPlace: number;
	readonly boardStates: readonly BattlegroundsBoardState[] = [];

	public static create(cardId: string): BattlegroundsPlayer {
		return Object.assign(new BattlegroundsPlayer(), {
			cardId: cardId,
		} as BattlegroundsPlayer);
	}

	private constructor() {}

	public addNewBoardState(boardState: BattlegroundsBoardState): BattlegroundsPlayer {
		return Object.assign(new BattlegroundsPlayer(), this, {
			boardStates: [boardState, ...this.boardStates] as readonly BattlegroundsBoardState[],
		} as BattlegroundsPlayer);
	}
}
