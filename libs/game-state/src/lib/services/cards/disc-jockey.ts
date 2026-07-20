/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, GameTag, hasMechanic } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const DiscJockey: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.DiscJockey],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			DiscJockey.cardIds[0],
			input.allCards,
			(c) => hasMechanic(c, GameTag.COMBO),
			input.options,
		);
		return {
			mechanics: [GameTag.COMBO],
			canBeAnyCardClass: true,
			possibleCards: possibleCards,
		};
	},
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			DiscJockey.cardIds[0],
			input.allCards,
			(c) => hasMechanic(c, GameTag.COMBO),
			input.inputOptions,
		);
	},
};
