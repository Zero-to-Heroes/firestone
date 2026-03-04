/* eslint-disable no-mixed-spaces-and-tabs */
// Death's Advance (CORE_CATA_009): 2 Mana DK Spell
// "Freeze a character. Discover a spell."

import { CardClass, CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const DeathsAdvance: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.DeathsAdvance_CORE_CATA_009],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			DeathsAdvance.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.SPELL) && canBeDiscoveredByClass(c, input.inputOptions.currentClass),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const currentClass = input.deckState.hero?.classes?.[0] ? CardClass[input.deckState.hero?.classes?.[0]] : '';
		const possibleCards = filterCards(
			DeathsAdvance.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.SPELL) && canBeDiscoveredByClass(c, currentClass),
			input.options,
		);
		return {
			cardType: CardType.SPELL,
			possibleCards: possibleCards,
		};
	},
};
