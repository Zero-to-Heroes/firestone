import { GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../models/game-event';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class ParentCardChangedParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper, private readonly allCards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		const newParentEntityId = gameEvent.additionalData.newParentEntityId;

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		const { zone, card } = deck.findCard(newParentEntityId) ?? { zone: null, card: null };
		if (!card) {
			return currentState;
		}

		const updatedCard = card.update({
			storedInformation: {
				...(card.storedInformation || {}),
				cards: [...(card.storedInformation?.cards || []), { cardId, entityId }],
			},
		});
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

		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newDeck,
		});
	}

	event(): string {
		return GameEvent.PARENT_CARD_CHANGED;
	}
}
