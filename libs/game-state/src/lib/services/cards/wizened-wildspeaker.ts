/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { WillBeActiveCard, WillBeActiveInput } from './_card.type';

const playedMinionLastTurn = (input: WillBeActiveInput): boolean =>
	input.playerDeck.cardsPlayedLastTurn.some((c) => {
		const t = input.allCards.getCard(c.cardId)?.type?.toUpperCase();
		return t === CardType[CardType.MINION] || c.cardType?.toUpperCase() === CardType[CardType.MINION];
	});

export const WizenedWildspeaker: WillBeActiveCard = {
	cardIds: [CardIds.WizenedWildspeaker_MEND_041],
	willBeActive: (input: WillBeActiveInput) => !playedMinionLastTurn(input),
};
