/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { fromAnotherClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const BlessingOfTheBronze: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Eventuality_BlessingOfTheBronze_END_000p],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			BlessingOfTheBronze.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && fromAnotherClass(c, input.deckState.getCurrentClass()),
			input.options,
		);
		return {
			cardType: CardType.MINION,
			possibleCards: possibleCards,
		};
	},
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			BlessingOfTheBronze.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && fromAnotherClass(c, input.inputOptions.currentClass),
			input.inputOptions,
		);
	},
};
