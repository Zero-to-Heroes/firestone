/* eslint-disable no-mixed-spaces-and-tabs */
// Creature of Madness (EDR_105): 2 Mana 1/1
// "<b>Battlecry:</b> <b>Discover</b> a 3-Cost minion with a <b>Dark Gift.</b>"

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 3) && canBeDiscoveredByClass(c, currentClass);

export const CreatureOfMadness: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.CreatureOfMadness_EDR_105],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			CreatureOfMadness.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			CreatureOfMadness.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.MINION, cost: 3, possibleCards };
	},
};
