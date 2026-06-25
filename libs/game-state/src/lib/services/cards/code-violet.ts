/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Code Violet (JAIL_735)
 * Prepare. Summon an 8-Cost minion. If you've cast 3 other spells this turn, do it again.
 */
import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';

import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const minionFilter = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 8);

export const CodeViolet: StaticGeneratingCard = {
	cardIds: [CardIds.CodeViolet_JAIL_735],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			CardIds.CodeViolet_JAIL_735,
			input.allCards,
			minionFilter,
			input.inputOptions,
		),
};
