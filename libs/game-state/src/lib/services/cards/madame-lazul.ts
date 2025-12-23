/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput } from './_card.type';

export const MadameLazul: GeneratingCard = {
	cardIds: [CardIds.MadameLazul, CardIds.MadameLazul_CORE_DAL_729],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = input.opponentDeckState.hand.map((c) => c.cardId).filter((c) => !!c);
		return {
			possibleCards: possibleCards,
		};
	},
};
