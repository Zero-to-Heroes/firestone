/* eslint-disable no-mixed-spaces-and-tabs */
// Dragon's Hoard (DRG_028): 1 Mana Rogue Spell
// "Discover a Legendary minion from another class."

import { CardIds, CardRarity, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { fromAnotherClass, hasCorrectRarity, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const DragonsHoard: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.DragonsHoard],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const currentClass = input.deckState.getCurrentClass();
		const possibleCards = filterCards(
			DragonsHoard.cardIds[0],
			input.allCards,
			(c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasCorrectRarity(c, CardRarity.LEGENDARY) &&
				fromAnotherClass(c, currentClass),
			input.options,
		);
		return {
			cardType: CardType.MINION,
			rarity: CardRarity.LEGENDARY,
			possibleCards: possibleCards,
		};
	},
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			DragonsHoard.cardIds[0],
			input.allCards,
			(c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasCorrectRarity(c, CardRarity.LEGENDARY) &&
				fromAnotherClass(c, input.inputOptions.currentClass),
			input.inputOptions,
		);
	},
};
