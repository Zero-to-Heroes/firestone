/* eslint-disable no-mixed-spaces-and-tabs */
// Shimmering Tempest (UNG_846): 2 Mana 2/2 ELEMENTAL
// "<b>Battlecry:</b> Add a random Mage spell to your hand."

import { CardIds, CardType, CardClass, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCorrectClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.SPELL) && hasCorrectClass(c, CardClass.MAGE);

export const ShimmeringTempest: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.ShimmeringTempest],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(ShimmeringTempest.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(ShimmeringTempest.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.SPELL, cardClasses: [CardClass.MAGE], possibleCards };
	},
};
