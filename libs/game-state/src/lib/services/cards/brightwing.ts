/* eslint-disable no-mixed-spaces-and-tabs */
// Brightwing (EX1_189 / CORE_EX1_189)
// "<b>Battlecry:</b> Add a random <b>Legendary</b> minion to your hand."
// The minion is added to hand (random, not discover), so it needs dynamicPool + guessInfo
import { CardIds, CardRarity, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectRarity, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const Brightwing: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.BrightwingLegacy, CardIds.Brightwing],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			Brightwing.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasCorrectRarity(c, CardRarity.LEGENDARY),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			Brightwing.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasCorrectRarity(c, CardRarity.LEGENDARY),
			input.options,
		);
		return {
			cardType: CardType.MINION,
			rarity: CardRarity.LEGENDARY,
			possibleCards: possibleCards,
		};
	},
};
