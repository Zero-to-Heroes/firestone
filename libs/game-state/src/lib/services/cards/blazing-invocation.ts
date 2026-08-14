/* eslint-disable no-mixed-spaces-and-tabs */
// Blazing Invocation (CORE_GIL_836): 1 Mana
// "[x]<b>Discover</b> a <b>Battlecry</b> minion."

import { CardIds, CardType, GameTag, hasMechanic, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.MINION) && hasMechanic(c, GameTag.BATTLECRY) && canBeDiscoveredByClass(c, currentClass);

export const BlazingInvocation: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.BlazingInvocation_CORE_GIL_836],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			BlazingInvocation.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			BlazingInvocation.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.MINION, mechanics: [GameTag.BATTLECRY], possibleCards };
	},
};
