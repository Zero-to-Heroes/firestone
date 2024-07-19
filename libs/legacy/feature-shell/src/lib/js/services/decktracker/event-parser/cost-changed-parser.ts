import { GameState } from '@firestone/game-state';
import { GameEvent } from '../../../models/game-event';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class CostChangedParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		const newCost = gameEvent.additionalData.cost;

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		const { zone, card } = deck.findCard(entityId) ?? { zone: null, card: null };
		if (!card) {
			return currentState;
		}

		const updatedCard = card.update({
			actualManaCost: newCost,
		});
		// console.debug('found card', zone, card, deck, updatedCard);
		let newDeck = deck;
		switch (zone) {
			case 'board':
				const newBoard = this.helper.replaceCardInZone(deck.board, updatedCard);
				newDeck = deck.update({ board: newBoard });
				break;
			case 'hand':
				const newHand = this.helper.replaceCardInZone(deck.hand, updatedCard);
				newDeck = deck.update({ hand: newHand });
				break;
			case 'deck':
				const newDeckZone = this.helper.replaceCardInZone(deck.deck, updatedCard);
				newDeck = deck.update({ deck: newDeckZone });
				break;
			case 'other':
				const newOther = this.helper.replaceCardInZone(deck.otherZone, updatedCard);
				newDeck = deck.update({ otherZone: newOther });
				break;
		}
		// console.debug('updated cost', newDeck, deck, gameEvent);

		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newDeck,
		});
	}

	event(): string {
		return GameEvent.COST_CHANGED;
	}
}
