import { AttackOnBoard, GameState } from '@firestone/game-state';
import { GameEvent } from '../../../models/game-event';
import { EventParser } from './event-parser';

export class AttackOnBoardParser implements EventParser {
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const attackOnBoard = gameEvent.additionalData.attackOnBoard;
		const newPlayerDeck = areEqual(attackOnBoard.Player, currentState.playerDeck.totalAttackOnBoard)
			? currentState.playerDeck
			: currentState.playerDeck.update({
					totalAttackOnBoard: {
						board: attackOnBoard.Player.Board,
						hero: attackOnBoard.Player.Hero,
					},
			  });
		const newOpponentDeck = areEqual(attackOnBoard.Opponent, currentState.opponentDeck.totalAttackOnBoard)
			? currentState.opponentDeck
			: currentState.opponentDeck.update({
					totalAttackOnBoard: {
						board: attackOnBoard.Opponent.Board,
						hero: attackOnBoard.Opponent.Hero,
					},
			  });
		return newPlayerDeck === currentState.playerDeck && newOpponentDeck === currentState.opponentDeck
			? currentState
			: currentState.update({
					playerDeck: newPlayerDeck,
					opponentDeck: newOpponentDeck,
			  });
	}

	event(): string {
		return GameEvent.TOTAL_ATTACK_ON_BOARD;
	}
}

const areEqual = (attackOnBoardFromLogs: any, otherAttackOnBoard: AttackOnBoard): boolean => {
	return (
		attackOnBoardFromLogs.Board === (otherAttackOnBoard?.board ?? 0) &&
		attackOnBoardFromLogs.Hero === (otherAttackOnBoard?.hero ?? 0)
	);
};
