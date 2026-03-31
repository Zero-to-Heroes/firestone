/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { pickLast } from '@firestone/shared/framework/common';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { getProcessedCard } from '../card-utils';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

export const CaliaMenethil: StaticGeneratingCard = {
	cardIds: [CardIds.CaliaMenethil_CORE_CATA_002],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const deckState = input.inputOptions.deckState;
		const deadCards = deckState.minionsDeadThisMatch
			.map((e) => getProcessedCard(e.cardId, e.entityId, deckState, input.allCards))
			.filter((c) => hasCorrectType(c, CardType.MINION) && c.cost != null);
		const highestCost = pickLast(deadCards.sort((a, b) => (a.cost ?? 0) - (b.cost ?? 0)))?.cost;
		if (highestCost == null) {
			return [];
		}
		return deadCards.filter((c) => c.cost === highestCost).map((e) => e.id);
	},
};
