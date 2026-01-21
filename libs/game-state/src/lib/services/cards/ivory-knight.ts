/* eslint-disable no-mixed-spaces-and-tabs */
// Ivory Knight (KAR_057, WON_045)
// 4-Cost Paladin Minion
// Battlecry: Discover a spell. Restore Health to your hero equal to its Cost.

import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const IvoryKnight: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.IvoryKnight, CardIds.IvoryKnight_WON_045],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			IvoryKnight.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.SPELL),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.SPELL,
			possibleCards: filterCards(
				IvoryKnight.cardIds[0],
				input.allCards,
				(c) => hasCorrectType(c, CardType.SPELL),
				input.options,
			),
		};
	},
};
