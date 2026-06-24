/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const SwampDragonEgg: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.SwampDragonEgg],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			SwampDragonEgg.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.DRAGON),
			input.options,
		);
		return {
			cardType: CardType.MINION,
			races: [Race.DRAGON],
			possibleCards: possibleCards,
		};
	},
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			SwampDragonEgg.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.DRAGON),
			input.inputOptions,
		);
	},
};
