import { CardType } from '@firestone-hs/reference-data';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { GameState } from '../../../../models/decktracker/game-state';
import { GameEvent } from '../../../../models/game-event';
import { DeckManipulationHelper } from '../deck-manipulation-helper';
import { EventParser } from '../event-parser';

export class HiddenCacheSecretParser implements EventParser {
	private readonly secretCardId = 'CFM_026';

	constructor(private readonly helper: DeckManipulationHelper, private readonly allCards: AllCardsService) {}

	// Whenever something occurs that publicly reveal a card, we try to assign its
	// cardId to the corresponding entity
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.CARD_PLAYED;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		const activePlayerId = gameEvent.gameState.ActivePlayerId;
		// Secrets don't trigger during your turn
		if (activePlayerId === controllerId) {
			return currentState;
		}
		const dbCard = this.allCards.getCard(cardId);
		if (!dbCard || !dbCard.type || dbCard.type.toLowerCase() !== CardType[CardType.MINION].toLowerCase()) {
			return currentState;
		}

		const isMinionPlayedByPlayer = controllerId === localPlayer.PlayerId;
		const deckWithSecretToCheck = isMinionPlayedByPlayer ? currentState.opponentDeck : currentState.playerDeck;
		// if we don't have the cardID for all cards, we can draw no conclusion.
		// However this only happens when considering the secrets from the opponent's point of view,
		// and is only a dev thing
		if (deckWithSecretToCheck.hand.every(card => card.cardId)) {
			const cards = deckWithSecretToCheck.hand.map(card => this.allCards.getCard(card.cardId));
			// If there are no minions, we can't know
			// In all the other cases, we assume there is at least one minion and tick the secret off the list
			if (
				cards.every(card => card && card.type != null) &&
				!cards.some(card => card.type.toLowerCase() === CardType[CardType.MINION].toLowerCase())
			) {
				return currentState;
			}
		}
		const newPlayerDeck = this.helper.removeSecretOption(deckWithSecretToCheck, this.secretCardId);
		return Object.assign(new GameState(), currentState, {
			[isMinionPlayedByPlayer ? 'opponentDeck' : 'playerDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return 'SECRET_HIDDEN_CACHE';
	}
}
