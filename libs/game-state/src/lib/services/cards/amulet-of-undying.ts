/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, GameTag, hasMechanic } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

export const AmuletOfUndying: StaticGeneratingCard = {
	cardIds: [CardIds.AmuletOfUndying],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		// Get all minions that died this match
		const possibleCards = input.inputOptions.deckState.minionsDeadThisMatch
			.map((e) => e.cardId)
			// Filter for deathrattle minions only
			.filter((cardId) => {
				const card = input.allCards.getCard(cardId);
				return card && hasMechanic(card, GameTag.DEATHRATTLE);
			})
			// Remove duplicates
			.filter((value, index, self) => self.indexOf(value) === index);
		return possibleCards;
	},
};
