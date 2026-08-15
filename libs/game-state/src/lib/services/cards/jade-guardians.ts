/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Jade Guardians (JAIL_474)
 * Get two random 8-Cost minions. They cost (1) less for each card you played for 2 Mana this game.
 */
import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';

import { GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
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

export const countTwoManaCardsPlayedThisMatch = (deckState: DeckState | undefined): number =>
	deckState?.cardsPlayedThisMatch?.filter((c) => c.effectiveCost === 2 && !c.paidWithAlternateCost)?.length ?? 0;

export const JadeGuardians: GeneratingCard & StaticGeneratingCard & SelectorCard = {
	cardIds: [CardIds.JadeGuardians_JAIL_474],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(CardIds.JadeGuardians_JAIL_474, input.allCards, minionFilter, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const discount = Math.min(countTwoManaCardsPlayedThisMatch(input.deckState), 8);
		return {
			cardType: CardType.MINION,
			cost: { cost: 8, comparison: '==' },
			costModifier: discount > 0 ? -discount : null,
			possibleCards: filterCards(CardIds.JadeGuardians_JAIL_474, input.allCards, minionFilter, input.options),
		};
	},
	selector: (inputSide) => and(side(inputSide), or(inHand, inDeck), effectiveCostEqual(2)),
};
