/* eslint-disable no-mixed-spaces-and-tabs */
// Babbling Book (KAR_009 / CORE_KAR_009): 1 Mana 1/2
// "<b>Battlecry:</b> Add a random Mage spell to your hand."

import { CardIds, CardType, CardClass, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCorrectClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.SPELL) && hasCorrectClass(c, CardClass.MAGE);

export const BabblingBook: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.BabblingBook, CardIds.BabblingBookCore],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(BabblingBook.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(BabblingBook.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.SPELL, cardClasses: [CardClass.MAGE], possibleCards };
	},
};
