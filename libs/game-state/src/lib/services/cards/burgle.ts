/* eslint-disable no-mixed-spaces-and-tabs */
// Burgle (AT_033, WON_071)
// "Get 3 random cards (from your opponent's class)."
import { CardClass, CardIds } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const Burgle: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Burgle_AT_033, CardIds.Burgle_WON_071],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const opponentClassStr = input.inputOptions.opponentDeckState.getCurrentClass();
		const opponentClass = opponentClassStr ? CardClass[opponentClassStr] : null;
		return filterCards(
			Burgle.cardIds[0],
			input.allCards,
			(c) => hasCorrectClass(c, opponentClass),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const opponentClassStr = input.opponentDeckState?.getCurrentClass();
		const opponentClass = opponentClassStr ? CardClass[opponentClassStr] : null;
		const possibleCards = filterCards(
			Burgle.cardIds[0],
			input.allCards,
			(c) => hasCorrectClass(c, opponentClass),
			input.options,
		);
		return {
			cardClasses: opponentClass ? [opponentClass] : undefined,
			possibleCards: possibleCards,
		};
	},
};
