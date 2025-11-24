/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { GeneratingCard, GuessInfoInput } from './_card.type';
import { AllCardsService } from '@firestone-hs/reference-data';

export const IncriminatingPsychic: GeneratingCard = {
	cardIds: [CardIds.IncriminatingPsychic, CardIds.IncriminatingPsychic_CORE_MAW_022],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = input.opponentDeckState.hand.map((c) => c.cardId).filter((c) => !!c);
		return {
			possibleCards: possibleCards,
		};
	},
};
