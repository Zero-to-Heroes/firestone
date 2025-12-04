/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, GameTag, hasMechanic } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const MuseumCurator: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.MuseumCurator, CardIds.MuseumCurator_WON_056],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			MuseumCurator.cardIds[0],
			input.allCards,
			(c) => hasMechanic(c, GameTag.DEATHRATTLE),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			mechanics: [GameTag.DEATHRATTLE],
			possibleCards: filterCards(
				MuseumCurator.cardIds[0],
				input.allCards,
				(c) => hasMechanic(c, GameTag.DEATHRATTLE),
				input.options,
			),
		};
	},
};
