import { CardIds, GameTag, GameType, TagRole } from '@firestone-hs/reference-data';
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
	// Some abilities (like Ysera's Emerald Oracle) have an id that finishes with an "a" for all levels
	// except the last one.
	// However, some other abilities (like Anathema / Benediction) share the same root id, and differ
	// only wiht a/b, so we need to keep the suffix
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
		case CardIds.BrannBronzebeardLettuce_LT23_031H_01:
		case CardIds.BrannBronzebeardLettuce_LT23_031H_02:
		case CardIds.BrannBronzebeardLettuce_LT23_031H_03:
		case CardIds.LokholarTheIceLordLettuce_LT22_005H_01:
		case CardIds.LokholarTheIceLordLettuce_LT22_005H_02:
		case CardIds.LokholarTheIceLordLettuce_LT22_005H_03:
		case CardIds.ValeeraSanguinarLettuce_LETL_019H_01:
		case CardIds.ValeeraSanguinarLettuce_LETL_019H_02:
		case CardIds.ValeeraSanguinarLettuce_LETL_019H_03:
		case CardIds.TrigoreTheLasherLettuce_BARL_015H_01:
		case CardIds.TrigoreTheLasherLettuce_BARL_015H_02:
		case CardIds.TrigoreTheLasherLettuce_BARL_015H_03:
		case CardIds.BalindaStonehearthLettuce_LT22_002H_01:
		case CardIds.BalindaStonehearthLettuce_LT22_002H_02:
		case CardIds.BalindaStonehearthLettuce_LT22_002H_03:
		case CardIds.RenoJacksonLettuce_LT23_030H_01:
		case CardIds.RenoJacksonLettuce_LT23_030H_02:
		case CardIds.RenoJacksonLettuce_LT23_030H_03:
		case CardIds.SylvanasWindrunnerLettuce_LETL_001H_01:
		case CardIds.SylvanasWindrunnerLettuce_LETL_001H_02:
		case CardIds.SylvanasWindrunnerLettuce_LETL_001H_03:
		case CardIds.BaineBloodhoofLettuce_LT23_034H_01:
		case CardIds.BaineBloodhoofLettuce_LT23_034H_02:
		case CardIds.BaineBloodhoofLettuce_LT23_034H_03:
		case CardIds.EliseStarseekerLettuce_LT23_032H_01:
		case CardIds.EliseStarseekerLettuce_LT23_032H_02:
		case CardIds.EliseStarseekerLettuce_LT23_032H_03:
		case CardIds.VanndarStormpikeLettuce_LT22_001H_01:
		case CardIds.VanndarStormpikeLettuce_LT22_001H_02:
		case CardIds.VanndarStormpikeLettuce_LT22_001H_03:
		case CardIds.LeeroyJenkinsLettuce_LT22_015H_01:
		case CardIds.LeeroyJenkinsLettuce_LT22_015H_02:
		case CardIds.LeeroyJenkinsLettuce_LT22_015H_03:
		case CardIds.GuffRunetotemLettuce_LETL_036H_01:
		case CardIds.GuffRunetotemLettuce_LETL_036H_02:
		case CardIds.GuffRunetotemLettuce_LETL_036H_03:
		case CardIds.KurtrusAshfallenLettuce_LETL_007H_01:
		case CardIds.KurtrusAshfallenLettuce_LETL_007H_02:
		case CardIds.KurtrusAshfallenLettuce_LETL_007H_03:
		case CardIds.TyrandeWhisperwindLettuce_BARL_016H_01:
		case CardIds.TyrandeWhisperwindLettuce_BARL_016H_02:
		case CardIds.TyrandeWhisperwindLettuce_BARL_016H_03:
		case CardIds.TyrandeWhisperwindLettuce_BARL_016H_04:
			return fullName.split(' ').shift();
		case CardIds.EdwinDefiasKingpinLettuce_LT21_01H_01:
		case CardIds.EdwinDefiasKingpinLettuce_LT21_01H_02:
		case CardIds.EdwinDefiasKingpinLettuce_LT21_01H_03:
			return fullName.split(',').shift();
		case CardIds.BlademasterSamuroLettuce_BARL_024H_01:
		case CardIds.BlademasterSamuroLettuce_BARL_024H_02:
		case CardIds.BlademasterSamuroLettuce_BARL_024H_03:
		case CardIds.WarMasterVooneLettuce_BARL_009H_01:
		case CardIds.WarMasterVooneLettuce_BARL_009H_02:
		case CardIds.WarMasterVooneLettuce_BARL_009H_03:
		case CardIds.SkyAdmiralRogersLettuce_LT21_07H_01:
		case CardIds.SkyAdmiralRogersLettuce_LT21_07H_02:
		case CardIds.SkyAdmiralRogersLettuce_LT21_07H_03:
		case CardIds.TidemistressAthissaLettuce_LT23_018H_01:
		case CardIds.TidemistressAthissaLettuce_LT23_018H_02:
		case CardIds.TidemistressAthissaLettuce_LT23_018H_03:
		case CardIds.LorewalkerChoLettuce_LT23_036H_01:
		case CardIds.LorewalkerChoLettuce_LT23_036H_02:
		case CardIds.LorewalkerChoLettuce_LT23_036H_03:
		case CardIds.QueenAzsharaLettuce_LT23_016H_01:
		case CardIds.QueenAzsharaLettuce_LT23_016H_02:
		case CardIds.QueenAzsharaLettuce_LT23_016H_03:
		case CardIds.LadyAnacondraLettuce_BARL_007H_01:
		case CardIds.LadyAnacondraLettuce_BARL_007H_02:
		case CardIds.LadyAnacondraLettuce_BARL_007H_03:
		case CardIds.LadyVashjLettuce_LT23_021H_01:
		case CardIds.LadyVashjLettuce_LT23_021H_02:
		case CardIds.LadyVashjLettuce_LT23_021H_03:
		case CardIds.KingMuklaLettuce_LETL_038H_01:
		case CardIds.KingMuklaLettuce_LETL_038H_02:
		case CardIds.KingMuklaLettuce_LETL_038H_03:
		case CardIds.KingKrushLettuce_LETL_037H_01:
		case CardIds.KingKrushLettuce_LETL_037H_02:
		case CardIds.KingKrushLettuce_LETL_037H_03:
			return fullName.split(' ').pop();
		case CardIds.TheLichKingLettuce_LETL_041H_01:
		case CardIds.TheLichKingLettuce_LETL_041H_02:
		case CardIds.TheLichKingLettuce_LETL_041H_03:
			return fullName == 'The Lich King' ? 'Lich King' : fullName;
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

