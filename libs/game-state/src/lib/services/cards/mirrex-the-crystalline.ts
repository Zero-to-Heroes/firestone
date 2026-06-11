/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

export const MirrexTheCrystalline: StaticGeneratingCard = {
	cardIds: [CardIds.MirrexTheCrystalline_DINO_407],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const lastMinionPlayedByOpponent = input.inputOptions.opponentDeckState.cardsPlayedThisMatch
			.filter((c) => input.allCards.getCard(c.cardId).type?.toUpperCase() === CardType[CardType.MINION])
			// Pick last
			.slice(-1)
			.map((c) => c.cardId);
		if (!lastMinionPlayedByOpponent.length) {
			return [];
		}
		return [lastMinionPlayedByOpponent[0]];
	},
};
