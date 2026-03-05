/* eslint-disable no-mixed-spaces-and-tabs */
// Gemstone Hoarder (CATA_897): 3 Mana 3/4 Neutral
// "Battlecry: Choose a card in your hand to discard. Deathrattle: Get it back. It costs (1) less."

import { CardIds } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

export const GemstoneHoarder: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.GemstoneHoarder_CATA_897],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return [];
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return null;
	},
};
