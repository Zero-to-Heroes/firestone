import { GameState } from '../../../../../models/decktracker/game-state';
import { GameEvent } from '../../../../../models/game-event';
import { DeckManipulationHelper } from '../../deck-manipulation-helper';
import { EventParser } from '../../event-parser';

export class BearTrapSecretParser implements EventParser {
	private readonly secretCardId = 'AT_060';

	constructor(private readonly helper: DeckManipulationHelper) {}

	// Whenever something occurs that publicly reveal a card, we try to assign its
	// cardId to the corresponding entity
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.ATTACKING_HERO;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const defenderControllerId = gameEvent.additionalData.defenderControllerId;
		// const attackerControllerId = gameEvent.additionalData.attackerControllerId;
		const isPlayerTheAttackedParty = defenderControllerId === gameEvent.localPlayer.PlayerId;
		const activePlayerId = gameEvent.gameState.ActivePlayerId;
		const deckWithSecretToCheck = isPlayerTheAttackedParty ? currentState.playerDeck : currentState.opponentDeck;
		if (isPlayerTheAttackedParty && activePlayerId === gameEvent.localPlayer.PlayerId) {
			return currentState;
		}
		if (!isPlayerTheAttackedParty && activePlayerId === gameEvent.opponentPlayer.PlayerId) {
			return currentState;
		}
		// If board is full, secret can't trigger so we can't eliminate any option
		if (deckWithSecretToCheck.board.length === 7) {
			return currentState;
		}
		const newPlayerDeck = this.helper.removeSecretOption(deckWithSecretToCheck, this.secretCardId);
		return Object.assign(new GameState(), currentState, {
			[isPlayerTheAttackedParty ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return 'SECRET_BEAR_TRAP';
	}
}
