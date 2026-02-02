/* eslint-disable no-mixed-spaces-and-tabs */
import { AllCardsService, CardIds } from '@firestone-hs/reference-data';
import { DeckCard } from '../../models/deck-card';
import { GameState } from '../../models/game-state';
import { GameEvent } from '../game-events/game-event';
import { ActionChainParser, ChainParsingCard } from './_card.type';

export const LadyAzshara: ChainParsingCard = {
	cardIds: [CardIds.LadyAzshara_TIME_211],
	chainParser: (allCards: AllCardsService) => new LadyAzsharaParser(allCards),
};

export class LadyAzsharaParser implements ActionChainParser {
	constructor(private readonly allCards: AllCardsService) {}

	public appliesOnEvent(): GameEvent['type'] {
		return GameEvent.SUB_SPELL_END;
	}

	public async parse(currentState: GameState, events: readonly GameEvent[]): Promise<GameState> {
		const reversedEvents = [...events].reverse();
		const lastEvent = reversedEvents.shift();
		if (lastEvent?.additionalData?.sourceCardId !== CardIds.LadyAzshara_TIME_211) {
			return currentState;
		}

		const isPlayer = lastEvent.controllerId === lastEvent.localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		const newDeck = deck.update({
			deck: updateCards(deck.deck),
			hand: updateCards(deck.hand),
			additionalKnownCardsInDeck: updateCards(deck.additionalKnownCardsInDeck),
			additionalKnownCardsInHand: updateCards(deck.additionalKnownCardsInHand),
		});
		return currentState.update({
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newDeck,
		});
	}
}

const updateCards = <T extends DeckCard | string>(cards: readonly T[]): readonly T[] => {
	return cards.map((c) => {
		if (typeof c === 'string') {
			if (c === CardIds.LadyAzshara_TheWellOfEternityToken_TIME_211t1) {
				return CardIds.TheWellOfEternity_TheWellOfEternityToken_TIME_211t1t;
			} else if (c === CardIds.LadyAzshara_ZinAzshariToken_TIME_211t2) {
				return CardIds.ZinAzshari_ZinAzshariToken_TIME_211t2t;
			}
			return c;
		} else if (c instanceof DeckCard) {
			if (c.cardId === CardIds.LadyAzshara_TheWellOfEternityToken_TIME_211t1) {
				return c.update({
					cardId: CardIds.TheWellOfEternity_TheWellOfEternityToken_TIME_211t1t,
				});
			} else if (c.cardId === CardIds.LadyAzshara_ZinAzshariToken_TIME_211t2) {
				return c.update({
					cardId: CardIds.ZinAzshari_ZinAzshariToken_TIME_211t2t,
				});
			}
			return c;
		}
		return c;
	}) as readonly T[];
};
