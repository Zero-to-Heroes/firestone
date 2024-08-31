import { PlayerBoard } from '@firestone/battlegrounds/core';
import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsPlayerBoardEvent extends BattlegroundsStoreEvent {
	constructor(
		// Boards at the start of the battle. The playerBoard is the board of the first fighter, so it can be
		// either the player board or the teammate board
		public readonly playerBoard: PlayerBoard,
		public readonly opponentBoard: PlayerBoard,
		// Board snapshots as taken right before the start of the battle
		public readonly latestPlayerBoard: PlayerBoard,
		// public readonly teammateBoard: MemoryBgsPlayerInfo,
		// Snapshots of the boards when an opponent swap occurs
		public readonly duoPendingBoards?: readonly { playerBoard: PlayerBoard; opponentBoard: PlayerBoard }[],
	) {
		super('BgsPlayerBoardEvent');
	}
}
