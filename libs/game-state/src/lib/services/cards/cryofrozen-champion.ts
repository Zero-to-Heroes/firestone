/* eslint-disable no-mixed-spaces-and-tabs */
// Cryofrozen Champion (TIME_613): 1 Mana Neutral Minion (2/1)
// "Deathrattle: Get a random Legendary minion. Reduce its Cost by (1)."
import { CardIds, CardRarity, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectRarity, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCorrectRarity(c, CardRarity.LEGENDARY);

export const CryofrozenChampion: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.CryofrozenChampion_TIME_613],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(CryofrozenChampion.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.MINION,
			rarity: CardRarity.LEGENDARY,
			possibleCards: filterCards(CryofrozenChampion.cardIds[0], input.allCards, isMatch, input.options),
		};
	},
};
