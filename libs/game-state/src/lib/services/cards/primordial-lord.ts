/* eslint-disable no-mixed-spaces-and-tabs */
// Primordial Lord (CATA_EVENT_000): 6 Mana 7/6 Neutral Elemental Epic
// "Battlecry: Get a random Colossal minion from the past."
// The minion is added to hand (random, not discover), so it needs dynamicPool + guessInfo

import { CardIds, GameTag, hasMechanic } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCardsFromThePast } from './utils';

export const PrimordialLord: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.PrimordialLord_CATA_EVENT_000],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCardsFromThePast(
			PrimordialLord.cardIds[0],
			input.allCards,
			(c) => hasMechanic(c, GameTag.COLOSSAL),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			mechanics: [GameTag.COLOSSAL],
			possibleCards: filterCardsFromThePast(
				PrimordialLord.cardIds[0],
				input.allCards,
				(c) => hasMechanic(c, GameTag.COLOSSAL),
				input.options,
			),
		};
	},
};
