/* eslint-disable no-mixed-spaces-and-tabs */
// Winterspring Whelp (CATA_484): Battlecry: Add a random Frost spell to your hand.
// Hive Map (TLC_900): Discover a Fel spell. If you play it this turn, also pick one of the others.

import { CardClass, CardIds, CardType, SpellSchool } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass, hasCorrectSpellSchool } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const HiveMap: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.HiveMap_TLC_900, CardIds.HiveMap_HiveMapEnchantment_TLC_900e],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		let result = filterCards(
			HiveMap.cardIds[0],
			input.allCards,
			(c) =>
				canBeDiscoveredByClass(c, input.inputOptions.currentClass) && hasCorrectSpellSchool(c, SpellSchool.FEL),
			input.inputOptions,
		);
		if (result.length === 0) {
			result = filterCards(
				HiveMap.cardIds[0],
				input.allCards,
				(c) =>
					canBeDiscoveredByClass(c, input.allCards.getCard(HiveMap.cardIds[0])?.classes?.[0]!) &&
					hasCorrectSpellSchool(c, SpellSchool.FEL),
				input.inputOptions,
			);
		}
		return result;
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const currentClass = input.deckState.hero?.classes?.[0] ? CardClass[input.deckState.hero?.classes?.[0]] : '';
		let possibleCards = filterCards(
			HiveMap.cardIds[0],
			input.allCards,
			(c) => canBeDiscoveredByClass(c, currentClass) && hasCorrectSpellSchool(c, SpellSchool.FEL),
			input.options,
		);
		if (possibleCards.length === 0) {
			possibleCards = filterCards(
				HiveMap.cardIds[0],
				input.allCards,
				(c) =>
					canBeDiscoveredByClass(c, input.allCards.getCard(HiveMap.cardIds[0])?.classes?.[0]) &&
					hasCorrectSpellSchool(c, SpellSchool.FEL),
				input.options,
			);
		}
		return {
			cardType: CardType.SPELL,
			possibleCards: possibleCards,
		};
	},
};
