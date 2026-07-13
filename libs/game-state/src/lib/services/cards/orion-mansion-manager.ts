/* eslint-disable no-mixed-spaces-and-tabs */
import { CardClass, CardIds, GameTag, hasMechanic } from '@firestone-hs/reference-data';
import { HighlightSide } from '@firestone/shared/framework/core';
import { hasCorrectClass } from '../../related-cards/dynamic-pools';
import { and, inDeck, inHand, or, secret, side, spell } from '../card-highlight/selectors';
import { SelectorCard, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const OrionMansionManager: StaticGeneratingCard & SelectorCard = {
	cardIds: [CardIds.OrionMansionManager_CORE_REV_515],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			OrionMansionManager.cardIds[0],
			input.allCards,
			(c) => hasMechanic(c, GameTag.SECRET) && hasCorrectClass(c, CardClass.MAGE),
			input.inputOptions,
		);
	},
	selector: (inputSide: HighlightSide) => and(side(inputSide), or(inHand, inDeck), spell, secret),
};
