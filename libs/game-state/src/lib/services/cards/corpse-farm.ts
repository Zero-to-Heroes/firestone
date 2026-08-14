/* eslint-disable no-mixed-spaces-and-tabs */
// Corpse Farm (WW_374 / CORE_WW_374)
// "Spend up to 8 <b>Corpses</b> to summon a random minion of that Cost."

import { CardIds, CardType, GameTag, ReferenceCard } from '@firestone-hs/reference-data';
import {
	getPlayerOrOpponentControllerEntity,
	getPlayerTag,
	hasCorrectType,
	hasCost,
} from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const CorpseFarm: StaticGeneratingCard = {
	cardIds: [CardIds.CorpseFarm_WW_374, CardIds.CorpseFarm_CORE_WW_374],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const corpses = Math.min(
			8,
			getPlayerTag(
				getPlayerOrOpponentControllerEntity(input.inputOptions.deckState, input.inputOptions.gameState),
				GameTag.CORPSES,
			),
		);
		return filterCards(
			CorpseFarm.cardIds[0],
			input.allCards,
			(c: ReferenceCard) =>
				hasCorrectType(c, CardType.MINION) && hasCost(c, '==', corpses) && !hasCost(c, '==', 0),
			input.inputOptions,
		);
	},
};
