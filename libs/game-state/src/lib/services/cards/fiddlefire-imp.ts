/* eslint-disable no-mixed-spaces-and-tabs */
// Fiddlefire Imp (JAM_032): 3 Mana 3/3 Demon
// "Battlecry: Add a random Fire Mage and Fire Warlock spell to your hand."
import { CardClass, CardIds, CardType, hasSpellSchool, SpellSchool } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectClass, hasCorrectSpellSchool, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const FiddlefireImp: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.FiddlefireImp],
	hasSequenceInfo: true,
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			FiddlefireImp.cardIds[0],
			input.allCards,
			(c) =>
				hasCorrectType(c, CardType.SPELL) &&
				hasCorrectSpellSchool(c, SpellSchool.FIRE) &&
				(hasCorrectClass(c, CardClass.MAGE) || hasCorrectClass(c, CardClass.WARLOCK)),
			input.inputOptions,
		),
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
