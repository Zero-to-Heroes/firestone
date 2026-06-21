/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Trastath Soul Parasite (JAIL_721)
 * Prepare, Rush. After you summon a Demon, gain its stats.
 */
import { CardIds } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/framework/core';
import { and, demon, inDeck, inHand, or, side, summonsDemon } from '../card-highlight/selectors';
import { Card, SelectorCard } from './_card.type';

export const TrastathSoulParasite: Card & SelectorCard = {
	cardIds: [TempCardIds.TrastathSoulParasite_JAIL_721 as unknown as CardIds],
	selector: (inputSide) => and(side(inputSide), or(inHand, inDeck), or(demon, summonsDemon)),
};
