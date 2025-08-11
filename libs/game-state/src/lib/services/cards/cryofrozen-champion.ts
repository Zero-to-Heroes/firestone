/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardRarity } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput } from './_card.type';

export const CryofrozenChampion: GeneratingCard = {
	cardIds: [CardIds.CryofrozenChampion_TIME_613],
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			rarity: CardRarity.LEGENDARY,
		};
	},
};
