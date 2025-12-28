/* eslint-disable no-mixed-spaces-and-tabs */
import { CardClass, CardIds, CardRarity, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass, hasCorrectClass, hasCorrectRarity, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const TheSunwell: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.TheSunwell],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			TheSunwell.cardIds[0],
			input.allCards,
			(c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasCorrectRarity(c, CardRarity.LEGENDARY) &&
				hasCorrectClass(c, CardClass.PALADIN) &&
				canBeDiscoveredByClass(c, input.inputOptions.currentClass),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.MINION,
			rarity: CardRarity.LEGENDARY,
			cardClass: CardClass.PALADIN,
			possibleCards: filterCards(
				TheSunwell.cardIds[0],
				input.allCards,
				(c) =>
					hasCorrectType(c, CardType.MINION) &&
					hasCorrectRarity(c, CardRarity.LEGENDARY) &&
					hasCorrectClass(c, CardClass.PALADIN) &&
					canBeDiscoveredByClass(c, input.deckState.getCurrentClass()),
				input.options,
			),
		};
	},
};
