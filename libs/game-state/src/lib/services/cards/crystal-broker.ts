/* eslint-disable no-mixed-spaces-and-tabs */
// Crystal Broker (RLK_221): 3 Mana 3/2
// "Manathirst (5): Summon a random 3-Cost minion. Manathirst (10): Summon an 8-Cost minion instead."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const CrystalBroker: StaticGeneratingCard = {
	cardIds: [CardIds.CrystalBroker],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const cost = (input.inputOptions.deckState?.hero?.maxMana ?? 0) >= 10 ? 8 : 3;
		return filterCards(
			CrystalBroker.cardIds[0],
			input.allCards,
			(c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', cost),
			input.inputOptions,
		);
	},
};
