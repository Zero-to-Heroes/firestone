/* eslint-disable no-mixed-spaces-and-tabs */
// Runefueled Golem (TTN_714)
// 4 Mana, 4/4 Neutral Minion
// Battlecry: Discover a weapon from any class.
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const RunefueledGolem: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.RunefueledGolem],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			RunefueledGolem.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.WEAPON),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.WEAPON,
			possibleCards: filterCards(
				RunefueledGolem.cardIds[0],
				input.allCards,
				(c) => hasCorrectType(c, CardType.WEAPON),
				input.options,
			),
		};
	},
};
