/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/framework/core';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessCardIdInput, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

export const Charity: GeneratingCard & StaticGeneratingCard = {
	cardIds: [TempCardIds.PaladinMend805Charity as unknown as CardIds],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const ids = input.inputOptions.deckState.minionsDeadThisTurn.map((m) => m.cardId).filter(Boolean);
		return [...new Set(ids)];
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const dead = input.deckState.minionsDeadThisTurn.map((m) => m.cardId).filter(Boolean);
		const unique = [...new Set(dead)];
		return { cardType: CardType.MINION, possibleCards: unique.length ? unique : null };
	},
	guessCardId: (input: GuessCardIdInput): string | null => {
		const dead = input.deckState.minionsDeadThisTurn;
		const idx = input.createdIndex ?? 0;
		return dead[idx]?.cardId ?? null;
	},
};
