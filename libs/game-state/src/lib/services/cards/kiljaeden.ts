/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { GeneratingCard } from './_card.type';
import { AllCardsService } from '@firestone-hs/reference-data';

export const Kiljaeden: GeneratingCard = {
	cardIds: [CardIds.Kiljaeden_KiljaedensPortalEnchantment_GDB_145e],
	guessInfo: (
		card: DeckCard,
		deckState: DeckState,
		opponentDeckState: DeckState,
		allCards: AllCardsService,
		creatorEntityId: number,
		options?: {
			positionInHand?: number;
			tags?: readonly { Name: GameTag; Value: number }[];
		},
	): GuessedInfo | null => {
		const portal = deckState.enchantments.find(
			(e) => e.cardId === CardIds.Kiljaeden_KiljaedensPortalEnchantment_GDB_145e,
		);
		const statsBuff = portal?.tags?.[GameTag.TAG_SCRIPT_DATA_NUM_2];
		return statsBuff != null
			? {
					attackBuff: statsBuff,
					healthBuff: statsBuff,
				}
			: null;
	},
};
