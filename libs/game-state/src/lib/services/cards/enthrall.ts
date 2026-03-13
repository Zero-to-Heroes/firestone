/* eslint-disable no-mixed-spaces-and-tabs */
// Enthrall (CATA_190t13)
// "Shuffle five random Legendary Dragons into your deck. They cost (1)."
import { CardIds, CardRarity, CardType, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { hasCorrectRarity, hasCorrectType } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const Enthrall: StaticGeneratingCard = {
	cardIds: [CardIds.EnthrallToken_CATA_190t13],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			Enthrall.cardIds[0],
			input.allCards,
			(c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasCorrectRarity(c, CardRarity.LEGENDARY) &&
				hasCorrectTribe(c, Race.DRAGON),
			input.inputOptions,
		);
	},
};
