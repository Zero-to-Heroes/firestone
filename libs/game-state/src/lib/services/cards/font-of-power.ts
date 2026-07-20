/* eslint-disable no-mixed-spaces-and-tabs */
import { CardClass, CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const FontOfPower: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.FontOfPower_BT_021],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			FontOfPower.cardIds[0],
			input.allCards,
			(c) => hasCorrectClass(c, CardClass.MAGE) && hasCorrectType(c, CardType.MINION),
			input.options,
		);
		return {
			cardClasses: [CardClass.MAGE],
			cardType: CardType.MINION,
			possibleCards: possibleCards,
		};
	},
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			FontOfPower.cardIds[0],
			input.allCards,
			(c) => hasCorrectClass(c, CardClass.MAGE) && hasCorrectType(c, CardType.MINION),
			input.inputOptions,
		);
	},
};
