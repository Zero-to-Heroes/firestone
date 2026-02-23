/* eslint-disable no-mixed-spaces-and-tabs */
// Lilian Voss (ICC_811, CORE_ICC_811) - Battlecry: Replace spells in your hand with random spells (from your opponent's class).
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const LilianVoss: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.LilianVoss_ICC_811, CardIds.LilianVoss_CORE_ICC_811],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const opponentClass =
			input.inputOptions.opponentDeckState.hero?.initialClasses?.[0] ??
			input.inputOptions.opponentDeckState.hero?.classes?.[0] ??
			null;
		return filterCards(
			LilianVoss.cardIds[0],
			input.allCards,
			(c) => hasCorrectClass(c, opponentClass) && hasCorrectType(c, CardType.SPELL),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const opponentClass =
			input.opponentDeckState?.hero?.initialClasses?.[0] ?? input.opponentDeckState?.hero?.classes?.[0] ?? null;
		const possibleCards = filterCards(
			LilianVoss.cardIds[0],
			input.allCards,
			(c) => hasCorrectClass(c, opponentClass) && hasCorrectType(c, CardType.SPELL),
			input.options,
		);
		return {
			cardClasses: opponentClass ? [opponentClass] : undefined,
			cardType: CardType.SPELL,
			possibleCards: possibleCards,
		};
	},
};
