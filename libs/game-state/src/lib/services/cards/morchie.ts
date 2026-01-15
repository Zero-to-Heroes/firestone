/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, GameTag, hasMechanic } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const Morchie: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Morchie_END_036],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			Morchie.cardIds[0],
			input.allCards,
			(c) => hasMechanic(c, GameTag.REWIND),
			input.options,
		);
		return {
			mechanics: [GameTag.REWIND],
			possibleCards: possibleCards,
		};
	},
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			Morchie.cardIds[0],
			input.allCards,
			(c) => hasMechanic(c, GameTag.REWIND),
			input.inputOptions,
		);
	},
};
