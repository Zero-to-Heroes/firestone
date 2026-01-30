/**
 * Shared excavate treasure utilities used by both the excavate counter
 * and dynamic pools for showing excavate card pools in hand.
 */
import {
	CardClass,
	CardIds,
	EXCAVATE_TREASURE_1_IDS,
	EXCAVATE_TREASURE_2_IDS,
	EXCAVATE_TREASURE_3_IDS,
} from '@firestone-hs/reference-data';

/**
 * Returns the excavate treasures for a given tier.
 * Tiers 1-3 return static treasure pools.
 * Tier 4 returns class-specific legendary treasures.
 */
export const buildExcavateTreasures = (tier: number, playerClasses: readonly CardClass[]): readonly string[] => {
	switch (tier) {
		case 1:
			return EXCAVATE_TREASURE_1_IDS;
		case 2:
			return EXCAVATE_TREASURE_2_IDS;
		case 3:
			return EXCAVATE_TREASURE_3_IDS;
		case 4:
			return playerClasses
				.map((playerClass) => getTier4ExcavateTreasure(playerClass))
				.filter((id) => !!id) as readonly string[];
		default:
			return [];
	}
};

/**
 * Returns the class-specific tier 4 excavate treasure for a given player class.
 */
export const getTier4ExcavateTreasure = (playerClass: CardClass): string | undefined => {
	switch (playerClass) {
		case CardClass.DEATHKNIGHT:
			return CardIds.KoboldMiner_TheAzeriteRatToken_WW_001t26;
		case CardClass.MAGE:
			return CardIds.KoboldMiner_TheAzeriteHawkToken_WW_001t24;
		case CardClass.ROGUE:
			return CardIds.KoboldMiner_TheAzeriteScorpionToken_WW_001t23;
		case CardClass.WARLOCK:
			return CardIds.KoboldMiner_TheAzeriteSnakeToken_WW_001t25;
		case CardClass.WARRIOR:
			return CardIds.KoboldMiner_TheAzeriteOxToken_WW_001t27;
		case CardClass.SHAMAN:
			return CardIds.TheAzeriteMurlocToken_DEEP_999t5;
		case CardClass.PALADIN:
			return CardIds.TheAzeriteDragonToken_DEEP_999t4;
		default:
			return undefined;
	}
};
