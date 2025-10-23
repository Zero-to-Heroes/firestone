/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { Card, GeneratingCard } from './_card.type';

export const DirdraRebelCaptain: GeneratingCard = {
	cardIds: [CardIds.DirdraRebelCaptain_GDB_117],
	guessInfo: (deckState: DeckState, allCards: CardsFacadeService, creatorEntityId: number): GuessedInfo | null => {
		const allCrewmates =
			allCards
				.getCard(CardIds.DirdraRebelCaptain_GDB_117)
				.relatedCardDbfIds?.map((dbfId) => allCards.getCard(dbfId)?.id) ?? [];
		const possibleCards = allCrewmates.filter((crewmate) =>
			deckState
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
