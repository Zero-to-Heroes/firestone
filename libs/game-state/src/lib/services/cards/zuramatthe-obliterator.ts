/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Zuramatthe Obliterator (JAIL_887t2)
 * At the end of your turn, play a card discarded by Zuramat's Prison.
 */
import { CardIds } from '@firestone-hs/reference-data';

import { DeckState } from '../../models/deck-state';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

const getRemainingDiscardedCards = (deckState: DeckState, zuramatEntityId: number | undefined | null): string[] => {
	if (!zuramatEntityId) {
		return [];
	}
	const prisonEntityId = deckState.findCard(zuramatEntityId)?.card?.creatorEntityId;
	if (!prisonEntityId) {
		return [];
	}

	const candidates = deckState.otherZone
		.filter((c) => c.zone === 'DISCARD' && c.lastAffectedByEntityId === prisonEntityId)
		.map((c) => c.cardId);

	const replayedCards = deckState
		.getAllCardsInDeckWithoutOptions()
		.map((c) => deckState.findCard(c.entityId)?.card)
		.filter((c) => !!c?.cardId && c.creatorEntityId === zuramatEntityId);

	for (const card of replayedCards) {
		const index = candidates.indexOf(card!.cardId);
		if (index !== -1) {
			candidates.splice(index, 1);
		}
	}

	return candidates;
};

export const ZuramattheObliterator: StaticGeneratingCard & GeneratingCard = {
	cardIds: [CardIds.ZuramattheObliterator_JAIL_887t2],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		getRemainingDiscardedCards(input.inputOptions.deckState, input.entityId),
	guessInfo: (input: GuessInfoInput) => ({
		possibleCards: getRemainingDiscardedCards(input.deckState, input.creatorEntityId),
	}),
};
