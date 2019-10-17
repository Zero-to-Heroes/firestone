import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { ReferenceCard } from '../../../models/reference-cards/reference-card';
import { AllCardsService } from '../../all-cards.service';
import { DeckEvents } from './deck-events';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class CardChangedOnBoardParser implements EventParser {
	constructor(private allCards: AllCardsService) {}

	applies(gameEvent: GameEvent): boolean {
		return gameEvent.type === GameEvent.CARD_CHANGED_ON_BOARD;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();

		const isPlayer = cardId && controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		// We don't pass the cardId because we know it has changed
		const card = DeckManipulationHelper.findCardInZone(deck.board, null, entityId);
		if (!card) {
			console.error('[card-changed-on-board] could not find card change on board', entityId, deck.board);
			return currentState;
		}
		// The CARD_CHANGED* events keep the same entityId, but change the cardId, and thus the card name
		const dbCard = this.allCards.getCard(cardId) || ({} as ReferenceCard);
		const updatedCard = Object.assign(new DeckCard(), card, {
			cardId: cardId,
			cardName: dbCard.name,
			manaCost: dbCard.cost,
			rarity: dbCard.rarity ? dbCard.rarity.toLowerCase() : null,
		} as DeckCard);
		const boardWithRemovedCard: readonly DeckCard[] = DeckManipulationHelper.removeSingleCardFromZone(
			deck.board,
			null,
			entityId,
		);
		const newBoard: readonly DeckCard[] = DeckManipulationHelper.addSingleCardToZone(
			boardWithRemovedCard,
			updatedCard,
		);
		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			board: newBoard,
		});
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return DeckEvents.CARD_CHANGED_ON_BOARD;
	}
}
