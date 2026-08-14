/* eslint-disable no-mixed-spaces-and-tabs */
// Unearthed Artifacts (TLC_462): 2 Mana
// "[x]Summon a random 2-Cost minion. If you've <b><b>Discover</b>ed</b> this turn, summon a random 4-Cost minion instead."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';

import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) =>
	hasCorrectType(c, CardType.MINION) && (hasCost(c, '==', 2) || hasCost(c, '==', 4));

export const UnearthedArtifacts: StaticGeneratingCard = {
	cardIds: [CardIds.UnearthedArtifacts_TLC_462],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(UnearthedArtifacts.cardIds[0], input.allCards, isMatch, input.inputOptions),
};
