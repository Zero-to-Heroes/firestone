/* eslint-disable no-mixed-spaces-and-tabs */
// Winterspring Whelp (CATA_484): Battlecry: Add a random Frost spell to your hand.
// Hive Map (TLC_900): Discover a Fel spell. If you play it this turn, also pick one of the others.

import { CardClass, CardIds, CardType, SpellSchool } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass, hasCorrectSpellSchool } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const HiveMap: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.HiveMap_TLC_900],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			HiveMap.cardIds[0],
			input.allCards,
			(c) => canBeDiscoveredByClass(c, input.inputOptions.currentClass) && hasCorrectSpellSchool(c, SpellSchool.FEL),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const currentClass = input.deckState.hero?.classes?.[0] ? CardClass[input.deckState.hero?.classes?.[0]] : '';
		const possibleCards = filterCards(
			HiveMap.cardIds[0],
			input.allCards,
			(c) => canBeDiscoveredByClass(c, currentClass) && hasCorrectSpellSchool(c, SpellSchool.FEL),
			input.options,
		);
		return {
			cardType: CardType.SPELL,
			possibleCards: possibleCards,
		};
	},
};
