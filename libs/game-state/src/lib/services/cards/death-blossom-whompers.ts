/* eslint-disable no-mixed-spaces-and-tabs */
import { AllCardsService, CardIds } from '@firestone-hs/reference-data';
import { HighlightSide } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { and, deathrattle, inDeck, minion, side } from '../card-highlight/selectors';
import { GameEvent } from '../game-events/game-event';
import { ActionChainParser, ChainParsingCard, GeneratingCard, SelectorCard } from './_card.type';

export const DeathBlossomWhomper: GeneratingCard & ChainParsingCard & SelectorCard = {
	cardIds: [CardIds.DeathBlossomWhomper, CardIds.DeathBlossomWhomper_CORE_REV_310],
	publicTutor: true,
	chainParser: (allCards: AllCardsService) => new DeathBlossomWhomperChainParser(allCards),
	selector: (inputSide: HighlightSide) => and(side(inputSide), inDeck, minion, deathrattle),
};

class DeathBlossomWhomperChainParser implements ActionChainParser {
	appliesOnEvent(): GameEvent['type'] {
		return GameEvent.POWER_TRIGGERED_END;
	}

	constructor(private readonly allCards: AllCardsService) {}

	async parse(currentState: GameState, events: GameEvent[]): Promise<GameState> {
		const reversedEvents = [...events].reverse();
		const lastEvent = reversedEvents.shift();
		if (!DeathBlossomWhomper.cardIds.includes(lastEvent?.cardId as CardIds)) {
			return currentState;
		}

		const [cardId, controllerId, localPlayer, entityId] = lastEvent!.parse();
		const isPlayer = controllerId === localPlayer.PlayerId;
		if (isPlayer) {
			return currentState;
		}

		const cardRevealedEvent = reversedEvents.find(
			(e) => e.type === GameEvent.CARD_REVEALED && e.additionalData?.originEntityEntityId === entityId,
		);
		if (!cardRevealedEvent) {
			return currentState;
		}

		const cardRevealedEntityId = cardRevealedEvent.entityId;
		const entityUpdateEvent = reversedEvents.find(
			(e) =>
				e.type === GameEvent.ENTITY_UPDATE &&
				e.entityId === cardRevealedEntityId &&
				e.additionalData.revealed === true,
		);
		if (!entityUpdateEvent) {
			return currentState;
		}

		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const drawnCard = deck.hand.find((e) => e.lastAffectedByEntityId === entityId);
		if (!drawnCard) {
			return currentState;
		}

		const newCard = drawnCard.update({
			cardId: entityUpdateEvent.cardId,
			cardName: this.allCards.getCard(entityUpdateEvent.cardId)?.name,
			refManaCost: this.allCards.getCard(entityUpdateEvent.cardId)?.cost,
		});
		const newHand = deck.hand.map((e) => (e.entityId === newCard.entityId ? newCard : e));

		const newDeck = deck.update({ hand: newHand });
		return currentState.update({
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newDeck,
		});
	}
}
