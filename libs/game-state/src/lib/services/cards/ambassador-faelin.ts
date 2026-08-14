/* eslint-disable no-mixed-spaces-and-tabs */
// Ambassador Faelin (TSC_067): 4 Mana 4/5
// "<b>Battlecry:</b> Put 3 <b>Colossal</b> minions on the bottom of your deck."

import { CardIds, CardType, GameTag, hasMechanic, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasMechanic(c, GameTag.COLOSSAL);

export const AmbassadorFaelin: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.AmbassadorFaelin_TSC_067],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(AmbassadorFaelin.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(AmbassadorFaelin.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.MINION, mechanics: [GameTag.COLOSSAL], possibleCards };
	},
};
