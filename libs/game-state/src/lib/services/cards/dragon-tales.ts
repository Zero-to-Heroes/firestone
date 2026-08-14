/* eslint-disable no-mixed-spaces-and-tabs */
// Dragon Tales (WW_821): 2 Mana
// "<b>Choose One -</b> Get two random Dragons that cost (5) or less; or Get two that cost more than (5)."

import { CardIds, CardType, Race, hasCorrectTribe, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.DRAGON);

export const DragonTales: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.DragonTales_WW_821],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(DragonTales.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(DragonTales.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.MINION, races: [Race.DRAGON], possibleCards };
	},
};
