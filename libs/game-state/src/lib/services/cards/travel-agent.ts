/* eslint-disable no-mixed-spaces-and-tabs */
// Travel Agent (VAC_438): 2 Mana 2/2 PIRATE
// "<b>Battlecry: Discover</b> a location from any class."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';

import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => c?.type?.toUpperCase() === CardType[CardType.LOCATION];

export const TravelAgent: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.TravelAgent_VAC_438],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(TravelAgent.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(TravelAgent.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.LOCATION, possibleCards };
	},
};
