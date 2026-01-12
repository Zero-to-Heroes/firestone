/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

// Timeway Wanderer (TOT_116)
// "<b>Battlecry:</b> <b>Discover</b> a spell. Reduce its cost by (5) then put it on top of your deck."
export const TimewayWanderer: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.TimewayWanderer],
	publicCreator: true,
	publicTutor: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			TimewayWanderer.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.SPELL),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.SPELL,
			canBeDiscoveredBy: TimewayWanderer.cardIds[0],
			possibleCards: filterCards(
				TimewayWanderer.cardIds[0],
				input.allCards,
				(c) => hasCorrectType(c, CardType.SPELL),
				input.options,
			),
		};
	},
};
