/* eslint-disable no-mixed-spaces-and-tabs */
// Blue Aspect Essence (Dragon Soul, Shattered token) — CATA_EVENT_110t3
// "Draw 3 spells."
// "Cast every adjoining Aspect Essence."
// Random pulls from deck (not Discover); adjoining cascade is combat-log / chain-parser territory.

import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const BlueAspectEssence: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.DragonSoulShattered_BlueAspectEssenceToken_CATA_EVENT_110t3],
	hasSequenceInfo: true,
	publicTutor: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			BlueAspectEssence.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.SPELL),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			BlueAspectEssence.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.SPELL),
			input.options,
		);
		return { cardType: CardType.SPELL, possibleCards };
	},
};
