/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, GameTag, hasMechanic } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/common/service';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const Morchie: GeneratingCard & StaticGeneratingCard = {
	cardIds: [TempCardIds.Morchie as unknown as CardIds],
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
