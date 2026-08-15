/* eslint-disable no-mixed-spaces-and-tabs */
// Merch Seller (ETC_111 / CORE_ETC_111): 4 Mana 3/5 Neutral Naga
// "[x]At the end of your turn, put a random spell on the top of your opponent's deck."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.SPELL);

export const MerchSeller: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.MerchSeller, CardIds.MerchSeller_CORE_ETC_111],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(MerchSeller.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(MerchSeller.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.SPELL, canBeAnyCardClassOrNeutral: true, possibleCards };
	},
};
