/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput } from './_card.type';

export const RazaTheResealed: GeneratingCard = {
	cardIds: [CardIds.RazaTheResealed_TOY_383],
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = input.deckState.minionsDeadThisMatch
			.map((e) => e.cardId)
			.filter((value, index, self) => self.indexOf(value) === index);
		return {
			possibleCards: possibleCards,
		};
	},
};
