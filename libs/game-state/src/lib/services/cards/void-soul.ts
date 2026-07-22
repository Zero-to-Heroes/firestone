/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Void Soul (JAIL_732)
 * Summon a random 1-Cost Demon. Improve your future Void Souls.
 */
import { CardIds, CardType, hasCorrectTribe, Race, ReferenceCard } from '@firestone-hs/reference-data';

import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const demonFilter = (cost: number) => (c: ReferenceCard) =>
	hasCorrectType(c, CardType.MINION) && hasCost(c, '==', cost) && hasCorrectTribe(c, Race.DEMON);

export const VoidSoul: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.VoidSoul_JAIL_732],
	publicCreator: true,
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const currentVoidSoul = input.inputOptions.deckState.powerTriggeredThisMatch.filter(
			(c) => c.cardId === CardIds.VoidSoul_JAIL_732,
		).length;
		const clampedCost = Math.min(10, currentVoidSoul + 1);
		return filterCards(CardIds.VoidSoul_JAIL_732, input.allCards, demonFilter(clampedCost), input.inputOptions);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const currentVoidSoul = input.deckState.powerTriggeredThisMatch.filter(
			(c) => c.cardId === CardIds.VoidSoul_JAIL_732,
		).length;
		const clampedCost = Math.min(10, currentVoidSoul + 1);
		return {
			cardType: CardType.MINION,
			cost: { cost: clampedCost, comparison: '==' },
			races: [Race.DEMON],
			possibleCards: filterCards(
				CardIds.VoidSoul_JAIL_732,
				input.allCards,
				demonFilter(clampedCost),
				input.options,
			),
		};
	},
};
