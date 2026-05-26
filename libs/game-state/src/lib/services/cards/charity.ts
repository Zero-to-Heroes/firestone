/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import {
	GeneratingCard,
	GuessCardIdInput,
	GuessInfoInput,
	StaticGeneratingCard,
	StaticGeneratingCardInput,
} from './_card.type';

export const Charity: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Charity_MEND_805],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const ids = input.inputOptions.deckState.minionsDeadThisTurn.map((m) => m.cardId).filter(Boolean);
		return ids;
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const dead = input.deckState.minionsDeadThisTurn.map((m) => m.cardId).filter(Boolean);
		return { cardType: CardType.MINION, possibleCards: dead.length ? dead : null };
	},
	guessCardId: (input: GuessCardIdInput): string | null => {
		const dead = input.deckState.minionsDeadThisTurn;
		const idx = input.createdIndex ?? 0;
		return dead[idx]?.cardId ?? null;
	},
};
