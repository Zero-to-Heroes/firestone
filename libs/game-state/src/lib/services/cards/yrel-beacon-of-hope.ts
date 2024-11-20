/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { Card, GeneratingCard } from './_card.type';

export const YrelBeaconOfHope: Card & GeneratingCard = {
	guessInfo: (deckState: DeckState, allCards: CardsFacadeService, creatorEntityId: number): GuessedInfo | null => {
		return {
			possibleCards: [CardIds.LibramOfJustice_BT_011, CardIds.LibramOfHope, CardIds.LibramOfWisdom_BT_025],
		};
	},
};
