/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCardsFromThePast } from './utils';

const isPastFiveCostMinion = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 5);

export const FadingMemory: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.FadingMemory_TIME_040],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCardsFromThePast(FadingMemory.cardIds[0], input.allCards, isPastFiveCostMinion, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.MINION,
			cost: 5,
			possibleCards: filterCardsFromThePast(
				FadingMemory.cardIds[0],
				input.allCards,
				isPastFiveCostMinion,
				input.options,
			),
		};
	},
};
