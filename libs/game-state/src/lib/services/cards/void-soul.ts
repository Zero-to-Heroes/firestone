/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Void Soul (JAIL_732)
 * Summon a random 1-Cost Demon. Improve your future Void Souls.
 */
import { CardIds, CardType, hasCorrectTribe, Race, ReferenceCard } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/framework/core';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const demonFilter = (cost: number) => (c: ReferenceCard) =>
	hasCorrectType(c, CardType.MINION) && hasCost(c, '==', cost) && hasCorrectTribe(c, Race.DEMON);

export const VoidSoul: GeneratingCard & StaticGeneratingCard = {
	cardIds: [TempCardIds.VoidSoul_JAIL_732 as unknown as CardIds],
	publicCreator: true,
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const currentVoidSoul = 0;
		return filterCards(
			TempCardIds.VoidSoul_JAIL_732 as unknown as CardIds,
			input.allCards,
			demonFilter(currentVoidSoul + 1),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const currentVoidSoul = 0;
		return {
			cardType: CardType.MINION,
			cost: { cost: 1, comparison: '==' },
			races: [Race.DEMON],
			possibleCards: filterCards(
				TempCardIds.VoidSoul_JAIL_732 as unknown as CardIds,
				input.allCards,
				demonFilter(currentVoidSoul + 1),
				input.options,
			),
		};
	},
};
