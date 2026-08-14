/* eslint-disable no-mixed-spaces-and-tabs */
import { CardClass, CardIds, CardType, hasCorrectTribe, Race, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCardsFromThePast } from './utils';

const isPastPaladinMech = (c: ReferenceCard) => hasCorrectTribe(c, Race.MECH) && hasCorrectClass(c, CardClass.PALADIN);

export const NeonInnovation: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.NeonInnovation_TIME_016],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCardsFromThePast(NeonInnovation.cardIds[0], input.allCards, isPastPaladinMech, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.MINION,
			races: [Race.MECH],
			possibleCards: filterCardsFromThePast(
				NeonInnovation.cardIds[0],
				input.allCards,
				isPastPaladinMech,
				input.options,
			),
		};
	},
};
