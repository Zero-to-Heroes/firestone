/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * A Littleof This (JAIL_201a)
 * Give your hero +2 Attack this turn.
 */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { StoredInformation } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import {
	Card,
	GeneratingCard,
	GuessCardIdInput,
	GuessInfoInput,
	OnCardPlayedCard,
	OnCardPlayedInput,
	StaticGeneratingCard,
	StaticGeneratingCardInput,
} from './_card.type';

export const Repackage: Card & GeneratingCard & OnCardPlayedCard = {
	cardIds: [CardIds.Repackage_TOY_879],
	// When the token is created, the cards it will send back is the list of cards that is on the board at the time it
	// is played
	guessInfo: (input: GuessInfoInput) => {
		const creator =
			input.deckState.findCard(input.creatorEntityId, { includeTrueEntityId: true }) ??
			input.opponentDeckState.findCard(input.creatorEntityId, { includeTrueEntityId: true });
		if (!creator?.card) {
			return null;
		}
		const cards = creator.card.storedInformation?.cards ?? [];
		return {
			possibleCards: cards.map((c) => c.cardId),
		};
	},
	onCardPlayed: (input: OnCardPlayedInput) => {
		const cards = [...input.deckState.board, ...input.opponentDeckState.board]
			.filter((c) => hasCorrectType(input.allCards.getCard(c.cardId), CardType.MINION))
			.sort((a, b) => (a.playTiming ?? 0) - (b.playTiming ?? 0))
			.map((c) => ({ cardId: c.cardId, entityId: c.entityId }));
		const result: StoredInformation = {
			cards: cards,
		};
		return result;
	},
};

export const RepackagedBox: Card & StaticGeneratingCard & GeneratingCard = {
	cardIds: [CardIds.Repackage_RepackagedBoxToken_TOY_879t],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const repackagedBox =
			input.inputOptions.deckState.findCard(input.inputOptions.trueEntityId, { includeTrueEntityId: true }) ??
			input.inputOptions.opponentDeckState.findCard(input.inputOptions.trueEntityId, {
				includeTrueEntityId: true,
			});
		if (!repackagedBox?.card) {
			return [];
		}
		const repackage =
			input.inputOptions.deckState.findCard(repackagedBox.card.creatorEntityId, { includeTrueEntityId: true }) ??
			input.inputOptions.opponentDeckState.findCard(repackagedBox.card.creatorEntityId, {
				includeTrueEntityId: true,
			});
		return repackage?.card?.storedInformation?.cards?.map((c) => c.cardId) ?? [];
	},
	guessCardId: (input: GuessCardIdInput) => {
		const repackagedBox =
			input.deckState.findCard(input.creatorEntityId, { includeTrueEntityId: true }) ??
			input.opponentDeckState.findCard(input.creatorEntityId, {
				includeTrueEntityId: true,
			});
		if (!repackagedBox?.card) {
			return null;
		}
		const repackage =
			input.deckState.findCard(repackagedBox.card.creatorEntityId, { includeTrueEntityId: true }) ??
			input.opponentDeckState.findCard(repackagedBox.card.creatorEntityId, { includeTrueEntityId: true });
		return repackage?.card.storedInformation?.cards?.[input.createdIndex]?.cardId ?? null;
	},
};
