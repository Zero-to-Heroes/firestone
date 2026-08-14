/* eslint-disable no-mixed-spaces-and-tabs */
// Wand Thief (SCH_350): 1 Mana 1/2
// "<b>Combo:</b> <b>Discover</b> a Mage spell."

import { CardIds, CardType, CardClass, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCorrectClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.SPELL) && hasCorrectClass(c, CardClass.MAGE);

export const WandThief: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.WandThief_SCH_350],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(WandThief.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(WandThief.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.SPELL, cardClasses: [CardClass.MAGE], possibleCards };
	},
};
