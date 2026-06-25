/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Zuramatthe Obliterator (JAIL_887t2)
 * At the end of your turn, play a card discarded by Zuramat's Prison.
 */
import { CardIds } from '@firestone-hs/reference-data';

import { Card, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

export const ZuramattheObliterator: Card & StaticGeneratingCard = {
	cardIds: [CardIds.ZuramattheObliterator_JAIL_887t2],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const prisonEntityId = input.inputOptions.deckState.findCard(input.entityId)?.card?.creatorEntityId;
		// Find all cards discarded by the prison
		const discardedCards = input.inputOptions.deckState.otherZone.filter(
			(c) => c.zone === 'DISCARD' && c.lastAffectedByEntityId === prisonEntityId,
		);
		// TODO: need to find all cards that have been played by Zuramat to remove them from the list
		return discardedCards.map((c) => c.cardId);
	},
};
