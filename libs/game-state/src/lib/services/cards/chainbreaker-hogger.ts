/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Chainbreaker Hogger (JAIL_384)
 * Taunt. Start of Game: Duplicate all other Legendary cards in your deck.
 */
import { CardIds } from '@firestone-hs/reference-data';
import { and, cardIs, inDeck, legendary, not, side } from '../card-highlight/selectors';
import { TempCardIds } from '@firestone/shared/framework/core';
import { Card, SelectorCard } from './_card.type';

export const ChainbreakerHogger: Card & SelectorCard = {
	cardIds: [TempCardIds.ChainbreakerHogger_JAIL_384 as unknown as CardIds],
	selector: (inputSide) =>
		and(
			side(inputSide),
			inDeck,
			legendary,
			not(cardIs(TempCardIds.ChainbreakerHogger_JAIL_384 as unknown as CardIds)),
		),
};
