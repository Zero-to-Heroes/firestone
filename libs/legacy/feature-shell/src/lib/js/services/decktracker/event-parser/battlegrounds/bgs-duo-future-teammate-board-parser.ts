import { GameState } from '@firestone/game-state';
import { GameEvent } from '@legacy-import/src/lib/js/models/game-event';
import { EventParser } from '../event-parser';

export class BgsDuoFutureTeammateBoardParser implements EventParser {
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const newBoard = {
			playerBoard: {
				heroCardId: gameEvent.additionalData.playerBoard.cardId,
				playerId: gameEvent.additionalData.playerBoard.playerId,
				board: gameEvent.additionalData.playerBoard.board,
				secrets: gameEvent.additionalData.playerBoard.secrets,
				trinkets: gameEvent.additionalData.playerBoard.trinkets,
				hand: gameEvent.additionalData.playerBoard.hand,
				hero: gameEvent.additionalData.playerBoard.hero,
				heroPowers: gameEvent.additionalData.playerBoard.heroPowers,
				questRewards: gameEvent.additionalData.playerBoard.questRewards,
				questRewardEntities: gameEvent.additionalData.playerBoard.questRewardEntities,
				questEntities: gameEvent.additionalData.playerBoard.questEntities,
				globalInfo: gameEvent.additionalData.playerBoard.globalInfo,
			},
			opponentBoard: {
				heroCardId: gameEvent.additionalData.opponentBoard.cardId,
				playerId: gameEvent.additionalData.opponentBoard.playerId,
				board: gameEvent.additionalData.opponentBoard.board,
				secrets: gameEvent.additionalData.opponentBoard.secrets,
				trinkets: gameEvent.additionalData.opponentBoard.trinkets,
				hand: gameEvent.additionalData.opponentBoard.hand,
				hero: gameEvent.additionalData.opponentBoard.hero,
				heroPowers: gameEvent.additionalData.opponentBoard.heroPowers,
				questRewards: gameEvent.additionalData.opponentBoard.questRewards,
				questRewardEntities: gameEvent.additionalData.opponentBoard.questRewardEntities,
				questEntities: gameEvent.additionalData.opponentBoard.questEntities,
				globalInfo: gameEvent.additionalData.opponentBoard.globalInfo,
			},
		};

		const newState = currentState.bgState.update({
			duoPendingBoards: [...currentState.bgState.duoPendingBoards, newBoard],
		});
		return currentState.update({
			bgState: newState,
		});
	}

	event(): string {
		return GameEvent.BATTLEGROUNDS_DUO_FUTURE_TEAMMATE_BOARD;
	}
}
