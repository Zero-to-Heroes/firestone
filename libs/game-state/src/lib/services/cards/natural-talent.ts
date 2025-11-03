/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, GameTag, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { Metadata } from '../../models/metadata';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard } from './_card.type';
import { filterCards } from './utils';

export const NaturalTalent: GeneratingCard = {
	cardIds: [CardIds.NaturalTalent_VAC_329],
	hasSequenceInfo: true,
	publicCreator: true,
	guessInfo: (
		card: DeckCard,
		deckState: DeckState,
		opponentDeckState: DeckState,
		allCards: CardsFacadeService,
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
				cardType: CardType.MINION,
				races: [Race.NAGA],
				possibleCards: filterCards(
					NaturalTalent.cardIds[0],
					allCards,
					(c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.NAGA),
					options,
				),
			};
		} else if (card.createdIndex === 1) {
			return {
				cardType: CardType.SPELL,
				possibleCards: filterCards(
					NaturalTalent.cardIds[0],
					allCards,
					(c) => hasCorrectType(c, CardType.SPELL),
					options,
				),
			};
		}
		return null;
	},
};
