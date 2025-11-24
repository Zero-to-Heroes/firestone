/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, GameTag, hasSpellSchool, SpellSchool } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { Metadata } from '../../models/metadata';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard } from './_card.type';
import { AllCardsService } from '@firestone-hs/reference-data';
import { filterCards } from './utils';

export const TwilightMender: GeneratingCard = {
	cardIds: [CardIds.TwilightMender_TLC_814],
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
		if (card.createdIndex === 0) {
			return {
				cardType: CardType.SPELL,
				spellSchools: [SpellSchool.HOLY],
				possibleCards: filterCards(
					TwilightMender.cardIds[0],
					allCards,
					(c) => hasCorrectType(c, CardType.SPELL) && hasSpellSchool(c, SpellSchool.HOLY),
					options,
				),
			};
		} else if (card.createdIndex === 1) {
			return {
				cardType: CardType.SPELL,
				spellSchools: [SpellSchool.SHADOW],
				possibleCards: filterCards(
					TwilightMender.cardIds[0],
					allCards,
					(c) => hasCorrectType(c, CardType.SPELL) && hasSpellSchool(c, SpellSchool.SHADOW),
					options,
				),
			};
		}
		return null;
	},
};
