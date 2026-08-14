/* eslint-disable no-mixed-spaces-and-tabs */
// Wandmaker (SCH_160 / CORE_SCH_160): 2 Mana 2/2
// "<b>Battlecry:</b> Add a 1-Cost spell from your class to your hand."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.SPELL) &&
	hasCost(c, '==', 1) &&
	!!currentClass &&
	c.classes?.includes(currentClass.toUpperCase());

export const Wandmaker: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Wandmaker, CardIds.Wandmaker_CORE_SCH_160],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			Wandmaker.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			Wandmaker.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.SPELL, cost: 1, possibleCards };
	},
};
