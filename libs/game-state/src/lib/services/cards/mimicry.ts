/* eslint-disable no-mixed-spaces-and-tabs */
import { AllCardsService, CardIds } from '@firestone-hs/reference-data';
import { GameState } from '../../models/game-state';
import { GameEvent } from '../game-events/game-event';
import { ActionChainParser, ChainParsingCard } from './_card.type';

export const Mimicry: ChainParsingCard = {
	cardIds: [CardIds.Mimicry_EDR_522],
	chainParser: (allCards: AllCardsService) => new MimicryParser(allCards),
};

export class MimicryParser implements ActionChainParser {
	constructor(private readonly allCards: AllCardsService) {}

	public appliesOnEvent(): GameEvent['type'] {
		return GameEvent.CARD_DRAW_FROM_DECK;
	}

	public async parse(currentState: GameState, events: readonly GameEvent[]): Promise<GameState> {
		const reversedEvents = [...events].reverse();
		const lastEvent = reversedEvents.shift();
		if (lastEvent?.additionalData?.drawnByCardId !== CardIds.Mimicry_EDR_522) {
			return currentState;
		}

		const isPlayer = lastEvent.controllerId === lastEvent.localPlayer.PlayerId;
		// Already handled in the logs via card links
		if (!isPlayer) {
			return currentState;
		}

		const maybeReceiveCardInHandEvent = reversedEvents.find((e) => e.type === GameEvent.RECEIVE_CARD_IN_HAND);
		if (maybeReceiveCardInHandEvent?.additionalData?.creatorCardId !== CardIds.Mimicry_EDR_522) {
			return currentState;
		}

		const entityId = maybeReceiveCardInHandEvent.entityId;
		const newHand = currentState.opponentDeck.hand.map((c) =>
			c.entityId === entityId
				? c.update({
						cardId: lastEvent.cardId,
					})
				: c,
		);

		const newDeck = currentState.opponentDeck.update({
			hand: newHand,
		});
		return currentState.update({
			opponentDeck: newDeck,
		});
	}
}
