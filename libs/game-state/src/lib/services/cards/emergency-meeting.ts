/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CREWMATES, GameFormat, GameTag, GameType } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { Metadata } from '../../models/metadata';
import { randomDemons } from '../../related-cards/dynamic-pools';
import { GeneratingCard } from './_card.type';

export const EmergencyMeeting: GeneratingCard = {
	cardIds: [CardIds.EmergencyMeeting_GDB_119],
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
		let possibleCards: readonly string[] = [];
		if (card.createdIndex === 0 || card.createdIndex == 1) {
			return {
				possibleCards: CREWMATES,
			};
		} else if (card.createdIndex === 2) {
			possibleCards = randomDemons(EmergencyMeeting.cardIds[0], allCards.getService(), {
				format: options?.metadata?.formatType ?? GameFormat.FT_STANDARD,
				gameType: options?.metadata?.gameType ?? GameType.GT_RANKED,
				scenarioId: options?.metadata?.scenarioId ?? 0,
				validArenaPool: options?.validArenaPool ?? [],
			});
		}
		return {
			possibleCards: possibleCards,
		};
	},
};
