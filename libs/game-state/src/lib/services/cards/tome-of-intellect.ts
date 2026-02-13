/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Tome of Intellect
 * 1 Mana Mage Spell
 * Add a random Mage spell to your hand.
 */
import { CardClass, CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const TomeOfIntellect: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.TomeOfIntellectLegacy],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			TomeOfIntellect.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.SPELL) && hasCorrectClass(c, CardClass.MAGE),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.SPELL,
			cardClasses: [CardClass.MAGE],
			possibleCards: filterCards(
				TomeOfIntellect.cardIds[0],
				input.allCards,
				(c) => hasCorrectType(c, CardType.SPELL) && hasCorrectClass(c, CardClass.MAGE),
				input.options,
			),
		};
	},
};
