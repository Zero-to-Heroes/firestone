/* eslint-disable no-mixed-spaces-and-tabs */
// Jeweled Macaw (UNG_912 / CORE_UNG_912): 1 Mana 1/2 BEAST
// "<b>Battlecry:</b> Add a random Beast to your hand."

import { CardIds, CardType, Race, hasCorrectTribe, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.BEAST);

export const JeweledMacaw: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.JeweledMacaw, CardIds.JeweledMacawCore],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(JeweledMacaw.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(JeweledMacaw.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.MINION, races: [Race.BEAST], possibleCards };
	},
};
