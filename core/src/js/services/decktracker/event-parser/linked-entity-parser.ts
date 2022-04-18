import { Zone } from '@firestone-hs/reference-data';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { LocalizationFacadeService } from '../../localization-facade.service';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class LinkedEntityParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper, private readonly i18n: LocalizationFacadeService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.LINKED_ENTITY;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();

		const linkedEntityControllerId = gameEvent.additionalData.linkedEntityControllerId;

		const isPlayerForFind = controllerId === localPlayer.PlayerId;
		const deckInWhichToFindTheCard = isPlayerForFind ? currentState.playerDeck : currentState.opponentDeck;

		const isPlayerForAdd = linkedEntityControllerId === localPlayer.PlayerId;
		const deckInWhichToAddTheCard = isPlayerForAdd ? currentState.playerDeck : currentState.opponentDeck;

		let newCard = deckInWhichToFindTheCard.findCard(entityId);
		if (!newCard) {
			newCard = DeckCard.create({
				cardId: cardId,
				cardName: this.i18n.getCardName(cardId),
				entityId: entityId,
			} as DeckCard);
		}
		const originalCard = deckInWhichToFindTheCard.findCard(gameEvent.additionalData.linkedEntityId);
		let newPlayerDeck: DeckState;
		if (originalCard) {
			const updatedCard = originalCard.update({
				cardId: newCard.cardId,
				// Because when cards are revealed when Dredged, we want to update the position for all the revealed cards,
				// even ones who already had a position previously
				positionFromBottom: newCard.positionFromBottom ?? originalCard.positionFromBottom,
			} as DeckCard);
			//console.debug('[linked-entity-parser] updating card', updatedCard, newCard, originalCard);
			newPlayerDeck = this.helper.updateCardInDeck(deckInWhichToAddTheCard, updatedCard);
			//console.debug('[linked-entity-parser] newPlayerDeck', newPlayerDeck);
		} else {
			// Can happen for BG heroes
			if (gameEvent.additionalData.linkedEntityZone !== Zone.DECK) {
				return currentState;
			}
			// We don't add the initial cards in the deck, so if no card is found, we create it
			const updatedCard = DeckCard.create({
				...newCard,
				entityId: gameEvent.additionalData.linkedEntityId,
				zone: undefined,
			} as DeckCard);
			console.debug('[linked-entity-parser] adding card', updatedCard);
			const intermediaryDeck = this.helper.removeSingleCardFromZone(
				deckInWhichToAddTheCard.deck,
				updatedCard.cardId,
				updatedCard.entityId,
				true,
			)[0];
			const newDeck = this.helper.addSingleCardToZone(intermediaryDeck, updatedCard);
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
