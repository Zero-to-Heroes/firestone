import { AllCardsService } from '@firestone-hs/replay-parser';
import { GameState } from '../../../../models/decktracker/game-state';
import { GameEvent } from '../../../../models/game-event';
import { DeckManipulationHelper } from '../deck-manipulation-helper';
import { EventParser } from '../event-parser';

export class RatTrapSecretParser implements EventParser {
	private readonly secretCardId = 'GIL_577';

	constructor(private readonly helper: DeckManipulationHelper, private readonly allCards: AllCardsService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return (
			state &&
			gameEvent.type === GameEvent.NUM_CARDS_PLAYED_THIS_TURN &&
			gameEvent.additionalData.cardsPlayed >= 3
		);
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, cardPlayedControllerId, localPlayer, entityId] = gameEvent.parse();
		const activePlayerId = gameEvent.gameState.ActivePlayerId;
		// Secrets don't trigger during your turn
		if (activePlayerId === cardPlayedControllerId) {
			return currentState;
		}

		const isPlayedWithCardPlayed = cardPlayedControllerId === localPlayer.PlayerId;
		const deckWithSecretToCheck = isPlayedWithCardPlayed ? currentState.opponentDeck : currentState.playerDeck;

		if (deckWithSecretToCheck.board.length === 7) {
			return currentState;
		}
		const newPlayerDeck = this.helper.removeSecretOption(deckWithSecretToCheck, this.secretCardId);
		return Object.assign(new GameState(), currentState, {
			[isPlayedWithCardPlayed ? 'opponentDeck' : 'playerDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return 'SECRET_RAT_PACK';
	}
}
