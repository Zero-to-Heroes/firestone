/* eslint-disable no-mixed-spaces-and-tabs */
// Swashburglar (KAR_069) / Swashburglar Core (CORE_KAR_069)
// 1-Cost 1/1 Rogue Minion
// "Battlecry: Add a random card from another class to your hand."
import { CardIds } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { fromAnotherClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const Swashburglar: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Swashburglar, CardIds.SwashburglarCore],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			Swashburglar.cardIds[0],
			input.allCards,
			(c) => fromAnotherClass(c, input.inputOptions.currentClass),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const currentClass = input.deckState.getCurrentClass();
		const possibleCards = filterCards(
			Swashburglar.cardIds[0],
			input.allCards,
			(c) => fromAnotherClass(c, currentClass),
			input.options,
		);
		return {
			possibleCards: possibleCards,
		};
	},
};