export const isPassiveMercsTreasure = (cardId: string, allCards: CardsFacadeService): boolean => {
	const refCard = allCards.getCard(cardId);
	return (
		refCard?.mercenaryPassiveAbility ||
		// For Start of game effects
		refCard.mechanics?.includes(GameTag[GameTag.HIDE_STATS]) ||
		refCard.mechanics?.includes(GameTag[GameTag.START_OF_GAME])
	);
};

export const BUFF_SPEED_MODIFIER_ENCHANTMENTS = [
	// CardIds.AdventurersPackLettuceEnchantment,
	CardIds.AmuletOfSwiftnessLettuceEnchantment,
	CardIds.BootsOfHasteLettuceEnchantment,
	CardIds.CenarionSurgeLettuceEnchantment,
	CardIds.CasterHasteLettuceEnchantment,
	CardIds.DealOfTime_DontWasteItLettuceEnchantment,
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
	CardIds.RainOfChaosLettuceEnchantment,
	CardIds.RingOfHasteLettuceEnchantment,
	CardIds.SlipperyWhenWetLettuceEnchantment_LT23_024E2e2,
	CardIds.StringOfFateLettuceEnchantment,
	CardIds.UnnaturalSmokeLettuceEnchantment,
];

export const DEBUFF_SPEED_MODIFIER_ENCHANTMENTS = [
	CardIds.OffBalanceLettuceEnchantment,
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
	// CardIds.ThreeMovesAheadLettuceEnchantment,
	CardIds.VaingloriousRebukeLettuceEnchantment,
];
