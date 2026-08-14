/* eslint-disable no-mixed-spaces-and-tabs */
// Webspinner (FP1_011 / CORE_FP1_011): 1 Mana 1/1 Beast
// "Deathrattle: Get a random Beast."

import { CardIds, CardType, hasCorrectTribe, Race, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isRandomBeast = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.BEAST);

export const Webspinner: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Webspinner_FP1_011, CardIds.Webspinner_CORE_FP1_011],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(Webspinner.cardIds[0], input.allCards, isRandomBeast, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(Webspinner.cardIds[0], input.allCards, isRandomBeast, input.options);
		return { cardType: CardType.MINION, races: [Race.BEAST], possibleCards };
	},
};
