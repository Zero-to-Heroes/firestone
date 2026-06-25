/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Spire Security (JAIL_379)
 * Battlecry: Reveal a spell in your deck. If it costs (5) or more, deal 5 damage split among enemy minions.
 */
import { CardIds } from '@firestone-hs/reference-data';
import { and, effectiveCostMore, inDeck, side, spell } from '../card-highlight/selectors';

import { Card, SelectorCard } from './_card.type';

export const SpireSecurity: Card & SelectorCard = {
	cardIds: [CardIds.SpireSecurity_JAIL_379],
	selector: (inputSide) => and(side(inputSide), inDeck, spell, effectiveCostMore(4)),
};
