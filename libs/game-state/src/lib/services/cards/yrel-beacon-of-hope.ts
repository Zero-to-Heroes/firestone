/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { GeneratingCard, GuessInfoInput } from './_card.type';
import { AllCardsService } from '@firestone-hs/reference-data';

export const YrelBeaconOfHope: GeneratingCard = {
	cardIds: [CardIds.YrelBeaconOfHope_GDB_141],
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			possibleCards: [CardIds.LibramOfJustice_BT_011, CardIds.LibramOfHope, CardIds.LibramOfWisdom_BT_025],
		};
	},
};
