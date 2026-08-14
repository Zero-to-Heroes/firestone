/* eslint-disable no-mixed-spaces-and-tabs */
// Talanji's Last Stand (CATA_471): 5 Mana DK Spell
// "Give your minions 'Deathrattle: Summon a random 4-Cost minion.'"

import { CardIds, CardType } from '@firestone-hs/reference-data';
import { hasCost, hasCorrectType } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const TalanjisLastStand: StaticGeneratingCard = {
	cardIds: [CardIds.TalanjisLastStand_CATA_471],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			TalanjisLastStand.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 4),
			input.inputOptions,
		);
	},
};
