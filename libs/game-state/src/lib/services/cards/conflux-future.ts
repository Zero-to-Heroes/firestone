/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { canBeDiscoveredByClass, hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessCardIdInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const ConfluxFuture: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.PastConflux_FutureConfluxToken_TIME_436t2],
	publicCreator: true,
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			ConfluxFuture.cardIds[0],
			input.allCards,
			(c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasCorrectTribe(c, Race.DRAGON) &&
				hasCost(c, '>=', 5) &&
				canBeDiscoveredByClass(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessCardId: (input: GuessCardIdInput): string | null => {
		// We want to take the latest one, since it has just been created on board
		return (
			[...input.deckState.board]
				.sort((a, b) => b.entityId - a.entityId)
				.find((e) => e.creatorEntityId === input.creatorEntityId)?.cardId ?? null
		);
	},
};
