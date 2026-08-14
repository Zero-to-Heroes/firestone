/* eslint-disable no-mixed-spaces-and-tabs */
// Demonic Deal (WORK_014): 2 Mana
// "[x]<b>Lifesteal</b>. Deal $4 damage to a minion. Put a random Demon that costs (5) or more on top of your deck."

import { CardIds, CardType, Race, hasCorrectTribe, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) =>
	hasCorrectType(c, CardType.MINION) && hasCost(c, '>=', 5) && hasCorrectTribe(c, Race.DEMON);

export const DemonicDeal: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.DemonicDeal_WORK_014],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(DemonicDeal.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(DemonicDeal.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.MINION, races: [Race.DEMON], possibleCards };
	},
};
