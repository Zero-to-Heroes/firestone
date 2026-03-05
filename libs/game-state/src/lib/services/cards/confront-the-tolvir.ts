/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { getCost } from '../card-utils';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

export const ConfrontTheTolvir: StaticGeneratingCard = {
	cardIds: [CardIds.ConfrontTheTolvir_CATA_560],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return input.inputOptions.deckState.cardsPlayedThisMatch
			.filter((c) => {
				const deckCard = input.inputOptions.deckState.findCard(c.entityId)?.card;
				if (!deckCard) {
					return input.allCards.getCard(c.cardId)?.cost === 1;
				}
				return (
					getCost(deckCard, input.inputOptions.deckState, input.allCards as unknown as CardsFacadeService) ===
					1
				);
			})
			.map((c) => c.cardId);
	},
};
