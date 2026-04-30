/* eslint-disable no-mixed-spaces-and-tabs */
// Violet Haze (BOT_084)
// 2-mana Rogue spell
// Add 2 random Deathrattle cards to your hand.
import { CardIds, GameTag, hasMechanic } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const VioletHaze: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.VioletHaze],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			VioletHaze.cardIds[0],
			input.allCards,
			(c) => hasMechanic(c, GameTag.DEATHRATTLE),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			VioletHaze.cardIds[0],
			input.allCards,
			(c) => hasMechanic(c, GameTag.DEATHRATTLE),
			input.options,
		);
		return {
			canBeAnyCardClassOrNeutral: true,
			possibleCards: possibleCards,
		};
	},
};
