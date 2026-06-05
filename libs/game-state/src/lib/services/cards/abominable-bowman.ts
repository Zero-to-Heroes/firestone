/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

export const AbominableBowman: StaticGeneratingCard = {
	cardIds: [CardIds.AbominableBowman_ICC_825, CardIds.AbominableBowman_CORE_ICC_825],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		// Get all minions that died this match
		const possibleCards = input.inputOptions.deckState.minionsDeadThisMatch
			.map((e) => e.cardId)
			.filter((cardId) => {
				const card = input.allCards.getCard(cardId);
				return card && hasCorrectTribe(card, Race.BEAST);
			})
			// Remove duplicates
			.filter((value, index, self) => self.indexOf(value) === index);
		return possibleCards;
	},
};
