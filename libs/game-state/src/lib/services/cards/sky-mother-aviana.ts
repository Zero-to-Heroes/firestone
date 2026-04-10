/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardRarity, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectRarity, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const SkyMotherAviana: StaticGeneratingCard & GeneratingCard = {
	cardIds: [CardIds.SkyMotherAviana_TOY_806],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			SkyMotherAviana.cardIds[0],
			input.allCards,
			(c) => hasCorrectRarity(c, CardRarity.LEGENDARY) && hasCorrectType(c, CardType.MINION),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.MINION,
			rarity: CardRarity.LEGENDARY,
			cost: 1,
		};
	},
};
