import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { AllCardsService } from '../../all-cards.service';
import { DeckParserService } from '../deck-parser.service';
import { DeckEvents } from './deck-events';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class SecretPlayedFromHandParser implements EventParser {
	constructor(private deckParser: DeckParserService, private allCards: AllCardsService) {}

	applies(gameEvent: GameEvent): boolean {
		return gameEvent.type === GameEvent.SECRET_PLAYED;
	}

	parse(currentState: GameState, gameEvent: GameEvent): GameState {
		if (currentState.playerDeck.deckList.length === 0) {
			return currentState;
		}
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();

		const isPlayer = cardId && controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const card = DeckManipulationHelper.findCardInZone(deck.hand, cardId, entityId);

		const newHand: readonly DeckCard[] = DeckManipulationHelper.removeSingleCardFromZone(deck.hand, cardId, entityId);
		const previousOtherZone = deck.otherZone;
		const newOtherZone: readonly DeckCard[] = DeckManipulationHelper.addSingleCardToZone(previousOtherZone, card);
		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			hand: newHand,
			otherZone: newOtherZone,
		});
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return DeckEvents.SECRET_PLAYED_FROM_HAND;
	}
}
