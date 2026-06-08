/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { HighlightSide } from '@firestone/shared/framework/core';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { and, inDeck, inHand, or, side, weapon } from '../card-highlight/selectors';
import {
	GeneratingCard,
	GuessInfoInput,
	SelectorCard,
	StaticGeneratingCard,
	StaticGeneratingCardInput,
} from './_card.type';
import { filterCards } from './utils';

/**
 * <b>Battlecry:</b> If you have a weapon equipped, <b>Discover</b> a spell.
 */
export const BloodscalpStrategist: StaticGeneratingCard & GeneratingCard & SelectorCard = {
	cardIds: [CardIds.BloodscalpStrategist],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			BloodscalpStrategist.cardIds[0],
			input.allCards,
			(c) =>
				hasCorrectType(c, CardType.SPELL) &&
				canBeDiscoveredByClass(c, input.inputOptions.deckState.getCurrentClass()),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.SPELL,
			possibleCards: filterCards(
				BloodscalpStrategist.cardIds[0],
				input.allCards,
				(c) =>
					hasCorrectType(c, CardType.SPELL) && canBeDiscoveredByClass(c, input.deckState.getCurrentClass()),
				input.options,
			),
		};
	},
	selector: (input: HighlightSide) => and(side(input), or(inHand, inDeck), weapon),
};
