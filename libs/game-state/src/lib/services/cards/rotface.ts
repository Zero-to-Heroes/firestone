/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardRarity, CardType } from '@firestone-hs/reference-data';
import { hasCorrectRarity, hasCorrectType } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const Rotface: StaticGeneratingCard = {
	cardIds: [CardIds.Rotface_ICC_405, CardIds.Rotface_CORE_ICC_405],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			Rotface.cardIds[0],
			input.allCards,
			(c) => hasCorrectRarity(c, CardRarity.LEGENDARY) && hasCorrectType(c, CardType.MINION),
			input.inputOptions,
		);
	},
};
