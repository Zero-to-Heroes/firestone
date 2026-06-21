/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Moragg (JAIL_906)
 * Prepare. Deathrattle: Summon a random Demon from your deck. Give it "Deathrattle: Summon Moragg."
 */
import { CardIds } from '@firestone-hs/reference-data';
import { and, demon, inDeck, minion, side } from '../card-highlight/selectors';
import { SelectorCard } from './_card.type';

export const Moragg: SelectorCard = {
	cardIds: [CardIds.Moragg_JAIL_906],
	selector: (inputSide) => and(side(inputSide), inDeck, demon, minion),
};
