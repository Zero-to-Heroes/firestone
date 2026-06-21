/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Spiteful Chef (JAIL_507)
 * Battlecry: Summon a 2-Cost Taunt minion. If you have 10 or more Mana, summon a 6-Cost instead.
 */
import { CardIds, CardType, GameTag, hasMechanic } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/framework/core';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const SpitefulChef: StaticGeneratingCard = {
	cardIds: [TempCardIds.SpitefulChef_JAIL_507 as unknown as CardIds],
	publicCreator: true,
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			SpitefulChef.cardIds[0],
			input.allCards,
			(c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasMechanic(c, GameTag.TAUNT) &&
				(hasCost(c, '==', 2) || hasCost(c, '==', 6)),
			input.inputOptions,
		);
	},
};
