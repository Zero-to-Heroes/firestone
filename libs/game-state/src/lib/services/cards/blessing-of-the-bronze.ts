/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/common/service';
import { GuessedInfo } from '../../models/deck-card';
import { fromAnotherClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const BlessingOfTheBronze: GeneratingCard & StaticGeneratingCard = {
	cardIds: [TempCardIds.BlessingOfTheBronze as unknown as CardIds],
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
