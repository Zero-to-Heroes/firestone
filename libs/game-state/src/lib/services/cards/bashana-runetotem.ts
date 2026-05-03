/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, ReferenceCard, SpellSchool } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/framework/core';
import {
	hasCorrectSpellSchool,
	hasCorrectType,
	hasCost,
} from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const BashanaRunetotem: StaticGeneratingCard = {
	cardIds: [TempCardIds.DruidMend046BashanaRunetotem as unknown as CardIds],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			TempCardIds.DruidMend046BashanaRunetotem,
			input.allCards,
			(c: ReferenceCard) =>
				hasCorrectType(c, CardType.SPELL) &&
				hasCorrectSpellSchool(c, SpellSchool.NATURE) &&
				(c.cost ?? 0) < 12,
			input.inputOptions,
		),
};
