import { GameState } from '@firestone/game-state';
import { GameEvent } from '../../../models/game-event';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class CardForgedParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		if (!entityId) {
			return currentState;
		}

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		const card = this.helper.findCardInZone(deck.hand, cardId, entityId);
		if (!card) {
			console.warn('[card-forged-parser] could not find card in hand', cardId, entityId, deck.hand?.length);
			return currentState;
		}

		const newCard = card.update({
			forged: card.forged + 1,
		});
		const newHand = deck.hand.map((c) => (c.entityId === entityId ? newCard : c));
		const newDeck = deck.update({
			hand: newHand,
		});
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newDeck,
		});
	}

	event(): string {
		return GameEvent.CARD_FORGED;
	}
}
