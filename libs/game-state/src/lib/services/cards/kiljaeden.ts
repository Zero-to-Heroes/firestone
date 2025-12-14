/* eslint-disable no-mixed-spaces-and-tabs */
import { AllCardsService, CardIds, CardType, GameTag, Race, ReferenceCard } from '@firestone-hs/reference-data';
import { hasCorrectTribe, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isDemonMinion = (c: ReferenceCard): boolean => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.DEMON);

export const Kiljaeden: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Kiljaeden_KiljaedensPortalEnchantment_GDB_145e],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(Kiljaeden.cardIds[0], input.allCards, isDemonMinion, input.inputOptions);
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
					possibleCards: filterCards(Kiljaeden.cardIds[0], input.allCards, isDemonMinion, input.options),
				}
			: null;
	},
};
