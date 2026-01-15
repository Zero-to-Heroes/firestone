/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Bygone Echoes (END_005)
 * Text: Summon a random 4-Cost minion. Spend 4 Corpses to summon another. Outcast: And another.
 * This card summons random 4-cost minions, so it needs a dynamic pool of all 4-cost minions.
 */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { hasCost } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const BygoneEchoes: StaticGeneratingCard = {
	cardIds: [CardIds.BygoneEchoes_END_005],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			BygoneEchoes.cardIds[0],
			input.allCards,
			(c) => c.type?.toUpperCase() === CardType[CardType.MINION] && hasCost(c, '==', 4),
			input.inputOptions,
		);
	},
};
