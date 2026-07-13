/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * A Littleof This (JAIL_201a)
 * Give your hero +2 Attack this turn.
 */
import { CardIds } from '@firestone-hs/reference-data';
import { Card, GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

export const Repackage: Card & GeneratingCard = {
	cardIds: [CardIds.Repackage_TOY_879],
	// When the token is created, the cards it will send back is the list of cards that is on the board at the time it
	// is played
	guessInfo: (input: GuessInfoInput) => {
		const cards = [...input.deckState.board, ...input.opponentDeckState.board]
			.sort((a, b) => (a.playTiming ?? 0) - (b.playTiming ?? 0))
			.map((c) => c.cardId);
		return {
			possibleCards: cards,
		};
	},
};

export const RepackagedBox: Card & StaticGeneratingCard = {
	cardIds: [CardIds.Repackage_RepackagedBoxToken_TOY_879t],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const card =
			input.inputOptions.deckState.findCard(input.inputOptions.trueEntityId, { includeTrueEntityId: true }) ??
			input.inputOptions.opponentDeckState.findCard(input.inputOptions.trueEntityId, {
				includeTrueEntityId: true,
			});
		return card?.card?.guessedInfo?.possibleCards ?? [];
	},
};
