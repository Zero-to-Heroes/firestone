/* eslint-disable no-mixed-spaces-and-tabs */
// Maze Guide (REV_308 / CORE_REV_308): 2 Mana 1/1
// "<b>Battlecry</b>: Summon a random 2-Cost minion."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';

import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 2);

export const MazeGuide: StaticGeneratingCard = {
	cardIds: [CardIds.MazeGuide, CardIds.MazeGuide_CORE_REV_308],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(MazeGuide.cardIds[0], input.allCards, isMatch, input.inputOptions),
};
