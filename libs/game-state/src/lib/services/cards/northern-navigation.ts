/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, SpellSchool } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { GeneratingCard } from './_card.type';
import { AllCardsService } from '@firestone-hs/reference-data';

export const NorthernNavigation: GeneratingCard = {
	cardIds: [CardIds.NorthernNavigation],
	guessInfo: (
		card: DeckCard,
		deckState: DeckState,
		opponentDeckState: DeckState,
		allCards: AllCardsService,
		creatorEntityId: number,
	): GuessedInfo | null => {
		return {
			spellSchools: [SpellSchool.FROST],
		};
	},
};
