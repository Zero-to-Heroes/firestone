/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Undeath Sentence (JAIL_940)
 * Trigger the Deathrattle of a random friendly minion that died this game.
 */
import { CardIds, CardType, GameTag, hasMechanic } from '@firestone-hs/reference-data';

import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { Card, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

export const UndeathSentence: Card & StaticGeneratingCard = {
	cardIds: [CardIds.UndeathSentence_JAIL_940],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return input.inputOptions.deckState.minionsDeadThisMatch
			.filter((c) => {
				const card = input.allCards.getCard(c.cardId);
				return card && hasMechanic(card, GameTag.DEATHRATTLE) && hasCorrectType(card, CardType.MINION);
			})
			.map((c) => c.cardId);
	},
};
