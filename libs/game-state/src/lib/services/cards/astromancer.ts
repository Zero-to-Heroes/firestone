/* eslint-disable no-mixed-spaces-and-tabs */
// Astromancer (BOT_256 / CORE_BOT_256): 7 Mana 5/5
// "[x]<b>Battlecry:</b> Summon a random minion with Cost equal to your hand size."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const Astromancer: StaticGeneratingCard = {
	cardIds: [CardIds.Astromancer, CardIds.Astromancer_CORE_BOT_256],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const cost = Math.min(10, input.inputOptions.deckState.hand.length);
		return filterCards(
			Astromancer.cardIds[0],
			input.allCards,
			(c: ReferenceCard) => hasCost(c, '==', cost) && hasCorrectType(c, CardType.MINION),
			input.inputOptions,
		);
	},
};
