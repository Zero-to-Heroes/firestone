/* eslint-disable no-mixed-spaces-and-tabs */
// Pandaren Importer (SW_065): 2 Mana 1/3 Neutral Minion
// "Battlecry: Discover a spell that didn't start in your deck."

import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const PandarenImporter: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.PandarenImporter],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const currentClass = input.inputOptions.currentClass;
		const initialDecklist = input.inputOptions.initialDecklist?.length
			? input.inputOptions.initialDecklist
			: input.inputOptions.deckState.getAllCardsFromStarterDeck()?.length
				? input.inputOptions.deckState.getAllCardsFromStarterDeck()?.map((c) => c.cardId)
				: [];
		return filterCards(
			PandarenImporter.cardIds[0],
			input.allCards,
			(c) =>
				hasCorrectType(c, CardType.SPELL) &&
				canBeDiscoveredByClass(c, currentClass) &&
				!initialDecklist.includes(c.id),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const currentClass = input.deckState.getCurrentClass();
		const initialDecklist = input.deckState.deckList?.length
			? input.deckState.deckList?.map((c) => c.cardId)
			: input.deckState.getAllCardsFromStarterDeck()?.length
				? input.deckState.getAllCardsFromStarterDeck()?.map((c) => c.cardId)
				: [];

		const possibleCards = filterCards(
			PandarenImporter.cardIds[0],
			input.allCards,
			(c) =>
				hasCorrectType(c, CardType.SPELL) &&
				canBeDiscoveredByClass(c, currentClass) &&
				!initialDecklist.includes(c.id),
			{ ...input.options, currentClass, initialDecklist },
		);
		return {
			cardType: CardType.SPELL,
			possibleCards: possibleCards,
		};
	},
};
