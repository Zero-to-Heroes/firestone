/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { getProcessedCard } from '../card-utils';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

export const CaliaMenethil: StaticGeneratingCard = {
	cardIds: [CardIds.CaliaMenethil_CORE_CATA_002],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const deckState = input.inputOptions.deckState;
		return deckState.minionsDeadThisMatch
			.map((e) => getProcessedCard(e.cardId, e.entityId, deckState, input.allCards))
			.filter((c) => hasCorrectType(c, CardType.MINION))
			.map((e) => e.id);
	},
};
