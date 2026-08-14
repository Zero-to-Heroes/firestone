/* eslint-disable no-mixed-spaces-and-tabs */
// Twilight Mender (TLC_814): 3 Mana 3/4
// "Deathrattle: Get a random Holy and Shadow spell."
import { CardIds, CardType, hasSpellSchool, SpellSchool } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectSpellSchool, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const TwilightMender: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.TwilightMender_TLC_814],
	hasSequenceInfo: true,
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			TwilightMender.cardIds[0],
			input.allCards,
			(c) =>
				hasCorrectType(c, CardType.SPELL) &&
				(hasCorrectSpellSchool(c, SpellSchool.SHADOW) || hasCorrectSpellSchool(c, SpellSchool.HOLY)),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		if (input.card.createdIndex === 0) {
			return {
				cardType: CardType.SPELL,
				spellSchools: [SpellSchool.HOLY],
				possibleCards: filterCards(
					TwilightMender.cardIds[0],
					input.allCards,
					(c) => hasCorrectType(c, CardType.SPELL) && hasSpellSchool(c, SpellSchool.HOLY),
					input.options,
				),
			};
		} else if (input.card.createdIndex === 1) {
			return {
				cardType: CardType.SPELL,
				spellSchools: [SpellSchool.SHADOW],
				possibleCards: filterCards(
					TwilightMender.cardIds[0],
					input.allCards,
					(c) => hasCorrectType(c, CardType.SPELL) && hasSpellSchool(c, SpellSchool.SHADOW),
					input.options,
				),
			};
		}
		return null;
	},
};
