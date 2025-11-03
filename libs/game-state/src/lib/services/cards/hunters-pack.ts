/* eslint-disable no-mixed-spaces-and-tabs */
import {
	CardClass,
	CardIds,
	CardType,
	GameTag,
	hasCorrectTribe,
	hasMechanic,
	Race,
} from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { Metadata } from '../../models/metadata';
import { hasCorrectClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard } from './_card.type';
import { filterCards } from './utils';

export const HuntersPack: GeneratingCard = {
	cardIds: [CardIds.HuntersPack],
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
				races: [Race.BEAST],
				cardClasses: [CardClass.HUNTER],
				possibleCards: filterCards(
					HuntersPack.cardIds[0],
					allCards,
					(c) =>
						hasCorrectType(c, CardType.MINION) &&
						hasCorrectTribe(c, Race.BEAST) &&
						hasCorrectClass(c, CardClass.HUNTER),
					options,
				),
			};
		} else if (card.createdIndex === 1) {
			return {
				cardType: CardType.SPELL,
				cardClasses: [CardClass.HUNTER],
				possibleCards: filterCards(
					HuntersPack.cardIds[0],
					allCards,
					(c) =>
						hasCorrectType(c, CardType.SPELL) &&
						hasMechanic(c, GameTag.SECRET) &&
						hasCorrectClass(c, CardClass.HUNTER),
					options,
				),
			};
		} else if (card.createdIndex === 2) {
			return {
				cardType: CardType.WEAPON,
				cardClasses: [CardClass.HUNTER],
				possibleCards: filterCards(
					HuntersPack.cardIds[0],
					allCards,
					(c) =>
						hasCorrectType(c, CardType.WEAPON) &&
						hasMechanic(c, GameTag.SECRET) &&
						hasCorrectClass(c, CardClass.HUNTER),
					options,
				),
			};
		}
		return null;
	},
};
