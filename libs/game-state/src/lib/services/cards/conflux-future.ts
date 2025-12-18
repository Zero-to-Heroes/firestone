/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds } from '@firestone-hs/reference-data';
import { GeneratingCard, GuessCardIdInput } from './_card.type';

export const ConfluxFuture: GeneratingCard = {
	cardIds: [CardIds.PastConflux_FutureConfluxToken_TIME_436t2],
	publicCreator: true,
	guessCardId: (input: GuessCardIdInput): string | null => {
		// We want to take the latest one, since it has just been created on board
		return (
			[...input.deckState.board]
				.sort((a, b) => b.entityId - a.entityId)
				.find((e) => e.creatorEntityId === input.creatorEntityId)?.cardId ?? null
		);
	},
};
