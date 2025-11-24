/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, GameTag, SpellSchool } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { Metadata } from '../../models/metadata';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard } from './_card.type';
import { AllCardsService } from '@firestone-hs/reference-data';
import { filterCards } from './utils';

export const Blasteroid: GeneratingCard = {
	cardIds: [CardIds.Blasteroid_GDB_303],
	hasSequenceInfo: true,
	publicCreator: true,
	guessInfo: (
		card: DeckCard,
		deckState: DeckState,
		opponentDeckState: DeckState,
		allCards: AllCardsService,
		creatorEntityId: number,
		options?: {
			positionInHand?: number;
			tags?: readonly { Name: GameTag; Value: number }[];
			metadata?: Metadata;
			validArenaPool?: readonly string[];
		},
	): GuessedInfo | null => {
		return {
			cardType: CardType.SPELL,
			spellSchools: [SpellSchool.FIRE],
		};
	},
};
