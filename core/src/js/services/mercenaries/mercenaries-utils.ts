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
		case CardIds.CairneBloodhoofLettuce1:
		case CardIds.CairneBloodhoofLettuce2:
		case CardIds.CairneBloodhoofLettuce3:
		case CardIds.JainaProudmooreLettuce1:
		case CardIds.JainaProudmooreLettuce2:
		case CardIds.JainaProudmooreLettuce3:
		case CardIds.NatalieSelineLettuce1:
		case CardIds.NatalieSelineLettuce2:
		case CardIds.NatalieSelineLettuce3:
		case CardIds.TavishStormpikeLettuce1:
		case CardIds.TavishStormpikeLettuce2:
		case CardIds.TavishStormpikeLettuce3:
		case CardIds.VardenDawngraspLettuce1:
		case CardIds.VardenDawngraspLettuce2:
		case CardIds.VardenDawngraspLettuce3:
			return fullName.split(' ').shift();
		case CardIds.BlademasterSamuroLettuce1:
		case CardIds.BlademasterSamuroLettuce2:
		case CardIds.BlademasterSamuroLettuce3:
		case CardIds.WarMasterVooneLettuce1:
		case CardIds.WarMasterVooneLettuce2:
		case CardIds.WarMasterVooneLettuce3:
			return fullName.split(' ').pop();
		case CardIds.TheLichKingLettuce1:
		case CardIds.TheLichKingLettuce2:
		case CardIds.TheLichKingLettuce3:
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
	CardIds.AmuletOfSwiftnessLettuceEnchantment,
	CardIds.CenarionSurgeLettuceEnchantment,
	CardIds.CasterHasteLettuceEnchantment,
	CardIds.DreadbladesLettuceEnchantment,
	CardIds.ElunesGraceLettuceEnchantment,
	CardIds.EnduranceAuraLettuceEnchantment2, // 1 is the taunt
	CardIds.EnduranceAuraLettuceEnchantment3,
	CardIds.FanOfKnivesLettuceEnchantment, // Check that it's the correct card ID
	CardIds.FighterHasteLettuceEnchantment,
	CardIds.HammerOfJusticeLettuceEnchantment,
	CardIds.HeatingUpLettuceEnchantment,
	CardIds.HeroicLeapLettuceEnchantment,
	CardIds.ManaBlinkLettuceEnchantment,
	CardIds.ProtectorHasteLettuceEnchantment,
	CardIds.RingOfHasteLettuceEnchantment,
	// CardIds.ShadowDaggerLettuceEnchantment,
	CardIds.UnnaturalSmokeLettuceEnchantment,
	CardIds.BootsOfHasteLettuceEnchantment,
];

export const DEBUFF_SPEED_MODIFIER_ENCHANTMENTS = [
	CardIds.DoomedLettuceEnchantment,
	CardIds.EarthStompLettuceEnchantment,
	CardIds.EmeraldRootsLettuceEnchantment,
	CardIds.FlurryLettuceEnchantment,
	CardIds.FrostbiteLettuceEnchantment,
	CardIds.MuddyFootingLettuceEnchantment,
	CardIds.ShadowShockLettuceEnchantment,
	CardIds.StaggeredLettuceEnchantment,
	CardIds.ThunderStruckLettuceEnchantment,
];
