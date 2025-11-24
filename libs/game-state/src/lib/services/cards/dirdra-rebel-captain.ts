/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { GeneratingCard, GuessInfoInput } from './_card.type';
import { AllCardsService } from '@firestone-hs/reference-data';

export const DirdraRebelCaptain: GeneratingCard = {
	cardIds: [CardIds.DirdraRebelCaptain_GDB_117],
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const allCrewmates =
			input.allCards
				.getCard(CardIds.DirdraRebelCaptain_GDB_117)
				.relatedCardDbfIds?.map((dbfId) => input.allCards.getCard(dbfId)?.id) ?? [];
		const possibleCards = allCrewmates.filter((crewmate) =>
			input.deckState
				.getAllCardsInDeck()
				.map((c) => c.cardId)
				.includes(crewmate),
		);
		return !!possibleCards?.length
			? {
					possibleCards: possibleCards,
				}
			: null;
	},
};
