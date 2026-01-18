/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Lock and Load
 * 0 Mana Hunter Spell
 * Text: "Each time you cast a spell this turn, get a random Hunter card."
 * Generates random Hunter cards (any type) when spells are cast this turn.
 */
import { CardClass, CardIds } from '@firestone-hs/reference-data';
import { hasCorrectClass } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const LockAndLoad: StaticGeneratingCard = {
	cardIds: [CardIds.LockAndLoad_AT_061, CardIds.LockAndLoad_CORE_AT_061, CardIds.LockAndLoad_WON_023],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			LockAndLoad.cardIds[0],
			input.allCards,
			(c) => hasCorrectClass(c, CardClass.HUNTER),
			input.inputOptions,
		);
	},
};
