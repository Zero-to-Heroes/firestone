/* eslint-disable no-mixed-spaces-and-tabs */
// Bwonsamdi (TIME_619t): Talanji of the Graves token
// Summons a random minion whose cost scales with Bwonsamdi boons.

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { bwonsamdiBoonsEnchantments, hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const Bwonsamdi: StaticGeneratingCard = {
	cardIds: [CardIds.TalanjiOfTheGraves_BwonsamdiToken_TIME_619t],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const boons = input.inputOptions.deckState?.enchantments?.filter((e) =>
			bwonsamdiBoonsEnchantments.includes(e.cardId as CardIds),
		);
		const cost = 4 + 2 * (boons?.length ?? 0);
		return filterCards(
			Bwonsamdi.cardIds[0],
			input.allCards,
			(c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', cost),
			input.inputOptions,
		);
	},
};
