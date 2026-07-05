/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Undeath Sentence (JAIL_940)
 * Trigger the Deathrattle of a random friendly minion that died this game.
 */
import { CardIds, CardType, GameTag, hasMechanic } from '@firestone-hs/reference-data';
import { HighlightSide } from '@firestone/shared/framework/core';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { and, deathrattle, inDeck, inHand, minion, or, side } from '../card-highlight/selectors';
import { Card, SelectorCard, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

export const UndeathSentence: Card & StaticGeneratingCard & SelectorCard = {
	cardIds: [CardIds.UndeathSentence_JAIL_940],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return input.inputOptions.deckState.minionsDeadThisMatch
			.filter((c) => {
				const card = input.allCards.getCard(c.cardId);
				return card && hasMechanic(card, GameTag.DEATHRATTLE) && hasCorrectType(card, CardType.MINION);
			})
			.map((c) => c.cardId);
	},
	selector: (inputSide: HighlightSide) => and(side(inputSide), or(inHand, inDeck), minion, deathrattle),
};
