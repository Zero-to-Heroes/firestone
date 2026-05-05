/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, hasCorrectTribe, Race, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const SeedingDragon: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.SeedingDragon_MEND_045],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			CardIds.SeedingDragon_MEND_045,
			input.allCards,
			(c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.DRAGON),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			CardIds.SeedingDragon_MEND_045,
			input.allCards,
			(c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.DRAGON),
			input.options,
		);
		return { cardType: CardType.MINION, races: [Race.DRAGON], possibleCards };
	},
};
