/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { GeneratingCard, GuessInfoInput } from './_card.type';
import { AllCardsService } from '@firestone-hs/reference-data';

export const IdentityTheft: GeneratingCard = {
	cardIds: [CardIds.IdentityTheft, CardIds.IdentityTheft_CORE_REV_253],
	hasSequenceInfo: true,
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		let possibleCards: readonly string[] = [];
		if (input.card.createdIndex === 0) {
			possibleCards = input.opponentDeckState.hand
				.map((c) => c.cardId)
				.filter((c) => !!c)
				.filter((c, index, self) => self.indexOf(c) === index);
		} else if (input.card.createdIndex === 1) {
			possibleCards = input.opponentDeckState.deck
				.map((c) => c.cardId)
				.filter((c) => !!c)
				.filter((c, index, self) => self.indexOf(c) === index);
		}
		return {
			possibleCards: possibleCards,
		};
	},
};
