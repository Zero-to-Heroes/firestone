/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Captive Nathrezim (JAIL_890)
 * Prepare, Taunt. ALL minions cost (2) more.
 */
import { CardIds } from '@firestone-hs/reference-data';

import { and, inDeck, inHand, minion, or, side } from '../card-highlight/selectors';
import { Card, SelectorCard } from './_card.type';

export const CaptiveNathrezim: Card & SelectorCard = {
	cardIds: [CardIds.CaptiveNathrezim_JAIL_890],
	selector: (inputSide) => and(side(inputSide), or(inDeck, inHand), minion),
};
