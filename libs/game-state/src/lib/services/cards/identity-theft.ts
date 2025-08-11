/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput } from './_card.type';

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
