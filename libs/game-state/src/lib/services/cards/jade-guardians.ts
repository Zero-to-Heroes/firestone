/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Jade Guardians (JAIL_474)
 * Get two random 8-Cost minions. They cost (1) less for each card you played for 2 Mana this game.
 */
import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/framework/core';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { and, effectiveCostEqual, inDeck, inHand, or, side } from '../card-highlight/selectors';
import {
	GeneratingCard,
	GuessInfoInput,
	SelectorCard,
	StaticGeneratingCard,
	StaticGeneratingCardInput,
} from './_card.type';
import { filterCards } from './utils';

const minionFilter = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 8);

export const JadeGuardians: GeneratingCard & StaticGeneratingCard & SelectorCard = {
	cardIds: [TempCardIds.JadeGuardians_JAIL_474 as unknown as CardIds],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			TempCardIds.JadeGuardians_JAIL_474 as unknown as CardIds,
			input.allCards,
			minionFilter,
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => ({
		cardType: CardType.MINION,
		cost: { cost: 8, comparison: '==' },
		possibleCards: filterCards(
			TempCardIds.JadeGuardians_JAIL_474 as unknown as CardIds,
			input.allCards,
			minionFilter,
			input.options,
		),
	}),
	selector: (inputSide) => and(side(inputSide), or(inHand, inDeck), effectiveCostEqual(2)),
};
