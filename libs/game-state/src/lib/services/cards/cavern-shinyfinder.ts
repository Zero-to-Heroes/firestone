/* eslint-disable no-mixed-spaces-and-tabs */
// Agency Espionage (WORK_004)
// 4-Cost Rogue Spell
// "Shuffle a card from each other class into your deck. They cost (1). Draw one."
import { CardIds } from '@firestone-hs/reference-data';
import { HighlightSide } from '@firestone/shared/framework/core';
import { and, inDeck, side, weapon } from '../card-highlight/selectors';
import { GeneratingCard, SelectorCard } from './_card.type';

export const CavernShinyfinder: SelectorCard & GeneratingCard = {
	cardIds: [CardIds.CavernShinyfinder],
	publicTutor: true,
	selector: (inputSide: HighlightSide) => and(side(inputSide), inDeck, weapon),
};
