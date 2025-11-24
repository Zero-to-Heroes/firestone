/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, GameTag, SpellSchool } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { GeneratingCard, GuessInfoInput } from './_card.type';
import { AllCardsService } from '@firestone-hs/reference-data';

export const FarseerWo: GeneratingCard = {
	cardIds: [CardIds.FarseerWo_TIME_013],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.SPELL,
			spellSchools: [SpellSchool.NATURE],
		};
	},
};
