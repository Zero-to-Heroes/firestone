/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, hasSpellSchool, SpellSchool } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput } from './_card.type';
import { filterCards } from './utils';

export const TwilightMender: GeneratingCard = {
	cardIds: [CardIds.TwilightMender_TLC_814],
	hasSequenceInfo: true,
	publicCreator: true,
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
