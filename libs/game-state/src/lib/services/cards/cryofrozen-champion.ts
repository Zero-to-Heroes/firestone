/* eslint-disable no-mixed-spaces-and-tabs */
// Cryofrozen Champion (TIME_613): 1 Mana Neutral Minion (2/1)
// "Deathrattle: Get a random Legendary minion. Reduce its Cost by (1)."
import { CardIds, CardRarity, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput } from './_card.type';

export const CryofrozenChampion: GeneratingCard = {
	cardIds: [CardIds.CryofrozenChampion_TIME_613],
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.MINION,
			rarity: CardRarity.LEGENDARY,
		};
	},
};
