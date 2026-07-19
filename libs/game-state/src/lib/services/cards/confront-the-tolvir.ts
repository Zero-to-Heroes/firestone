/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds } from '@firestone-hs/reference-data';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

export const ConfrontTheTolvir: StaticGeneratingCard = {
	cardIds: [CardIds.ConfrontTheTolvir_CATA_560],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return input.inputOptions.deckState.cardsPlayedThisMatch
			.filter((c) => input.allCards.getCard(c.cardId)?.cost === 1)
			.map((c) => c.cardId);
	},
};
