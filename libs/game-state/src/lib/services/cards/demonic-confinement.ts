/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Demonic Confinement (JAIL_997)
 * Make a minion go Dormant for 2 turns. If it's a friendly Demon, give it +3/+3 instead.
 */
import { CardIds } from '@firestone-hs/reference-data';
import { and, inDeck, inHand, inPlay, minion, or, side } from '../card-highlight/selectors';

import { Card, SelectorCard } from './_card.type';

export const DemonicConfinement: Card & SelectorCard = {
	cardIds: [CardIds.DemonicConfinement_JAIL_997],
	selector: (inputSide) => and(side(inputSide), or(inHand, inDeck, inPlay), minion),
};
