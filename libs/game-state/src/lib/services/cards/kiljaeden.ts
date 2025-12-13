/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, GameTag, Race } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { hasCorrectTribe, hasCorrectType } from '../../related-cards/dynamic-pools';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { AllCardsService } from '@firestone-hs/reference-data';
import { filterCards } from './utils';

export const Kiljaeden: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Kiljaeden_KiljaedensPortalEnchantment_GDB_145e],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			Kiljaeden.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.DEMON),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const portal = input.deckState.enchantments.find(
			(e) => e.cardId === CardIds.Kiljaeden_KiljaedensPortalEnchantment_GDB_145e,
		);
		const statsBuff = portal?.tags?.[GameTag.TAG_SCRIPT_DATA_NUM_2];
		return statsBuff != null
			? {
					attackBuff: statsBuff,
					healthBuff: statsBuff,
					cardType: CardType.MINION,
					cardTribes: [Race.DEMON],
					possibleCards: filterCards(
						Kiljaeden.cardIds[0],
						input.allCards,
						(c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.DEMON),
						input.options,
					),
				}
			: null;
	},
};
