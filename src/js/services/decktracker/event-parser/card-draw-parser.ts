import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { DeckEvents } from './deck-events';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class CardDrawParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.CARD_DRAW_FROM_DECK;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		// console.log('drawing from deck', cardId, gameEvent);
		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		const card = this.helper.findCardInZone(deck.deck, cardId, entityId);
		// console.log('found card in zone', card, deck);
		const previousDeck = deck.deck;
		const newDeck: readonly DeckCard[] = this.helper.removeSingleCardFromZone(previousDeck, cardId, entityId)[0];
		const previousHand = deck.hand;
		const newHand: readonly DeckCard[] = this.helper.addSingleCardToZone(
			previousHand,
			isPlayer ? card : this.helper.obfuscateCard(card),
		);
		// console.log('added card to hand', newHand);
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
