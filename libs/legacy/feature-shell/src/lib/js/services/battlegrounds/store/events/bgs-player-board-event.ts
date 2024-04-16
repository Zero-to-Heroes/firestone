import { PlayerBoard } from '@firestone/battlegrounds/common';
import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsPlayerBoardEvent extends BattlegroundsStoreEvent {
	constructor(
		public readonly playerBoard: PlayerBoard,
		public readonly opponentBoard: PlayerBoard,
		public readonly duoPendingBoards?: readonly { playerBoard: PlayerBoard; opponentBoard: PlayerBoard }[],
	) {
		super('BgsPlayerBoardEvent');
	}
}
