/* eslint-disable no-mixed-spaces-and-tabs */
// Swashburglar (KAR_069) / Swashburglar Core (CORE_KAR_069)
// 1-Cost 1/1 Rogue Minion
// "Battlecry: Add a random card to your hand (from your opponent's class)."
import { CardClass, CardIds } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const Swashburglar: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Swashburglar, CardIds.SwashburglarCore],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const opponentClassStr = input.inputOptions.opponentDeckState.getCurrentClass();
		const opponentClass = opponentClassStr ? CardClass[opponentClassStr] : null;
		return filterCards(
			Swashburglar.cardIds[0],
			input.allCards,
			(c) => hasCorrectClass(c, opponentClass),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const opponentClassStr = input.opponentDeckState?.getCurrentClass();
		const opponentClass = opponentClassStr ? CardClass[opponentClassStr] : null;
		const possibleCards = filterCards(
			Swashburglar.cardIds[0],
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
