/* eslint-disable no-mixed-spaces-and-tabs */
// Spearheart Sentry (CATA_474): 4 Mana 3/4 Dragon Paladin
// "At end of turn, get a random Holy Spell. Reduce its Cost by (3)."

import { CardClass, CardIds, CardType, hasSpellSchool, SpellSchool } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const SpearheartSentry: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.SpearheartSentry_CATA_474],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			SpearheartSentry.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.SPELL) && hasSpellSchool(c, SpellSchool.HOLY),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const currentClass = input.deckState.hero?.classes?.[0] ? CardClass[input.deckState.hero?.classes?.[0]] : '';
		const possibleCards = filterCards(
			SpearheartSentry.cardIds[0],
			input.allCards,
			(c) =>
				hasCorrectType(c, CardType.SPELL) &&
				hasSpellSchool(c, SpellSchool.HOLY) &&
				canBeDiscoveredByClass(c, currentClass),
			input.options,
		);
		return {
			cardType: CardType.SPELL,
			possibleCards: possibleCards,
		};
	},
};
