/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardRarity, CardType } from '@firestone-hs/reference-data';
import { hasCorrectRarity, hasCorrectType } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const SkyMotherAviana: StaticGeneratingCard = {
	cardIds: [CardIds.SkyMotherAviana_TOY_806],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			SkyMotherAviana.cardIds[0],
			input.allCards,
			(c) => hasCorrectRarity(c, CardRarity.LEGENDARY) && hasCorrectType(c, CardType.MINION),
			input.inputOptions,
		);
	},
};
