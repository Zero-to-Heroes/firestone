/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { GeneratingCard, GuessInfoInput } from './_card.type';
import { AllCardsService } from '@firestone-hs/reference-data';

export const ReplicatorInator: GeneratingCard = {
	cardIds: [CardIds.TheReplicatorInator_MIS_025],
	publicCreator: true,
	guessCardId: (
		cardId: string,
		deckState: DeckState,
		opponentDeckState: DeckState,
		creatorCardId: string,
		creatorEntityId: number,
		createdIndex: number,
		allCards: AllCardsService,
	) => {
		if (createdIndex === 0) {
			return CardIds.TheReplicatorInator_TheReplicatorInatorMiniToken_MIS_025t;
		} else if (createdIndex === 1) {
			return CardIds.TheReplicatorInator_TheReplicatorInatorToken_MIS_025t1;
		}
		return null;
	},
};
