/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const BlinkFox: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.BlinkFox_GIL_827],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const opponentClass =
			input.inputOptions.opponentDeckState.hero?.initialClasses?.[0] ??
			input.inputOptions.opponentDeckState.hero?.classes?.[0] ??
			null;
		return filterCards(
			BlinkFox.cardIds[0],
			input.allCards,
			(c) => hasCorrectClass(c, opponentClass),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const opponentClass =
			input.opponentDeckState?.hero?.initialClasses?.[0] ?? input.opponentDeckState?.hero?.classes?.[0] ?? null;
		const possibleCards = filterCards(
			BlinkFox.cardIds[0],
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
