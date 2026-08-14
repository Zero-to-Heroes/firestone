/* eslint-disable no-mixed-spaces-and-tabs */
// Hidden Meaning (JAM_003): 2 Mana
// "<b>Secret:</b> When your opponent ends their turn with no Mana, summon a random 3-Cost minion."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';

import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 3);

export const HiddenMeaning: StaticGeneratingCard = {
	cardIds: [CardIds.HiddenMeaning],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(HiddenMeaning.cardIds[0], input.allCards, isMatch, input.inputOptions),
};
