/* eslint-disable no-mixed-spaces-and-tabs */
// Enthrall (CATA_190t13)
// "Shuffle five random Legendary Dragons into your deck. They cost (1)."
import { CardIds, CardRarity, CardType, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectRarity, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const Enthrall: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.EnthrallToken_CATA_190t13],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			Enthrall.cardIds[0],
			input.allCards,
			(c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasCorrectRarity(c, CardRarity.LEGENDARY) &&
				hasCorrectTribe(c, Race.DRAGON),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.MINION,
			rarity: CardRarity.LEGENDARY,
			cost: { cost: 1, comparison: '==' },
			possibleCards: filterCards(
				Enthrall.cardIds[0],
				input.allCards,
				(c) =>
					hasCorrectType(c, CardType.MINION) &&
					hasCorrectRarity(c, CardRarity.LEGENDARY) &&
					hasCorrectTribe(c, Race.DRAGON),
				input.options,
			),
		};
	},
};
