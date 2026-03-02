/* eslint-disable no-mixed-spaces-and-tabs */
import { CardClass, CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const SwampqueenHagatha: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.SwampqueenHagatha],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			SwampqueenHagatha.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.SPELL) && hasCorrectClass(c, CardClass.SHAMAN),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.SPELL,
			cardClasses: [CardClass.SHAMAN],
			possibleCards: filterCards(
				SwampqueenHagatha.cardIds[0],
				input.allCards,
				(c) => hasCorrectType(c, CardType.SPELL) && hasCorrectClass(c, CardClass.SHAMAN),
				input.options,
			),
		};
	},
};
