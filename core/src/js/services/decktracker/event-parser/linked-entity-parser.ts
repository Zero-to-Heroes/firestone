import { Zone } from '@firestone-hs/reference-data';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class LinkedEntityParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.LINKED_ENTITY;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();

		console.debug('linkedEntity', gameEvent, currentState);
		const linkedEntityControllerId = gameEvent.additionalData.linkedEntityControllerId;

		const isPlayerForFind = controllerId === localPlayer.PlayerId;
		const deckInWhichToFindTheCard = isPlayerForFind ? currentState.playerDeck : currentState.opponentDeck;

		const isPlayerForAdd = linkedEntityControllerId === localPlayer.PlayerId;
		const deckInWhichToAddTheCard = isPlayerForAdd ? currentState.playerDeck : currentState.opponentDeck;

		const newCard = deckInWhichToFindTheCard.findCard(entityId);
		console.debug('newCard', newCard);
		const originalCard = deckInWhichToFindTheCard.findCard(gameEvent.additionalData.linkedEntityId);
		console.debug('originalCard', originalCard);
		let newPlayerDeck: DeckState;
		if (originalCard) {
			const updatedCard = originalCard.update({
				cardId: newCard.cardId,
			} as DeckCard);
			newPlayerDeck = this.helper.updateCardInDeck(deckInWhichToAddTheCard, updatedCard);
			console.debug('found original card, updating', updatedCard);
		} else {
			if (gameEvent.additionalData.linkedEntityZone !== Zone.DECK) {
				console.error(
					'invalid linked entity zone?',
					cardId,
					controllerId,
					localPlayer,
					entityId,
					gameEvent.additionalData.linkedEntityId,
					gameEvent.additionalData.linkedEntityZone,
					gameEvent,
				);
				return currentState;
			}
			// We don't add the initial cards in the deck, so if no card is found, we create it
			const updatedCard = DeckCard.create({
				...newCard,
				entityId: gameEvent.additionalData.linkedEntityId,
				zone: undefined,
			} as DeckCard);
			const intermediaryDeck = this.helper.removeSingleCardFromZone(
				deckInWhichToAddTheCard.deck,
				updatedCard.cardId,
				updatedCard.entityId,
				true,
			)[0];
			const newDeck = this.helper.addSingleCardToZone(intermediaryDeck, updatedCard);
			console.debug('no card present, creating new card in deck', newDeck);
			newPlayerDeck = deckInWhichToAddTheCard.update({
				deck: newDeck,
			} as DeckState);
		}
		return Object.assign(new GameState(), currentState, {
			[isPlayerForAdd ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.LINKED_ENTITY;
	}
}
