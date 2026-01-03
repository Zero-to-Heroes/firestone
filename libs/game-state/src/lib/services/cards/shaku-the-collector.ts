/* eslint-disable no-mixed-spaces-and-tabs */
// Shaku, the Collector
// Stealth. Whenever this attacks, add a random card to your hand (from your opponent's class).
import { CardClass, CardIds } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const ShakuTheCollector: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.ShakuTheCollector_CORE_CFM_781, CardIds.ShakuTheCollector],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const opponentClassStr = input.inputOptions.opponentDeckState.getCurrentClass();
		const opponentClass = opponentClassStr ? (CardClass[opponentClassStr as keyof typeof CardClass] ?? null) : null;
		return filterCards(
			ShakuTheCollector.cardIds[0],
			input.allCards,
			(c) => hasCorrectClass(c, opponentClass),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const opponentClassStr = input.opponentDeckState?.getCurrentClass();
		const opponentClass = opponentClassStr ? (CardClass[opponentClassStr as keyof typeof CardClass] ?? null) : null;
		const possibleCards = filterCards(
			ShakuTheCollector.cardIds[0],
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
