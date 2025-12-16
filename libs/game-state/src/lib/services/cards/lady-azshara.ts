/* eslint-disable no-mixed-spaces-and-tabs */
import { AllCardsService, CardIds, ReferenceCard } from '@firestone-hs/reference-data';
import { DeckCard } from '../../models/deck-card';
import { GameEvent } from '../../models/game-event';
import { GameState } from '../../models/game-state';
import { ActionChainParser, ChainParsingCard } from './_card.type';

export const LadyAzshara: ChainParsingCard = {
	cardIds: [CardIds.LadyAzshara_TIME_211],
	chainParser: (allCards: AllCardsService) => new LadyAzsharaParser(allCards),
};

class LadyAzsharaParser implements ActionChainParser {
	constructor(private readonly allCards: AllCardsService) {}

	public appliesOnEvent(): GameEvent['type'] {
		return /*GameEvent.SUB_SPELL_END*/ 'SUB_SPELL_END';
	}

	public async parse(currentState: GameState, events: readonly GameEvent[]): Promise<GameState> {
		const reversedEvents = [...events].reverse();
		const lastEvent = reversedEvents.shift();
		if (lastEvent?.additionalData?.sourceCardId !== CardIds.LadyAzshara_TIME_211) {
			return currentState;
		}

		// The other card is in hand
		const maybeCardChangedInHandEvent = reversedEvents.find((e) => e.type === 'CARD_CHANGED_IN_HAND');
		if (maybeCardChangedInHandEvent?.additionalData?.lastAffectedByCardId === CardIds.LadyAzshara_TIME_211) {
			// Do nothing, as the card was already changed in hand
			return currentState;
		}

		// The other card is in the deck
		const maybeCardRemovedFromDeckEvent = reversedEvents.find((e) => e.type === 'CARD_REMOVED_FROM_DECK');
		if (maybeCardRemovedFromDeckEvent?.additionalData?.removedByCardId === CardIds.LadyAzshara_TIME_211) {
			const cardId = maybeCardRemovedFromDeckEvent.cardId;
			const entityId = maybeCardRemovedFromDeckEvent.entityId;
			if (
				![
					CardIds.LadyAzshara_TheWellOfEternityToken_TIME_211t1,
					CardIds.LadyAzshara_ZinAzshariToken_TIME_211t2,
				].includes(cardId as CardIds)
			) {
				return currentState;
			}

			const isPlayer =
				maybeCardRemovedFromDeckEvent.controllerId === maybeCardRemovedFromDeckEvent.localPlayer.PlayerId;
			const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
			const cardIdToEmpower =
				cardId === CardIds.LadyAzshara_TheWellOfEternityToken_TIME_211t1
					? CardIds.LadyAzshara_ZinAzshariToken_TIME_211t2
					: CardIds.LadyAzshara_TheWellOfEternityToken_TIME_211t1;
			const empoweredCardId =
				cardIdToEmpower === CardIds.LadyAzshara_TheWellOfEternityToken_TIME_211t1
					? CardIds.TheWellOfEternity_TheWellOfEternityToken_TIME_211t1t
					: CardIds.ZinAzshari_ZinAzshariToken_TIME_211t2t;
			const refCard = this.allCards.getCard(empoweredCardId);

			const newDeck = replaceInZone(deck.deck, entityId, cardIdToEmpower, refCard);
			const newHand = replaceInZone(deck.hand, entityId, cardIdToEmpower, refCard);
			const newBoard = replaceInZone(deck.board, entityId, cardIdToEmpower, refCard);
			const newPlayerDeck = deck.update({
				deck: newDeck,
				hand: newHand,
				board: newBoard,
			});
			return currentState.update({
				[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
			});
		}

		// TODO: the other card is on the board
		// TODO: the other card is in the other zone
		return currentState;
	}
}

const replaceInZone = (
	zone: readonly DeckCard[],
	entityId: number,
	cardId: string,
	refCard: ReferenceCard,
): readonly DeckCard[] => {
	if (!zone.some((c) => c.cardId === cardId)) {
		return zone;
	}

	if (zone.some((c) => c.entityId === entityId)) {
		return zone.map((c) =>
			c.entityId === entityId
				? c.update({
						cardId: refCard.id,
						cardName: refCard.name,
						refManaCost: refCard.cost,
						rarity: refCard.rarity?.toLowerCase(),
					})
				: c,
		);
	} else {
		return zone.map((c) =>
			c.cardId === cardId
				? c.update({
						cardId: refCard.id,
						cardName: refCard.name,
						refManaCost: refCard.cost,
						rarity: refCard.rarity?.toLowerCase(),
					})
				: c,
		);
	}
};
