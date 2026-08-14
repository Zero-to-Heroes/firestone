/* eslint-disable no-mixed-spaces-and-tabs */
// Babbling Bookcase (CORE_EDR_001): 3 Mana 2/4
// "<b>Battlecry:</b> Add 2 random Mage spells to your hand."

import { CardIds, CardType, CardClass, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCorrectClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.SPELL) && hasCorrectClass(c, CardClass.MAGE);

export const BabblingBookcase: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.BabblingBookcase_CORE_EDR_001],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(BabblingBookcase.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(BabblingBookcase.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.SPELL, cardClasses: [CardClass.MAGE], possibleCards };
	},
};
