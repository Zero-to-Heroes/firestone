/* eslint-disable no-mixed-spaces-and-tabs */
import { CardClass, CardIds, CardType, GameTag, hasMechanic } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass, hasCorrectClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput } from './_card.type';
import { filterCards } from './utils';

export const ArcaneKeysmith: GeneratingCard = {
	cardIds: [CardIds.ArcaneKeysmith_GIL_116],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.SPELL,
			cardClasses: [CardClass.MAGE],
			possibleCards: filterCards(
				ArcaneKeysmith.cardIds[0],
				input.allCards,
				(c) =>
					hasCorrectType(c, CardType.SPELL) &&
					hasMechanic(c, GameTag.SECRET) &&
					hasCorrectClass(c, CardClass.MAGE) &&
					canBeDiscoveredByClass(c, CardClass[CardClass.MAGE]),
				input.options,
			),
		};
	},
};
