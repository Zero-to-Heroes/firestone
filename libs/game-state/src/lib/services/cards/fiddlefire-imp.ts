/* eslint-disable no-mixed-spaces-and-tabs */
import { CardClass, CardIds, CardType, hasSpellSchool, SpellSchool } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput } from './_card.type';
import { filterCards } from './utils';

export const FiddlefireImp: GeneratingCard = {
	cardIds: [CardIds.FiddlefireImp],
	hasSequenceInfo: true,
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		if (input.card.createdIndex === 0) {
			return {
				cardType: CardType.SPELL,
				spellSchools: [SpellSchool.FIRE],
				cardClasses: [CardClass.MAGE],
				possibleCards: filterCards(
					FiddlefireImp.cardIds[0],
					input.allCards,
					(c) =>
						hasCorrectType(c, CardType.SPELL) &&
						hasSpellSchool(c, SpellSchool.FIRE) &&
						hasCorrectClass(c, CardClass.MAGE),
					input.options,
				),
			};
		} else if (input.card.createdIndex === 1) {
			return {
				cardType: CardType.SPELL,
				spellSchools: [SpellSchool.FIRE],
				cardClasses: [CardClass.WARLOCK],
				possibleCards: filterCards(
					FiddlefireImp.cardIds[0],
					input.allCards,
					(c) =>
						hasCorrectType(c, CardType.SPELL) &&
						hasSpellSchool(c, SpellSchool.FIRE) &&
						hasCorrectClass(c, CardClass.WARLOCK),
					input.options,
				),
			};
		}
		return null;
	},
};
