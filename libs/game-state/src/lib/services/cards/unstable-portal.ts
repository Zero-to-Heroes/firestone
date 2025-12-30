/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { filterCards } from './utils';

export const UnstablePortal: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.UnstablePortal_GVG_003],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			UnstablePortal.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			UnstablePortal.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION),
			input.options,
		);
		return {
			cardType: CardType.MINION,
			possibleCards: possibleCards,
		};
	},
};
