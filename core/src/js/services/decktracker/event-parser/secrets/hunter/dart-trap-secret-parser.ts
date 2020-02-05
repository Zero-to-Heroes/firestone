import { GameState } from '../../../../../models/decktracker/game-state';
import { GameEvent } from '../../../../../models/game-event';
import { DeckManipulationHelper } from '../../deck-manipulation-helper';
import { EventParser } from '../../event-parser';

export class DartTrapSecretParser implements EventParser {
	private readonly secretCardId = 'LOE_021';

	constructor(private readonly helper: DeckManipulationHelper) {}

	// Whenever something occurs that publicly reveal a card, we try to assign its
	// cardId to the corresponding entity
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.HERO_POWER_USED;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const userControllerId = gameEvent.controllerId;
		const isPlayerTheOneWhoUsedTheHeroPower = userControllerId === gameEvent.localPlayer.PlayerId;
		// const activePlayerId = gameEvent.gameState.ActivePlayerId;
		// // Secrets don't trigger during your turn
		// if (activePlayerId === userControllerId) {
		// 	console.log('dont trigger dart trap', activePlayerId, userControllerId, gameEvent);
		// 	return currentState;
		// }
		const deckWithSecretToCheck = isPlayerTheOneWhoUsedTheHeroPower
			? currentState.opponentDeck
			: currentState.playerDeck;
		console.log('[dart-trap]', isPlayerTheOneWhoUsedTheHeroPower, deckWithSecretToCheck, gameEvent);
		const newPlayerDeck = this.helper.removeSecretOption(deckWithSecretToCheck, this.secretCardId);
		return Object.assign(new GameState(), currentState, {
			[isPlayerTheOneWhoUsedTheHeroPower ? 'opponentDeck' : 'playerDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return 'SECRET_DART_TRAP';
	}
}
