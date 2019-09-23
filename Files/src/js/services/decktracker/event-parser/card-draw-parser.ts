import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { AllCardsService } from '../../all-cards.service';
import { DeckParserService } from '../deck-parser.service';
import { DeckEvents } from './deck-events';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class CardDrawParser implements EventParser {
	constructor(private deckParser: DeckParserService, private allCards: AllCardsService) {}

	applies(gameEvent: GameEvent): boolean {
		return gameEvent.type === GameEvent.CARD_DRAW_FROM_DECK;
	}

	parse(currentState: GameState, gameEvent: GameEvent): GameState {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		const isPlayer = cardId && controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		const card = DeckManipulationHelper.findCardInZone(deck.deck, cardId, entityId);
		const previousDeck = deck.deck;
		const newDeck: readonly DeckCard[] = DeckManipulationHelper.removeSingleCardFromZone(
			previousDeck,
			cardId,
			entityId,
		);
		const previousHand = deck.hand;
		const newHand: readonly DeckCard[] = DeckManipulationHelper.addSingleCardToZone(previousHand, card);
		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			deck: newDeck,
			hand: newHand,
		});
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return DeckEvents.CARD_DRAW;
	}
}
