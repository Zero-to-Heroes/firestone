/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Cabalist's Tome
 * 4 Mana Mage Spell
 * Get 3 random Mage spells.
 */
import { CardClass, CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const CabalistsTome: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.CabalistsTome, CardIds.CabalistsTome_WON_037],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			CabalistsTome.cardIds[0],
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
				CabalistsTome.cardIds[0],
				input.allCards,
				(c) => hasCorrectType(c, CardType.SPELL) && hasCorrectClass(c, CardClass.MAGE),
				input.options,
			),
		};
	},
};
