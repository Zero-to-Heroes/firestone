import { GameState } from '../../../../models/decktracker/game-state';
import { GameEvent } from '../../../../models/game-event';
import { DeckManipulationHelper } from '../deck-manipulation-helper';
import { EventParser } from '../event-parser';

export class ExplosiveTrapSecretParser implements EventParser {
	private readonly secretCardId = 'EX1_610';

	constructor(private readonly helper: DeckManipulationHelper) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.ATTACK_ON_HERO;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const attackedPlayerControllerId = gameEvent.additionalData.targetControllerId;
		const activePlayerId = gameEvent.gameState.ActivePlayerId;
		// Secrets don't trigger during your turn
		if (activePlayerId === attackedPlayerControllerId) {
			return currentState;
		}
		const isPlayedBeingAttacked = attackedPlayerControllerId === gameEvent.localPlayer.PlayerId;
		const deckWithSecretToCheck = isPlayedBeingAttacked ? currentState.playerDeck : currentState.opponentDeck;
		// If board is full, secret can't trigger so we can't eliminate any option
		if (deckWithSecretToCheck.board.length === 7) {
			return currentState;
		}
		const newPlayerDeck = this.helper.removeSecretOption(deckWithSecretToCheck, this.secretCardId);
		return Object.assign(new GameState(), currentState, {
			[isPlayedBeingAttacked ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return 'SECRET_EXPLOSIVE_TRAP';
	}
}
