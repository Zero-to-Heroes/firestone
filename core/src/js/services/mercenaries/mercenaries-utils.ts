import { CardIds, GameType, TagRole } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '../cards-facade.service';
import { MercenariesReferenceData } from './mercenaries-state-builder.service';

export const normalizeMercenariesCardId = (
	cardId: string,
	fullNormalize = false,
	allCards: CardsFacadeService = null,
): string => {
	if (!cardId?.length) {
		return null;
	}
	const skinMatch = cardId.match(/.*_(\d\d)([ab]?)$/);
	if (skinMatch) {
		return cardId.replace(/(.*)(_\d\d)([ab]?)$/, '$1_01$3');
	}
	return cardId;
};

export const getMercCardLevel = (cardId: string): number => {
	if (!cardId) {
		return 0;
	}

	// Generic handling of mercenaries skins or levelling
	const skinMatch = cardId.match(/.*_(\d\d)/);
	if (skinMatch) {
		return parseInt(skinMatch[1]);
	}
	return 0;
};

export const getMercLevelFromExperience = (totalXp: number, referenceData: MercenariesReferenceData): number => {
	if (!referenceData?.mercenaryLevels?.length) {
		return 0;
	}

	let currentLevel = 0;
	for (const levelMapping of referenceData.mercenaryLevels) {
		if (levelMapping.xpToNext > totalXp) {
			break;
		}
		currentLevel++;
	}
	return Math.max(1, currentLevel);
};

export const getHeroRole = (roleFromEnum: string): 'caster' | 'fighter' | 'protector' => {
	switch (roleFromEnum) {
		case TagRole[TagRole.CASTER]:
			return 'caster';
		case TagRole[TagRole.FIGHTER]:
			return 'fighter';
		case TagRole[TagRole.TANK]:
			return 'protector';
		case TagRole[TagRole.NEUTRAL]:
		case TagRole[TagRole.INVALID]:
		case undefined:
		case null:
			return null;
		default:
			console.error('Invalid role passed', roleFromEnum);
			return null;
	}
};

export const isMercenaries = (gameType: GameType | string): boolean => {
	return (
		gameType === GameType.GT_MERCENARIES_AI_VS_AI ||
		gameType === GameType.GT_MERCENARIES_FRIENDLY ||
		gameType === GameType.GT_MERCENARIES_PVP ||
		gameType === GameType.GT_MERCENARIES_PVE ||
		gameType === GameType.GT_MERCENARIES_PVE_COOP ||
		gameType === 'mercenaries-ai-vs-ai' ||
		gameType === 'mercenaries-friendly' ||
		gameType === 'mercenaries-pvp' ||
		gameType === 'mercenaries-pve' ||
		gameType === 'mercenaries-pve-coop'
	);
};

export const isMercenariesPvP = (gameType: GameType | string): boolean => {
	return gameType === GameType.GT_MERCENARIES_PVP || gameType === 'mercenaries-pvp';
};

export const isMercenariesPvE = (gameType: GameType | string): boolean => {
	return (
		gameType === GameType.GT_MERCENARIES_PVE ||
		gameType === GameType.GT_MERCENARIES_PVE_COOP ||
		gameType === 'mercenaries-pve' ||
		gameType === 'mercenaries-pve-coop'
	);
};

export const BUFF_SPEED_MODIFIER_ENCHANTMENTS = [
	CardIds.AmuletOfSwiftnessLettuceEnchantment,
	CardIds.HeatingUpLettuceEnchantment,
	CardIds.ManaBlinkLettuceEnchantment,
	CardIds.EnduranceAuraLettuceEnchantment2, // 1 is the taunt
	CardIds.EnduranceAuraLettuceEnchantment3,
	CardIds.CenarionSurgeLettuceEnchantment,
	CardIds.ElunesGraceLettuceEnchantment,
	CardIds.HammerOfJusticeLettuceEnchantment,
	CardIds.HeroicLeapLettuceEnchantment,
	CardIds.RingOfHasteLettuceEnchantment,
	CardIds.ProtectorHasteLettuceEnchantment,
	CardIds.FighterHasteLettuceEnchantment,
	CardIds.CasterHasteLettuceEnchantment,
];

export const DEBUFF_SPEED_MODIFIER_ENCHANTMENTS = [
	CardIds.MuddyFootingLettuceEnchantment,
	CardIds.EarthStompLettuceEnchantment,
	CardIds.DoomedLettuceEnchantment,
	CardIds.StaggeredLettuceEnchantment,
	CardIds.EmeraldRootsLettuceEnchantment,
	CardIds.FrostbiteLettuceEnchantment,
	CardIds.FlurryLettuceEnchantment,
	CardIds.ShadowShockLettuceEnchantment,
];
