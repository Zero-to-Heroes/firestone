/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, ReferenceCard, SpellSchool } from '@firestone-hs/reference-data';
import { hasCorrectSpellSchool, hasCorrectType } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const BashanaRunetotem: StaticGeneratingCard = {
	cardIds: [CardIds.BashanaRunetotem_MEND_046],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			CardIds.BashanaRunetotem_MEND_046,
			input.allCards,
			(c: ReferenceCard) =>
				hasCorrectType(c, CardType.SPELL) && hasCorrectSpellSchool(c, SpellSchool.NATURE) && (c.cost ?? 0) < 12,
			input.inputOptions,
		),
};
