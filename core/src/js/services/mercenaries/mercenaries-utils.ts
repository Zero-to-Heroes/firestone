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
	let skinMatch = cardId.match(/.*_(\d\d)([ab]?)$/);
	if (skinMatch) {
		return cardId.replace(/(.*)(_\d\d)([ab]?)$/, '$1_01$3');
	}
	// Sometimes it is 01, sometimes 001
	skinMatch = cardId.match(/.*_(\d\d\d)([ab]?)$/);
	if (skinMatch) {
		return cardId.replace(/(.*)(_\d\d\d)([ab]?)$/, '$1_001$3');
	}
	return cardId;
};

export const getMercCardLevel = (cardId: string): number => {
	if (!cardId) {
		return 0;
	}

	// Generic handling of mercenaries skins or levelling
	const skinMatch = cardId.match(/.*_(\d+)/);
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

// TODO translate
export const getShortMercHeroName = (cardId: string, allCards: CardsFacadeService): string => {
	const fullName = allCards.getCard(cardId).name;
	switch (cardId) {
		case CardIds.CairneBloodhoofLettuce_LETL_034H_01:
		case CardIds.CairneBloodhoofLettuce_LETL_034H_02:
		case CardIds.CairneBloodhoofLettuce_LETL_034H_03:
		case CardIds.JainaProudmooreLettuce_SWL_25H_01:
		case CardIds.JainaProudmooreLettuce_SWL_25H_02:
		case CardIds.JainaProudmooreLettuce_SWL_25H_03:
		case CardIds.NatalieSelineLettuce_LETL_011H_01:
		case CardIds.NatalieSelineLettuce_LETL_011H_02:
		case CardIds.NatalieSelineLettuce_LETL_011H_03:
		case CardIds.TavishStormpikeLettuce_LETL_039H_01:
		case CardIds.TavishStormpikeLettuce_LETL_039H_02:
		case CardIds.TavishStormpikeLettuce_LETL_039H_03:
		case CardIds.TavishStormpikeLettuce_LETL_039H_04:
		case CardIds.VardenDawngraspLettuce_LETL_017H_01:
		case CardIds.VardenDawngraspLettuce_LETL_017H_02:
		case CardIds.VardenDawngraspLettuce_LETL_017H_03:
			return fullName.split(' ').shift();
		case CardIds.BlademasterSamuroLettuce_BARL_024H_01:
		case CardIds.BlademasterSamuroLettuce_BARL_024H_02:
		case CardIds.BlademasterSamuroLettuce_BARL_024H_03:
		case CardIds.WarMasterVooneLettuce_BARL_009H_01:
		case CardIds.WarMasterVooneLettuce_BARL_009H_02:
		case CardIds.WarMasterVooneLettuce_BARL_009H_03:
			return fullName.split(' ').pop();
		case CardIds.TheLichKingLettuce_LETL_041H_01:
		case CardIds.TheLichKingLettuce_LETL_041H_02:
		case CardIds.TheLichKingLettuce_LETL_041H_03:
			return 'Lich King';
		default:
			return fullName;
	}
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
	// CardIds.AdventurersPackLettuceEnchantment,
	CardIds.AmuletOfSwiftnessLettuceEnchantment,
	CardIds.BootsOfHasteLettuceEnchantment,
	CardIds.CenarionSurgeLettuceEnchantment,
	CardIds.CasterHasteLettuceEnchantment,
	CardIds.DreadbladesLettuceEnchantment,
	// CardIds.ElunesGraceLettuceEnchantment,
	CardIds.EnduranceAuraLettuceEnchantment_LETL_319e2, // 1 is the taunt
	CardIds.EnduranceAuraLettuceEnchantment_LETL_319e3,
	CardIds.FanOfKnivesLettuceEnchantment, // Check that it's the correct card ID
	CardIds.FighterHasteLettuceEnchantment,
	CardIds.HammerOfJusticeLettuceEnchantment,
	CardIds.HeatingUpLettuceEnchantment,
	CardIds.HeroicLeapLettuceEnchantment,
	CardIds.ManaBlinkLettuceEnchantment,
	CardIds.ProtectorHasteLettuceEnchantment,
	CardIds.RingOfHasteLettuceEnchantment,
	CardIds.SlipperyWhenWetLettuceEnchantment_LT23_024E2e2,
	CardIds.StringOfFateLettuceEnchantment,
	CardIds.UnnaturalSmokeLettuceEnchantment,
];

export const DEBUFF_SPEED_MODIFIER_ENCHANTMENTS = [
	CardIds.DoomedLettuceEnchantment,
	CardIds.EarthStompLettuceEnchantment,
	CardIds.EmeraldRootsLettuceEnchantment,
	CardIds.FlurryLettuceEnchantment,
	CardIds.FrostbiteLettuceEnchantment,
	CardIds.MuddyFootingLettuceEnchantment,
	// CardIds.RingOfSluggishnessLettuceEnchantment,
	CardIds.ShadowShockLettuceEnchantment,
	CardIds.StaggeredLettuceEnchantment,
	CardIds.ThunderStruckLettuceEnchantment,
	CardIds.VaingloriousRebukeLettuceEnchantment,
];
