// Arch-Villain Rafaam (DAL_422 / CORE_DAL_422)
// Taunt. Battlecry: Replace your hand and deck with Legendary minions.
import { CardIds, CardRarity, CardType } from '@firestone-hs/reference-data';
import { hasCorrectRarity, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const ArchVillainRafaam: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.ArchVillainRafaam_DAL_422, CardIds.ArchVillainRafaam_CORE_DAL_422],
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.MINION,
			rarity: CardRarity.LEGENDARY,
		};
	},
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			ArchVillainRafaam.cardIds[0],
			input.allCards,
			(c) => hasCorrectRarity(c, CardRarity.LEGENDARY) && hasCorrectType(c, CardType.MINION),
			input.inputOptions,
		);
	},
};
