/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { getCost, getProcessedCard } from '../card-utils';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

export const CaliaMenethil: StaticGeneratingCard = {
	cardIds: [CardIds.CaliaMenethil_CORE_CATA_002, CardIds.Moonwell_EDR_476],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const deckState = input.inputOptions.deckState;
		const deadCards = deckState.minionsDeadThisMatch.filter((c) => {
			const card = getProcessedCard(c.cardId, c.entityId, deckState, input.allCards);
			return hasCorrectType(card, CardType.MINION);
		});
		if (!deadCards.length) {
			return [];
		}
		const costs = deadCards
			.map((c) => {
				const deckCard = deckState.findCard(c.entityId)?.card;

				if (!deckCard) {
					return null;
				}
				return {
					id: deckCard.transformedInto ?? c.cardId,
					cost: deckCard.transformedInto
						? input.allCards.getCard(deckCard.transformedInto)?.cost
						: getCost(deckCard, deckState, input.allCards as any as CardsFacadeService),
				};
			})
			.filter((c) => c?.cost != null);
		const highestCost = Math.max(...costs.map((c) => c!.cost!));
		const result = costs.filter((c) => c!.cost === highestCost).map((c) => c!.id);
		return result;
	},
};
