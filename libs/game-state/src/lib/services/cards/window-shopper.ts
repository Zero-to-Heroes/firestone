/* eslint-disable no-mixed-spaces-and-tabs */
import { AllCardsService, CardIds } from '@firestone-hs/reference-data';
import { DeckState } from '../../models/deck-state';
import { GeneratingCard } from './_card.type';

export const WindowShopper: GeneratingCard = {
	cardIds: [CardIds.WindowShopper_TOY_652],
	publicCreator: true,
	hasSequenceInfo: true,
	guessCardId: (
		cardId: string,
		deckState: DeckState,
		opponentDeckState: DeckState,
		creatorCardId: string,
		creatorEntityId: number,
		createdIndex: number,
		allCards: AllCardsService,
	): string | null => {
		if (createdIndex === 0) {
			return CardIds.WindowShopper_WindowShopperToken_TOY_652t;
		}
		return null;
	},
};
