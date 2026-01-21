/* eslint-disable no-mixed-spaces-and-tabs */
// Ivory Knight (KAR_057, WON_045)
// 4-Cost Paladin Minion
// Battlecry: Discover a spell. Restore Health to your hero equal to its Cost.

import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const IvoryKnight: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.IvoryKnight, CardIds.IvoryKnight_WON_045],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const currentClass = input.deckState.getCurrentClass();
		const possibleCards = filterCards(
			IvoryKnight.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.SPELL) && canBeDiscoveredByClass(c, currentClass),
			input.options,
		);
		return {
			cardType: CardType.SPELL,
			possibleCards: possibleCards,
		};
	},
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const currentClass = input.inputOptions.deckState.getCurrentClass();
		return filterCards(
			IvoryKnight.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.SPELL) && canBeDiscoveredByClass(c, currentClass),
			input.inputOptions,
		);
	},
};
