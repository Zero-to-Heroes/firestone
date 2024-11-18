/* eslint-disable no-mixed-spaces-and-tabs */
import { SpellSchool } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { Card, UpdatingCard } from './_card.type';

export const NorthernNavigation: Card & UpdatingCard = {
	updateGuessInfo: (
		deckState: DeckState,
		allCards: CardsFacadeService,
		creatorEntityId: number,
	): GuessedInfo | null => {
		return {
			spellSchools: [SpellSchool.FROST],
		};
	},
};
