/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { GeneratingCard, GuessInfoInput } from './_card.type';
import { AllCardsService } from '@firestone-hs/reference-data';

export const Kiljaeden: GeneratingCard = {
	cardIds: [CardIds.Kiljaeden_KiljaedensPortalEnchantment_GDB_145e],
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const portal = input.deckState.enchantments.find(
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
