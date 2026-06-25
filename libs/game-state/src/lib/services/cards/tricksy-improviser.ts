/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Tricksy Improviser (JAIL_321)
 * Prepare. Battlecry: If you cast a spell this turn, cast a random Mage Secret.
 */
import { CardClass, CardIds, CardType, GameTag, hasMechanic } from '@firestone-hs/reference-data';

import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { and, inDeck, inHand, or, side, spell } from '../card-highlight/selectors';
import {
	GeneratingCard,
	GuessInfoInput,
	SelectorCard,
	StaticGeneratingCard,
	StaticGeneratingCardInput,
} from './_card.type';
import { filterCards } from './utils';

const mageSecretFilter = (c: Parameters<typeof hasCorrectType>[0]) =>
	hasCorrectType(c, CardType.SPELL) && hasMechanic(c, GameTag.SECRET) && hasCorrectClass(c, CardClass.MAGE);

export const TricksyImproviser: GeneratingCard & StaticGeneratingCard & SelectorCard = {
	cardIds: [CardIds.TricksyImproviser_JAIL_321],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			CardIds.TricksyImproviser_JAIL_321,
			input.allCards,
			mageSecretFilter,
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => ({
		cardType: CardType.SPELL,
		mechanics: [GameTag.SECRET],
		cardClasses: [CardClass.MAGE],
		possibleCards: filterCards(
			CardIds.TricksyImproviser_JAIL_321,
			input.allCards,
			mageSecretFilter,
			input.options,
		),
	}),
	selector: (inputSide) => and(side(inputSide), or(inHand, inDeck), spell),
};
