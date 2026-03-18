/* eslint-disable no-mixed-spaces-and-tabs */
// Gemstone Hoarder (CATA_897): 3 Mana 3/4 Neutral
// "Battlecry: Choose a card in your hand to discard. Deathrattle: Get it back. It costs (1) less."

import { CardIds } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput } from './_card.type';

export const GemstoneHoarder: GeneratingCard = {
	cardIds: [CardIds.GemstoneHoarder_CATA_897],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const hoarder =
			input.deckState.findCard(input.creatorEntityId)?.card ??
			input.opponentDeckState.findCard(input.creatorEntityId)?.card;
		const relatedCardIds = hoarder?.relatedCardIds;
		if (!relatedCardIds?.length) {
			return null;
		}
		return {
			possibleCards: relatedCardIds,
		};
	},
};
