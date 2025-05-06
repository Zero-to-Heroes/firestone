/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { Card, GeneratingCard } from './_card.type';

export const Kiljaeden: Card & GeneratingCard = {
	guessInfo: (
		deckState: DeckState,
		allCards: CardsFacadeService,
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
