/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, GameTag, SpellSchool } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { GeneratingCard } from './_card.type';

export const MendTheTimeline: GeneratingCard = {
	cardIds: [CardIds.MendTheTimeline_TIME_018],
	publicCreator: true,
	guessInfo: (
		deckState: DeckState,
		allCards: CardsFacadeService,
		creatorEntityId: number,
		options?: {
			positionInHand?: number;
			tags?: readonly { Name: GameTag; Value: number }[];
		},
	): GuessedInfo | null => {
		return {
			cardType: CardType.SPELL,
			spellSchools: [SpellSchool.HOLY],
		};
	},
};
