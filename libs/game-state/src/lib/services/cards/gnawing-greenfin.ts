/* eslint-disable no-mixed-spaces-and-tabs */
// Gnawing Greenfin (EDR_999): 1 Mana 1/1 MURLOC
// "<b>Battlecry:</b> Get a random Murloc."

import { CardIds, CardType, Race, hasCorrectTribe, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.MURLOC);

export const GnawingGreenfin: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.GnawingGreenfin_EDR_999],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(GnawingGreenfin.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(GnawingGreenfin.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.MINION, races: [Race.MURLOC], possibleCards };
	},
};
