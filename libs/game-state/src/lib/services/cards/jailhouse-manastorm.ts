/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Jailhouse Manastorm (JAIL_122)
 * Battlecry: After you cast a spell this game, summon a random minion of the same Cost.
 */
import { CardIds } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/framework/core';
import { and, inDeck, inHand, or, side, spell } from '../card-highlight/selectors';
import { Card, SelectorCard } from './_card.type';

export const JailhouseManastorm: Card & SelectorCard = {
	cardIds: [TempCardIds.JailhouseManastorm_JAIL_122 as unknown as CardIds],
	selector: (inputSide) => and(side(inputSide), or(inHand, inDeck), spell),
};
