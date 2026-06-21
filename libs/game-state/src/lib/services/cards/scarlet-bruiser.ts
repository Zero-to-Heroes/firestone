/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Scarlet Bruiser (JAIL_328)
 * Deathrattle: If your deck has no Neutral cards, get a random Paladin card. It costs (2) less.
 */
import { CardClass, CardIds } from '@firestone-hs/reference-data';
import { and, inDeck, neutral, side } from '../card-highlight/selectors';
import { TempCardIds } from '@firestone/shared/framework/core';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectClass } from '../../related-cards/dynamic-pools';
import {
	GeneratingCard,
	GuessInfoInput,
	SelectorCard,
	StaticGeneratingCard,
	StaticGeneratingCardInput,
} from './_card.type';
import { filterCards } from './utils';

const paladinCardFilter = (c: Parameters<typeof hasCorrectClass>[0]) => hasCorrectClass(c, CardClass.PALADIN);

export const ScarletBruiser: GeneratingCard & StaticGeneratingCard & SelectorCard = {
	cardIds: [TempCardIds.ScarletBruiser_JAIL_328 as unknown as CardIds],
	publicCreator: true,
	selector: (inputSide) => and(side(inputSide), inDeck, neutral),
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			TempCardIds.ScarletBruiser_JAIL_328 as unknown as CardIds,
			input.allCards,
			paladinCardFilter,
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => ({
		cardClasses: [CardClass.PALADIN],
		possibleCards: filterCards(
			TempCardIds.ScarletBruiser_JAIL_328 as unknown as CardIds,
			input.allCards,
			paladinCardFilter,
			input.options,
		),
	}),
};
