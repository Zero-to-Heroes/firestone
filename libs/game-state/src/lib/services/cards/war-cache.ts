/* eslint-disable no-mixed-spaces-and-tabs */
import { CardClass, CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput } from './_card.type';
import { filterCards } from './utils';

export const WarCache: GeneratingCard = {
	cardIds: [CardIds.WarCache, CardIds.WarCacheLegacy],
	hasSequenceInfo: true,
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		if (input.card.createdIndex === 0) {
			return {
				cardType: CardType.MINION,
				cardClasses: [CardClass.WARRIOR],
				possibleCards: filterCards(
					WarCache.cardIds[0],
					input.allCards,
					(c) => hasCorrectType(c, CardType.MINION) && hasCorrectClass(c, CardClass.WARRIOR),
					input.options,
				),
			};
		} else if (input.card.createdIndex === 1) {
			return {
				cardType: CardType.SPELL,
				cardClasses: [CardClass.WARRIOR],
				possibleCards: filterCards(
					WarCache.cardIds[0],
					input.allCards,
					(c) => hasCorrectType(c, CardType.SPELL) && hasCorrectClass(c, CardClass.WARRIOR),
					input.options,
				),
			};
		} else if (input.card.createdIndex === 2) {
			return {
				cardType: CardType.WEAPON,
				cardClasses: [CardClass.WARRIOR],
				possibleCards: filterCards(
					WarCache.cardIds[0],
					input.allCards,
					(c) => hasCorrectType(c, CardType.WEAPON) && hasCorrectClass(c, CardClass.WARRIOR),
					input.options,
				),
			};
		}
		return null;
	},
};
