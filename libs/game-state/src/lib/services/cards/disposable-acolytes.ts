/* eslint-disable no-mixed-spaces-and-tabs */
// Disposable Acolytes (CATA_499): 2 Mana Warlock Spell
// "When you play or discard this, summon two random 1-Cost minions."

import { CardIds, CardType } from '@firestone-hs/reference-data';
import { hasCost, hasCorrectType } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const DisposableAcolytes: StaticGeneratingCard = {
	cardIds: [CardIds.DisposableAcolytes_CATA_499],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			DisposableAcolytes.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 1),
			input.inputOptions,
		);
	},
};
