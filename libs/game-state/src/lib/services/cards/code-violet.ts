/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Code Violet (JAIL_735)
 * Prepare. Summon an 8-Cost minion. If you've cast 3 other spells this turn, do it again.
 */
import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/framework/core';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const minionFilter = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 8);

export const CodeViolet: StaticGeneratingCard = {
	cardIds: [TempCardIds.CodeViolet_JAIL_735 as unknown as CardIds],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			TempCardIds.CodeViolet_JAIL_735 as unknown as CardIds,
			input.allCards,
			minionFilter,
			input.inputOptions,
		),
};
