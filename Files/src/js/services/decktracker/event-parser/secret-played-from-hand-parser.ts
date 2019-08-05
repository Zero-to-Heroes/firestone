import { EventParser } from './event-parser';
import { GameEvent } from '../../../models/game-event';
import { GameState } from '../../../models/decktracker/game-state';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckParserService } from '../deck-parser.service';
import { AllCardsService } from '../../all-cards.service';
import { DeckState } from '../../../models/decktracker/deck-state';
import { DeckEvents } from './deck-events';
import { DeckManipulationHelper } from './deck-manipulation-helper';

export class SecretPlayedFromHandParser implements EventParser {
	constructor(private deckParser: DeckParserService, private allCards: AllCardsService) {}

	applies(gameEvent: GameEvent): boolean {
		if (gameEvent.type !== GameEvent.SECRET_PLAYED) {
			return false;
		}
		const cardId: string = gameEvent.cardId;
		const controllerId: number = gameEvent.controllerId;
		const localPlayer = gameEvent.localPlayer;
		return cardId && controllerId === localPlayer.PlayerId;
	}

	parse(currentState: GameState, gameEvent: GameEvent): GameState {
		if (currentState.playerDeck.deckList.length === 0) {
			return currentState;
		}
		const cardId: string = gameEvent.cardId;
		const entityId: number = gameEvent.entityId;
		const card = DeckManipulationHelper.findCardInZone(currentState.playerDeck.hand, cardId, entityId);
		const newHand: readonly DeckCard[] = DeckManipulationHelper.removeSingleCardFromZone(
			currentState.playerDeck.hand,
			cardId,
			entityId,
		);
		const previousOtherZone = currentState.playerDeck.otherZone;
		const newOtherZone: readonly DeckCard[] = DeckManipulationHelper.addSingleCardToZone(previousOtherZone, card);
		const newPlayerDeck = Object.assign(new DeckState(), currentState.playerDeck, {
			hand: newHand,
			otherZone: newOtherZone,
		});
		return Object.assign(new GameState(), currentState, {
			playerDeck: newPlayerDeck,
		});
	}

	event(): string {
		return DeckEvents.SECRET_PLAYED_FROM_HAND;
	}
}
