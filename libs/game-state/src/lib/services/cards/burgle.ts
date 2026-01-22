/* eslint-disable no-mixed-spaces-and-tabs */
// Burgle (AT_033, WON_071)
// "Get 3 random cards (from your opponent's class)."
import { CardIds } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const Burgle: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Burgle_AT_033, CardIds.Burgle_WON_071],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const opponentClass =
			input.inputOptions.opponentDeckState.hero?.initialClasses?.[0] ??
			input.inputOptions.opponentDeckState.hero?.classes?.[0] ??
			null;
		return filterCards(
			Burgle.cardIds[0],
			input.allCards,
			(c) => hasCorrectClass(c, opponentClass),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const opponentClass =
			input.opponentDeckState?.hero?.initialClasses?.[0] ?? input.opponentDeckState?.hero?.classes?.[0] ?? null;
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
