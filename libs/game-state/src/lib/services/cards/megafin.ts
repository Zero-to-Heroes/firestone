/* eslint-disable no-mixed-spaces-and-tabs */
// Megafin (UNG_942t): 5 Mana 8/8 MURLOC
// "<b>Battlecry:</b> Fill your hand with random Murlocs."

import { CardIds, CardType, Race, hasCorrectTribe, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.MURLOC);

export const Megafin: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.UniteTheMurlocs_MegafinToken],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(Megafin.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(Megafin.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.MINION, races: [Race.MURLOC], possibleCards };
	},
};
