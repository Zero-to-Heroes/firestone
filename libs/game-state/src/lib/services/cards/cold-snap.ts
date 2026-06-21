/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Cold Snap (JAIL_125)
 * Freeze an enemy. Get a random Frost spell.
 */
import { CardIds, CardType, hasSpellSchool, SpellSchool } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/framework/core';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const frostSpellFilter = (c: Parameters<typeof hasCorrectType>[0]) =>
	hasCorrectType(c, CardType.SPELL) && hasSpellSchool(c, SpellSchool.FROST);

export const ColdSnap: GeneratingCard & StaticGeneratingCard = {
	cardIds: [TempCardIds.ColdSnap_JAIL_125 as unknown as CardIds],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			TempCardIds.ColdSnap_JAIL_125 as unknown as CardIds,
			input.allCards,
			frostSpellFilter,
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => ({
		cardType: CardType.SPELL,
		spellSchools: [SpellSchool.FROST],
		possibleCards: filterCards(
			TempCardIds.ColdSnap_JAIL_125 as unknown as CardIds,
			input.allCards,
			frostSpellFilter,
			input.options,
		),
	}),
};
