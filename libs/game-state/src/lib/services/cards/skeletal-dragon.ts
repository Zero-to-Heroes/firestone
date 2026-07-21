/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Void Soul (JAIL_732)
 * Summon a random 1-Cost Demon. Improve your future Void Souls.
 */
import { CardIds, CardType, hasCorrectTribe, Race } from '@firestone-hs/reference-data';

import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const SkeletalDragon: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.SkeletalDragon],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			SkeletalDragon.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.DRAGON),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.MINION,
			races: [Race.DRAGON],
			possibleCards: filterCards(
				SkeletalDragon.cardIds[0],
				input.allCards,
				(c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.DRAGON),
				input.options,
			),
		};
	},
};
