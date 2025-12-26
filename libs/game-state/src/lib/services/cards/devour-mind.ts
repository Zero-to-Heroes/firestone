/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput } from './_card.type';

export const DevourMind: GeneratingCard = {
	cardIds: [CardIds.DevourMind_ICC_207, CardIds.DevourMind_CORE_ICC_207],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = input.opponentDeckState.deck.map((c) => c.cardId).filter((c) => !!c);
		return {
			possibleCards: possibleCards,
		};
	},
};
