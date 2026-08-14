/* eslint-disable no-mixed-spaces-and-tabs */
// I Know a Guy (CORE_WON_350 / WON_350): 1 Mana
// "<b>Discover</b> a <b>Taunt</b> minion. Give it +1/+2."

import { CardIds, CardType, GameTag, hasMechanic, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.MINION) && hasMechanic(c, GameTag.TAUNT) && canBeDiscoveredByClass(c, currentClass);

export const IKnowAGuy: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.IKnowAGuy_CORE_WON_350, CardIds.IKnowAGuy_WON_350],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			IKnowAGuy.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			IKnowAGuy.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.MINION, mechanics: [GameTag.TAUNT], possibleCards };
	},
};
