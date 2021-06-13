import { AllCardsService } from '@firestone-hs/replay-parser';
import { BoardSecret } from '../../../models/decktracker/board-secret';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { SecretOption } from '../../../models/decktracker/secret-option';
import { GameEvent } from '../../../models/game-event';
import { CopiedFromEntityIdGameEvent } from '../../../models/mainwindow/game-events/copied-from-entity-id-game-event';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class CopiedFromEntityIdParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper, private readonly allCards: AllCardsService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.COPIED_FROM_ENTITY_ID;
	}

	async parse(currentState: GameState, gameEvent: CopiedFromEntityIdGameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		// console.debug('copied from entity id event', cardId, controllerId, localPlayer, entityId, gameEvent);
		const copiedCardEntityId = gameEvent.additionalData.copiedCardEntityId;
		const copiedCardControllerId = gameEvent.additionalData.copiedCardControllerId;
		// console.debug('copiedCardEntityId', copiedCardEntityId);
		// console.debug('copiedCardControllerId', copiedCardControllerId);

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		// console.debug('isPlayer', isPlayer, deck);

		const isCopiedPlayer = copiedCardControllerId === localPlayer.PlayerId;
		const copiedDeck = isCopiedPlayer ? currentState.playerDeck : currentState.opponentDeck;
		// console.debug('isCopiedPlayer', isCopiedPlayer, copiedDeck);

		const newCopy: DeckCard = deck.findCard(entityId);
		const copiedCard: DeckCard = copiedDeck.findCard(copiedCardEntityId);
		// console.debug('newCopy', newCopy);
		// console.debug('copiedCard', copiedCard);

		if (!copiedCard) {
			return currentState;
		}

		const updatedCardId = newCopy?.cardId ?? copiedCard.cardId;
		const updatedCopiedCard = copiedCard.update({
			cardId: updatedCardId,
			cardName: this.allCards.getCard(updatedCardId)?.name ?? copiedCard.cardId,
		} as DeckCard);
		const newCopiedDeck = this.helper.updateCardInDeck(copiedDeck, updatedCopiedCard);
		// console.debug('updatedCopiedCard', updatedCopiedCard, newCopiedDeck);

		// Also update the secrets
		const copiedDeckWithSecrets: DeckState = this.updateSecrets(
			newCopiedDeck,
			updatedCopiedCard.cardId,
			copiedCardEntityId,
		);
		// console.debug('copiedDeckWithSecrets', copiedDeckWithSecrets);

		return Object.assign(new GameState(), currentState, {
			[isCopiedPlayer ? 'playerDeck' : 'opponentDeck']: copiedDeckWithSecrets,
		});
	}

	private updateSecrets(deck: DeckState, cardId: string, copiedCardEntityId: number): DeckState {
		return deck.update({
			secrets: deck.secrets.map((secret) =>
				secret.entityId === copiedCardEntityId
					? secret.update({
							cardId: cardId,
							allPossibleOptions: secret.allPossibleOptions.map((option) =>
								option.cardId === cardId
									? option.update({ ...option, isValidOption: true } as SecretOption)
									: option.update({ ...option, isValidOption: false } as SecretOption),
							) as readonly SecretOption[],
					  } as BoardSecret)
					: secret,
			) as readonly BoardSecret[],
		} as DeckState);
	}

	event(): string {
		return GameEvent.COPIED_FROM_ENTITY_ID;
	}
}
