import { BoosterType } from '@firestone-hs/reference-data';

export const EXCLUDED_BOOSTER_IDS = [
	BoosterType.CLASSIC_1,
	BoosterType.WELCOME_BUNDLE_1,
	BoosterType.WELCOME_BUNDLE,
	BoosterType.MAMMOTH_BUNDLE,
	BoosterType.WAILING_CAVERNS,
	BoosterType.PATH_OF_ARTHAS,
	BoosterType.WAILING_CAVERNS,
	BoosterType.DRAFT_HERO,
	BoosterType.DRAFT_COMMON,
	BoosterType.DRAFT_RARE,
	BoosterType.DRAFT_HERO_POWER,
	BoosterType.EPIC_PACK,
];

export const GOLDEN_SET_PACKS = [
	BoosterType.GOLDEN_SCHOLOMANCE,
	BoosterType.GOLDEN_DARKMOON_FAIRE,
	BoosterType.GOLDEN_THE_BARRENS,
	BoosterType.STORMWIND_GOLDEN,
	BoosterType.GOLDEN_THE_SUNKEN_CITY,
	BoosterType.ALTERAC_VALLEY_GOLDEN,
	BoosterType.GOLDEN_REVENDRETH,
	BoosterType.GOLDEN_RETURN_OF_THE_LICH_KING,
	BoosterType.GOLDEN_BATTLE_OF_THE_BANDS,
	BoosterType.GOLDEN_TITANS,
	BoosterType.GOLDEN_CAVERNS_OF_TIME,
	BoosterType.GOLDEN_WILD_WEST,
	BoosterType.GOLDEN_WHIZBANGS_WORKSHOP,
	BoosterType.GOLDEN_ISLAND_VACATION,
	BoosterType.GOLDEN_THE_GREAT_DARK_BEYOND,
	BoosterType.GOLDEN_ASHES_OF_OUTLAND,
	BoosterType.GOLDEN_INTO_THE_EMERALD_DREAM,
];

export const GOLDEN_YEAR_PACKS = [BoosterType.GOLDEN_YEAR_OF_THE_PHOENIX, BoosterType.GOLDEN_YEAR_OF_THE_PEGASUS];

export const GOLDEN_FORMAT_PACKS = [
	BoosterType.GOLDEN_CLASSIC,
	BoosterType.GOLDEN_STANDARD_PACK,
	BoosterType.GOLDEN_WILD_PACK,
];

export const CLASS_PACKS = [
	BoosterType.STANDARD_DEATHKNIGHT,
	BoosterType.STANDARD_DEMONHUNTER,
	BoosterType.STANDARD_DRUID,
	BoosterType.STANDARD_HUNTER,
	BoosterType.STANDARD_MAGE,
	BoosterType.STANDARD_PALADIN,
	BoosterType.STANDARD_PRIEST,
	BoosterType.STANDARD_ROGUE,
	BoosterType.STANDARD_SHAMAN,
	BoosterType.STANDARD_WARRIOR,
	BoosterType.STANDARD_WARLOCK,
];

export const YEAR_PACKS = [BoosterType.YEAR_OF_DRAGON, BoosterType.YEAR_OF_PHOENIX, BoosterType.YEAR_OF_THE_PEGASUS];

export const NON_BUYABLE_BOOSTER_IDS = [
	...GOLDEN_SET_PACKS,
	...CLASS_PACKS,
	...YEAR_PACKS,
	...GOLDEN_FORMAT_PACKS,
	...GOLDEN_YEAR_PACKS,
];
export const CATCH_UP_PACK_IDS = [
	BoosterType.WILD_WEST2,
	BoosterType.WHIZBANG_CATCH_UP,
	BoosterType.ISLAND_VACATION_CATCH_UP,
	BoosterType.THE_GREAT_DARK_BEYOND_CATCH_UP,
	BoosterType.INTO_THE_EMERALD_DREAM_CATCH_UP,
];
