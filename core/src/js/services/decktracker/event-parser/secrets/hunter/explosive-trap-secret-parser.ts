import { GameState } from '../../../../../models/decktracker/game-state';
import { GameEvent } from '../../../../../models/game-event';
import { DeckManipulationHelper } from '../../deck-manipulation-helper';
import { EventParser } from '../../event-parser';

export class ExplosiveTrapSecretParser implements EventParser {
	private readonly secretCardId = 'EX1_610';

	constructor(private readonly helper: DeckManipulationHelper) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.ATTACKING_HERO;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const defenderPlayerControllerId = gameEvent.additionalData.defenderControllerId;
		const isPlayerTheAttackedParty = defenderPlayerControllerId === gameEvent.localPlayer.PlayerId;
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
		return 'SECRET_EXPLOSIVE_TRAP';
	}
}
