import {
	CardIds,
	CardType,
	GameType,
	Race,
	ReferenceCard,
	SceneMode,
	getEffectiveTribesEnum,
	getTribesForInclusion,
} from '@firestone-hs/reference-data';
import { BgsBattleInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-battle-info';
import { BgsBoardInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-board-info';
import { BattleInfoMessage } from '@firestone/battlegrounds/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { StatGameModeType } from '@firestone/stats/data-access';
import { VisualAchievement } from '../../models/visual-achievement';

/** @deprecated */
export const normalizeHeroCardId = (heroCardId: string, allCards: CardsFacadeService): string => {
	if (!heroCardId) {
		return heroCardId;
	}

	const normalizedAfterSkin = normalizeHeroCardIdAfterSkin(heroCardId, allCards);
	switch (normalizedAfterSkin) {
		case 'TB_BaconShop_HERO_59t':
			return 'TB_BaconShop_HERO_59';
		case CardIds.QueenAzshara_NagaQueenAzsharaToken:
			return CardIds.QueenAzshara_BG22_HERO_007;
		default:
			return normalizedAfterSkin;
	}
};

/** @deprecated */
const normalizeHeroCardIdAfterSkin = (heroCardId: string, allCards: CardsFacadeService): string => {
	const heroCard = allCards.getCard(heroCardId);
	if (!!heroCard?.battlegroundsHeroParentDbfId) {
		const parentCard = allCards.getCardFromDbfId(heroCard.battlegroundsHeroParentDbfId);
		if (!!parentCard) {
			return parentCard.id;
		}
	}
	// Fallback to regex
	const bgHeroSkinMatch = heroCardId.match(/(.*)_SKIN_.*/);
	if (bgHeroSkinMatch) {
		return bgHeroSkinMatch[1];
	}
	return heroCardId;
};

export const isBgsSpell = (card: ReferenceCard): boolean => {
	return card.type?.toUpperCase() === CardType[CardType.BATTLEGROUND_SPELL];
};

/** @deprecated */
export const getEffectiveTribes = (
	card: ReferenceCard,
	groupMinionsIntoTheirTribeGroup: boolean,
): readonly string[] => {
	const tribes: readonly Race[] = groupMinionsIntoTheirTribeGroup
		? getTribesForInclusion(card, true)
		: getEffectiveTribesEnum(card);
	return tribes.map((tribe) => Race[tribe]);
};

export const getAchievementsForHero = (
	heroCardId: string,
	heroAchievements: readonly VisualAchievement[],
	allCards: CardsFacadeService,
): readonly VisualAchievement[] => {
	const dbHero = allCards.getCard(heroCardId);
	const heroName = formatHeroNameForAchievements(dbHero);
	const sectionId = getAchievementSectionIdFromHeroCardId(heroCardId);
	if (!!sectionId) {
		return (heroAchievements ?? []).filter((ach) => ach.hsSectionId === sectionId);
	}

	if (!heroName) {
		return [];
	}
	// Doesn't work with localized data, but we should never be in that situation
	console.warn('missing section id for', heroCardId, heroName);
	const searchName = `as ${heroName}`;
	const result = (heroAchievements ?? []).filter((ach) => ach.text.replace(/,/g, '').includes(searchName));
	if (!result?.length) {
		console.warn('Could not load achievements for hero', heroCardId, searchName, heroAchievements);
	}
	return result;
};

export const getAchievementSectionIdFromHeroCardId = (heroCardId: string): number => {
	switch (heroCardId) {
		case CardIds.EdwinVancleef_TB_BaconShop_HERO_01:
			return 227;
		case CardIds.Galakrond:
			return 231;
		case CardIds.IllidanStormrage_TB_BaconShop_HERO_08:
			return 234;
		case CardIds.RagnarosTheFirelord_TB_BaconShop_HERO_11:
			return 254;
		case CardIds.TheRatKing_TB_BaconShop_HERO_12:
			return 266;
		case CardIds.QueenWagtoggle_TB_BaconShop_HERO_14:
			return 253;
		case CardIds.GeorgeTheFallen_TB_BaconShop_HERO_15:
			return 232;
		case CardIds.AFKay_TB_BaconShop_HERO_16:
			return 215;
		case CardIds.MillificentManastorm:
			return 244;
		case CardIds.PatchesThePirate_TB_BaconShop_HERO_18:
			return 250;
		case CardIds.TheGreatAkazamzarak:
			return 264;
		case CardIds.TheLichKing_TB_BaconShop_HERO_22:
			return 265;
		case CardIds.Shudderwock_TB_BaconShop_HERO_23:
			return 257;
		case CardIds.LichBazhial:
			return 238;
		case CardIds.Sindragosa_TB_BaconShop_HERO_27:
			return 259;
		case CardIds.InfiniteToki:
			return 235;
		case CardIds.TheCurator_TB_BaconShop_HERO_33:
			return 263;
		case CardIds.Patchwerk_TB_BaconShop_HERO_34:
			return 251;
		case CardIds.YoggSaronHopesEnd_TB_BaconShop_HERO_35:
			return 269;
		case CardIds.DancinDeryl:
			return 225;
		case CardIds.LordJaraxxus_TB_BaconShop_HERO_37:
			return 240;
		case CardIds.KingMukla_TB_BaconShop_HERO_38:
			return 246;
		case CardIds.Pyramad:
			return 252;
		case CardIds.SirFinleyMrrgglton_TB_BaconShop_HERO_40:
			return 260;
		case CardIds.RenoJackson_TB_BaconShop_HERO_41:
			return 256;
		case CardIds.EliseStarseeker_TB_BaconShop_HERO_42:
			return 228;
		case CardIds.DinotamerBrann_TB_BaconShop_HERO_43:
			return 220;
		case CardIds.ArchVillainRafaam_TB_BaconShop_HERO_45:
			return 219;
		case CardIds.MillhouseManastorm_TB_BaconShop_HERO_49:
			return 243;
		case CardIds.TessGreymane_TB_BaconShop_HERO_50:
			return 262;
		case CardIds.Deathwing_TB_BaconShop_HERO_52:
			return 226;
		case CardIds.Ysera_TB_BaconShop_HERO_53:
			return 270;
		case CardIds.FungalmancerFlurgl:
			return 230;
		case CardIds.Alexstrasza_TB_BaconShop_HERO_56:
			return 217;
		case CardIds.Nozdormu_TB_BaconShop_HERO_57:
			return 248;
		case CardIds.Malygos:
			return 242;
		case CardIds.ArannaStarseeker_TB_BaconShop_HERO_59:
		case CardIds.ArannaStarseeker_ArannaUnleashedToken:
			return 218;
		case CardIds.KaelthasSunstrider_TB_BaconShop_HERO_60:
			return 237;
		case CardIds.MaievShadowsong_TB_BaconShop_HERO_62:
			return 241;
		case CardIds.CaptainEudora_TB_BaconShop_HERO_64:
			return 222;
		case CardIds.CaptainHooktusk_TB_BaconShop_HERO_67:
			return 223;
		case CardIds.SkycapnKragg_TB_BaconShop_HERO_68:
			return 261;
		case CardIds.MrBigglesworth_TB_BaconShop_HERO_70:
			return 245;
		case CardIds.JandiceBarov_TB_BaconShop_HERO_71:
			return 236;
		case CardIds.LordBarov_TB_BaconShop_HERO_72:
			return 239;
		case CardIds.ForestWardenOmu_TB_BaconShop_HERO_74:
			return 229;
		case CardIds.Chenvaala_TB_BaconShop_HERO_78:
			return 224;
		case CardIds.Rakanishu_TB_BaconShop_HERO_75:
			return 255;
		case CardIds.Alakir:
			return 216;
		case CardIds.ZephrysTheGreat_TB_BaconShop_HERO_91:
			return 271;
		case CardIds.SilasDarkmoon_TB_BaconShop_HERO_90:
			return 258;
		case CardIds.Cthun_TB_BaconShop_HERO_29:
			return 221;
		case CardIds.Nzoth:
			return 247;
		case CardIds.Yshaarj:
			return 268;
		case CardIds.Tickatus_TB_BaconShop_HERO_94:
			return 267;
		case CardIds.Greybough_TB_BaconShop_HERO_95:
			return 233;
		case CardIds.OverlordSaurfang_BG20_HERO_102:
			return 249;
		case CardIds.DeathSpeakerBlackthorn_BG20_HERO_103:
			return 275;
		case CardIds.Voljin_BG20_HERO_201:
			return 276;
		case CardIds.Xyrella_BG20_HERO_101:
			return 274;
		case CardIds.MutanusTheDevourer_BG20_HERO_301:
			return 281;
		case CardIds.GuffRunetotem_BG20_HERO_242:
			return 282;
		case CardIds.KurtrusAshfallen_BG20_HERO_280:
			return 307;
		case CardIds.Galewing:
			return 321;
		case CardIds.TradePrinceGallywix_TB_BaconShop_HERO_10:
			return 308;
		case CardIds.MasterNguyen:
			return 326;
		case CardIds.CarielRoame_BG21_HERO_000:
			return 325;
		case CardIds.Sneed_BG21_HERO_030:
			return 366;
		case CardIds.CookieTheCook_BG21_HERO_020:
			return 367;
		case CardIds.TamsinRoame_BG20_HERO_282:
			return 369;
		case CardIds.ScabbsCutterbutter_BG21_HERO_010:
			return 371;
		case CardIds.Brukan_BG22_HERO_001:
			return 372;
		case CardIds.Drekthar_BG22_HERO_002:
			// There is also a 376 for Duels, don't mix them up!
			return 373;
		case CardIds.VanndarStormpike_BG22_HERO_003:
			// There is also a 375 for Duels, don't mix them up!
			return 374;
		case CardIds.TavishStormpike_BG22_HERO_000:
			return 370;
		case CardIds.VardenDawngrasp_BG22_HERO_004:
			return 380;
		case CardIds.Rokara_BG20_HERO_100:
			return 381;
		case CardIds.Onyxia_BG22_HERO_305:
			return 379;
		case CardIds.AmbassadorFaelin_BG22_HERO_201:
			return 394;
		case CardIds.IniStormcoil_BG22_HERO_200:
			return 401;
		case CardIds.QueenAzshara_BG22_HERO_007:
			return 406;
		case CardIds.Ozumat_BG23_HERO_201:
			return 407;
		case CardIds.LadyVashj_BG23_HERO_304:
			return 410;
		case CardIds.HeistbaronTogwaggle_BG23_HERO_305:
			return 425;
		case CardIds.MurlocHolmes_BG23_HERO_303:
			return 426;
		case CardIds.SireDenathrius_BG24_HERO_100:
			return 427;
		case CardIds.SylvanasWindrunner_BG23_HERO_306:
			return 431;
		case CardIds.TheJailer_TB_BaconShop_HERO_702:
			return 459;
		case CardIds.EnhanceOMechano_BG24_HERO_204:
			return 462;
		case CardIds.ProfessorPutricide_BG25_HERO_100:
			return 463;
		case CardIds.TeronGorefiend_BG25_HERO_103:
			return 464;
		case CardIds.ETCBandManager_BG25_HERO_105:
			return 478;
		case CardIds.RockMasterVoone_BG26_HERO_104:
			return 481;
		case CardIds.IngeTheIronHymn:
			return 482;
		case CardIds.CapnHoggarr_BG26_HERO_101:
			return 483;
		case CardIds.ThorimStormlord_BG27_HERO_801:
			return 514;
		case CardIds.SnakeEyes_BG28_HERO_400:
			return 831;
		case CardIds.TaethelanBloodwatcher_BG28_HERO_800:
			return 832;
		case CardIds.DoctorHollidae_BG28_HERO_801:
			return 833;
		case CardIds.Cho_BGDUO_HERO_222:
			return 922;
		case CardIds.Gall_BGDUO_HERO_223:
			return 923;
		case CardIds.TheNamelessOne_BGDUO_HERO_100:
			return 920;
		case CardIds.FlobbidinousFloop_BGDUO_HERO_101:
			return 919;
		case CardIds.MadamGoya_BGDUO_HERO_104:
			return 921;
		case CardIds.MarinTheManager_BG30_HERO_304:
			return 990;
		// case CardIds.Diablo:
		// 	return;
		default:
			if (heroCardId !== CardIds.Diablo) {
				console.error('missing achievements section for ', heroCardId);
			}
			return null;
	}
};

// Because inconsistencies
const formatHeroNameForAchievements = (hero: ReferenceCard): string => {
	switch (hero?.id) {
		// case CardIds.MaievShadowsongBattlegrounds:
		// 	return 'Maiev';
		// case CardIds.KingMuklaBattlegrounds:
		// 	return 'Mukla';
		// case CardIds.DinotamerBrannBattlegrounds:
		// 	return 'Brann';
		// case CardIds.ArannaStarseekerBattlegrounds:
		// 	return 'Aranna';
		// case CardIds.RagnarosTheFirelordBattlegrounds_TB_BaconShop_HERO_11:
		// 	return 'Ragnaros';
		// case CardIds.AFKayBattlegrounds:
		// 	return 'A.F.Kay'; // No whitespace
		default:
			return hero?.name?.replace(/,/g, '');
	}
};

export const isSupportedScenario = (
	battleInfo: BgsBattleInfo,
): {
	isSupported: boolean;
	reason?: BattleInfoMessage;
} => {
	if (!battleInfo) {
		return {
			isSupported: true,
		};
	}
	const playerSupport = isSupportedScenarioForPlayer(battleInfo.playerBoard, true);
	const oppSupport = isSupportedScenarioForPlayer(battleInfo.opponentBoard, false);
	const result = {
		isSupported: playerSupport.isSupported && oppSupport.isSupported,
		reason: playerSupport.reason ?? oppSupport.reason,
	};
	return result;
};

const isSupportedScenarioForPlayer = (
	boardInfo: BgsBoardInfo,
	isPlayer: boolean,
): {
	isSupported: boolean;
	reason?: BattleInfoMessage;
} => {
	try {
		if (hasScallywag(boardInfo) && (hasBaron(boardInfo) || hasKhadgar(boardInfo))) {
			return {
				isSupported: false,
				reason: 'scallywag',
			};
		} else if (hasStictchedEntity(boardInfo)) {
			return {
				isSupported: false,
				reason: 'stitched',
			};
		} else if (hasZilliaxAssembledEnchantment(boardInfo)) {
			return {
				isSupported: false,
				reason: 'zilliax-enchantment',
			};
		}
		return {
			isSupported: true,
		};
	} catch (e) {
		console.error('[bgs-simularion] Error when parsing board', e);
		return {
			isSupported: false,
			reason: 'error',
		};
	}
};

const hasMinions = (boardInfo: BgsBoardInfo, cardIds: readonly CardIds[]) => {
	return cardIds.some((cardId) => hasMinionOnBoard(boardInfo, cardId));
};

const hasStictchedEntity = (boardInfo: BgsBoardInfo) => {
	return boardInfo.board.some((m) =>
		m.enchantments.some((e) => e.cardId === CardIds.DeathstalkerRexxar_StitchedEnchantment),
	);
};

const hasZilliaxAssembledEnchantment = (boardInfo: BgsBoardInfo) => {
	return boardInfo.board.some((m) =>
		m.enchantments.some((e) => e.cardId === CardIds.ZilliaxAssembled_ZilliaxAssembledEnchantment_BG29_100_Ge),
	);
};

const hasScallywag = (boardInfo: BgsBoardInfo) => {
	return (
		hasMinionOnBoard(boardInfo, CardIds.Scallywag_BGS_061) ||
		hasMinionOnBoard(boardInfo, CardIds.Scallywag_TB_BaconUps_141)
	);
};

// const hasPilotedWhirlOTron = (boardInfo: BgsBoardInfo) => {
// 	return (
// 		hasMinionOnBoard(boardInfo, CardIds.PilotedWhirlOTron_BG21_HERO_030_Buddy) ||
// 		hasMinionOnBoard(boardInfo, CardIds.PilotedWhirlOTron_BG21_HERO_030_Buddy_G)
// 	);
// };

// const hasRylak = (boardInfo: BgsBoardInfo) => {
// 	return (
// 		hasMinionOnBoard(boardInfo, CardIds.RylakMetalhead_BG26_801) ||
// 		hasMinionOnBoard(boardInfo, CardIds.RylakMetalhead_BG26_801_G)
// 	);
// };

const hasBaron = (boardInfo: BgsBoardInfo) => {
	return (
		hasMinionOnBoard(boardInfo, CardIds.BaronRivendare_TB_BaconUps_055) ||
		hasMinionOnBoard(boardInfo, CardIds.BaronRivendare_BG_FP1_031)
	);
};

const hasStreetMagician = (boardInfo: BgsBoardInfo) => {
	return (
		hasMinionOnBoard(boardInfo, CardIds.StreetMagician_TB_BaconShop_HERO_21_Buddy) ||
		hasMinionOnBoard(boardInfo, CardIds.StreetMagician_TB_BaconShop_HERO_21_Buddy_G)
	);
};

const hasKhadgar = (boardInfo: BgsBoardInfo) => {
	return (
		hasMinionOnBoard(boardInfo, CardIds.Khadgar_DAL_575) || hasMinionOnBoard(boardInfo, CardIds.Khadgar_BG_DAL_575)
	);
};

const hasMinionOnBoard = (boardInfo: BgsBoardInfo, cardId: string): boolean => {
	if (!boardInfo?.board?.length) {
		return false;
	}

	return boardInfo.board.find((entity) => entity.cardId === cardId) != null;
};

/** @deprecated */
export const isBattlegrounds = (gameType: GameType | StatGameModeType): boolean => {
	return (
		[
			GameType.GT_BATTLEGROUNDS,
			GameType.GT_BATTLEGROUNDS_FRIENDLY,
			GameType.GT_BATTLEGROUNDS_AI_VS_AI,
			GameType.GT_BATTLEGROUNDS_PLAYER_VS_AI,
			GameType.GT_BATTLEGROUNDS_DUO,
			GameType.GT_BATTLEGROUNDS_DUO_VS_AI,
			GameType.GT_BATTLEGROUNDS_DUO_FRIENDLY,
			GameType.GT_BATTLEGROUNDS_DUO_AI_VS_AI,
		].includes(gameType as GameType) ||
		['battlegrounds', 'battlegrounds-friendly', 'battlegrounds-duo'].includes(gameType as StatGameModeType)
	);
};

export const isBattlegroundsScene = (scene: SceneMode): boolean => {
	return [SceneMode.BACON].includes(scene);
};

export const isMinionGolden = (card: ReferenceCard): boolean => {
	return !!card.battlegroundsNormalDbfId;
};
