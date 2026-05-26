/* eslint-disable no-mixed-spaces-and-tabs */
import { AllCardsService, CardIds } from '@firestone-hs/reference-data';
import { GameState } from '../../models/game-state';
import { canBeDiscoveredByClass, hasCost } from '../../related-cards/dynamic-pools';
import { GameEvent } from '../game-events/game-event';
import { ActionChainParser, ChainParsingCard } from './_card.type';
import { filterCards } from './utils';

export const SnakeEyes: ChainParsingCard = {
	cardIds: [CardIds.SnakeEyes_WW_400],
	chainParser: (allCards: AllCardsService) => new SnakeEyesParser(allCards),
};

export class SnakeEyesParser implements ActionChainParser {
	constructor(private readonly allCards: AllCardsService) {}

	public appliesOnEvent(): GameEvent['type'] {
		return GameEvent.RECEIVE_CARD_IN_HAND;
	}

	public async parse(currentState: GameState, events: readonly GameEvent[]): Promise<GameState> {
		const reversedEvents = [...events].reverse();
		const lastEvent = reversedEvents.shift();
		if (lastEvent?.additionalData?.creatorCardId !== CardIds.SnakeEyes_WW_400) {
			return currentState;
		}

		const rolledChoice = reversedEvents.find(
			(e) => e.type === GameEvent.ENTITY_UPDATE && e.cardId.startsWith(CardIds.SnakeEyes_WW_400),
		);
		if (!rolledChoice) {
			return currentState;
		}

		const rolledValue = +rolledChoice.cardId.split(`${CardIds.SnakeEyes_WW_400}t`).pop()!;

		const isPlayer = lastEvent.controllerId === lastEvent.localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const hand = deck.hand;
		const newHand = hand.map((c) =>
			c.entityId !== lastEvent.entityId
				? c
				: c.update({
						guessedInfo: {
							...c.guessedInfo,
							cost: rolledValue,
							possibleCards: filterCards(
								SnakeEyes.cardIds[0],
								this.allCards,
								(c) =>
									hasCost(c, '==', rolledValue) && canBeDiscoveredByClass(c, deck.getCurrentClass()),
							),
						},
					}),
		);

		const newDeck = deck.update({ hand: newHand });
		return currentState.update({
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newDeck,
		});
	}
}
