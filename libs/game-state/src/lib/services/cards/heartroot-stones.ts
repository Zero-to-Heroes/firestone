/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/framework/core';
import { WillBeActiveCard, WillBeActiveInput } from './_card.type';

const playedMinionLastTurn = (input: WillBeActiveInput): boolean =>
	input.playerDeck.cardsPlayedLastTurn.some((c) => {
		const t = input.allCards.getCard(c.cardId)?.type?.toUpperCase();
		return t === CardType[CardType.MINION] || c.cardType?.toUpperCase() === CardType[CardType.MINION];
	});

export const HeartrootStones: WillBeActiveCard = {
	cardIds: [TempCardIds.DruidMend043HeartrootStones as unknown as CardIds],
	willBeActive: (input: WillBeActiveInput) => !playedMinionLastTurn(input),
};
