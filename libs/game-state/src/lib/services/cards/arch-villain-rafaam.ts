// Arch-Villain Rafaam (DAL_422 / CORE_DAL_422)
// Taunt. Battlecry: Replace your hand and deck with Legendary minions.
import { CardIds, CardRarity, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput } from './_card.type';

export const ArchVillainRafaam: GeneratingCard = {
	cardIds: [CardIds.ArchVillainRafaam_DAL_422, CardIds.ArchVillainRafaam_CORE_DAL_422],
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.MINION,
			rarity: CardRarity.LEGENDARY,
		};
	},
};
