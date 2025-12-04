/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardRarity, CardType, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { AllCardsService } from '@firestone-hs/reference-data';
import { filterCards } from './utils';
import { hasCorrectClass, hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';

export const UndercityHuckster: GeneratingCard & StaticGeneratingCard = {
	cardIds: [
		CardIds.UndercityHuckster_OG_330,
		CardIds.UndercityHuckster_CORE_OG_330,
		CardIds.UndercityHuckster_WON_317,
	],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const opponentClass =
			input.inputOptions.opponentDeckState.hero?.initialClasses?.[0] ??
			input.inputOptions.opponentDeckState.hero?.classes?.[0] ??
			null;
		return filterCards(
			UndercityHuckster.cardIds[0],
			input.allCards,
			(c) => hasCorrectClass(c, opponentClass),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const opponentClass =
			input.opponentDeckState?.hero?.initialClasses?.[0] ?? input.opponentDeckState?.hero?.classes?.[0] ?? null;
		const possibleCards = filterCards(
			UndercityHuckster.cardIds[0],
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
