import {
	CardIds,
	GameTag,
	GameType,
	NON_BUYABLE_MINION_IDS,
	Race,
	ReferenceCard,
	SceneMode,
} from '@firestone-hs/reference-data';
import { Entity } from '@firestone-hs/replay-parser';
import { BgsBattleInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-battle-info';
import { BgsBoardInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-board-info';
import { BoardEntity } from '@firestone-hs/simulate-bgs-battle/dist/board-entity';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { StatGameModeType } from '@firestone/stats/data-access';
import { BattleInfoMessage } from '../../models/battlegrounds/battle-info-message.type';
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

export const getAllCardsInGame = (
	availableTribes: readonly Race[],
	allCards: CardsFacadeService,
): readonly ReferenceCard[] => {
	const result = allCards
		.getCards()
		.filter((card) => card.techLevel)
		.filter((card) => card.set !== 'Vanilla')
		.filter((card) => !card.mechanics?.includes(GameTag[GameTag.BACON_BUDDY]))
		.filter((card) => !NON_BUYABLE_MINION_IDS.includes(card.id as CardIds))
		.filter((card) => {
			if (!availableTribes?.length) {
				return true;
			}
			const tribesForCard = getTribesForInclusion(card, false);
			if (!tribesForCard.filter((t) => t !== Race.BLANK).length) {
				return true;
			}
			return tribesForCard.some((r) => isValidTribe(availableTribes, Race[r]));
		})
		.filter((card) => !card.battlegroundsNormalDbfId); // Ignore golden
	return result;
};

const isValidTribe = (validTribes: readonly Race[], race: string): boolean => {
	const raceEnum: Race = Race[race];
	return (
		raceEnum === Race.ALL ||
		raceEnum === Race.BLANK ||
		!validTribes ||
		validTribes.length === 0 ||
		validTribes.includes(raceEnum)
	);
};

export const getTribesForInclusion = (card: ReferenceCard, includeOwnTribe: boolean): readonly Race[] => {
	if (!card) {
		return [];
	}
	const nativeRaces = card.races?.map((r) => Race[r]) ?? [];
	const cardRaces = includeOwnTribe ? nativeRaces : [];
	switch (card.id) {
		// Some cases are only included when specific tribes are
		case CardIds.BirdBuddy_BG21_002:
		case CardIds.BirdBuddy_BG21_002_G:
		case CardIds.PackLeader_BGS_017:
		case CardIds.PackLeader_TB_BaconUps_086:
		case CardIds.VirmenSensei_CFM_816:
		case CardIds.VirmenSensei_TB_BaconUps_074:
		case CardIds.HoundmasterLegacy:
		case CardIds.HoundmasterVanilla:
		case CardIds.Houndmaster_TB_BaconUps_068:
		case CardIds.Houndmaster_BG_DS1_070:
			return [Race.BEAST, ...cardRaces];
		case CardIds.ImpatientDoomsayer_BG21_007:
		case CardIds.ImpatientDoomsayer_BG21_007_G:
		case CardIds.SoulJuggler_BGS_002:
		case CardIds.SoulJuggler_TB_BaconUps_075:
		case CardIds.WrathWeaver_BGS_004:
		case CardIds.WrathWeaver_TB_BaconUps_079:
			return [Race.DEMON, ...cardRaces];
		case CardIds.SeafoodSlinger_BG21_011:
		case CardIds.SeafoodSlinger_BG21_011_G:
			return [Race.MURLOC, ...cardRaces];
		case CardIds.NadinaTheRed_BGS_040:
		case CardIds.NadinaTheRed_TB_BaconUps_154:
		case CardIds.WaxriderTogwaggle_BGS_035:
		case CardIds.WaxriderTogwaggle_TB_BaconUps_105:
		case CardIds.WhelpSmuggler_BG21_013:
		case CardIds.WhelpSmuggler_BG21_013_G:
			return [Race.DRAGON, ...cardRaces];
		case CardIds.MajordomoExecutus_BGS_105:
		case CardIds.MajordomoExecutus_TB_BaconUps_207:
		case CardIds.MasterOfRealities_BG21_036:
		case CardIds.MasterOfRealities_BG21_036_G:
		case CardIds.NomiKitchenNightmare_BGS_104:
		case CardIds.NomiKitchenNightmare_TB_BaconUps_201:
			return [Race.ELEMENTAL, ...cardRaces];
		case CardIds.KangorsApprentice_BGS_012:
		case CardIds.KangorsApprentice_TB_BaconUps_087:
			return [Race.MECH, ...cardRaces];
		case CardIds.DefiantShipwright_BG21_018:
		case CardIds.DefiantShipwright_BG21_018_G:
		case CardIds.TheTideRazor_BGS_079:
		case CardIds.TheTideRazor_TB_BaconUps_137:
			return [Race.PIRATE, ...cardRaces];
		case CardIds.AgamagganTheGreatBoar_BG20_205:
		case CardIds.AgamagganTheGreatBoar_BG20_205_G:
		case CardIds.ProphetOfTheBoar_BG20_203:
		case CardIds.ProphetOfTheBoar_BG20_203_G:
			return [Race.QUILBOAR, ...cardRaces];
		case CardIds.OrgozoaTheTender_BG23_015:
		case CardIds.OrgozoaTheTender_BG23_015_G:
			return [Race.NAGA, ...cardRaces];
		// case CardIds.SindoreiStraightShot:
		// case CardIds.SindoreiStraightShotBattlegrounds:
		// 	return [Race.UNDEAD, ...cardRaces];
		default:
			return getEffectiveTribesEnum(card);
	}
};

export const getEffectiveTribes = (
	card: ReferenceCard,
	groupMinionsIntoTheirTribeGroup: boolean,
): readonly string[] => {
	const tribes: readonly Race[] = groupMinionsIntoTheirTribeGroup
		? getTribesForInclusion(card, true)
		: getEffectiveTribesEnum(card);
	return tribes.map((tribe) => Race[tribe]);
};

export const getEffectiveTribesEnum = (card: ReferenceCard): readonly Race[] => {
	return !!card.races?.length ? card.races.map((r) => Race[r]) : [Race.BLANK];
};

export const tribeValueForSort = (tribe: string): number => {
	switch (tribe) {
		case Race[Race.BEAST]:
			return 1;
		case Race[Race.DEMON]:
			return 2;
		case Race[Race.DRAGON]:
			return 3;
		case Race[Race.ELEMENTAL]:
			return 4;
		case Race[Race.MECH]:
			return 5;
		case Race[Race.MURLOC]:
			return 6;
		case Race[Race.PIRATE]:
			return 7;
		case Race[Race.QUILBOAR]:
			return 8;
		case Race[Race.NAGA]:
			return 9;
		case Race[Race.UNDEAD]:
			return 10;
		case Race[Race.ALL]:
			return 100;
		case Race[Race.BLANK]:
			return 101;
	}
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
		// case CardIds.Diablo:
		// 	return;
		default:
			if (heroCardId !== CardIds.Diablo) {
				console.error('missing achievements section for ', heroCardId);
			}
			return null;
	}
};

export const getBuddy = (heroCardId: CardIds, allCards: CardsFacadeService): CardIds => {
	switch (normalizeHeroCardId(heroCardId, allCards)) {
		case CardIds.AFKay_TB_BaconShop_HERO_16:
			return CardIds.SnackVendor_TB_BaconShop_HERO_16_Buddy;
		case CardIds.Alakir:
			return CardIds.SpiritOfAir_TB_BaconShop_HERO_76_Buddy;
		case CardIds.Alexstrasza_TB_BaconShop_HERO_56:
			return CardIds.Vaelastrasz_TB_BaconShop_HERO_56_Buddy;
		case CardIds.ArannaStarseeker_ArannaUnleashedToken:
		case CardIds.ArannaStarseeker_TB_BaconShop_HERO_59:
			return CardIds.SklibbDemonHunter_TB_BaconShop_HERO_59_Buddy;
		case CardIds.ArchVillainRafaam_TB_BaconShop_HERO_45:
			return CardIds.LoyalHenchman_TB_BaconShop_HERO_45_Buddy;
		case CardIds.Brukan_BG22_HERO_001:
			return CardIds.SpiritRaptor_BG22_HERO_001_Buddy;
		case CardIds.CaptainEudora_TB_BaconShop_HERO_64:
			return CardIds.DagwikStickytoe_TB_BaconShop_HERO_64_Buddy;
		case CardIds.CaptainHooktusk_TB_BaconShop_HERO_67:
			return CardIds.RagingContender_TB_BaconShop_HERO_67_Buddy;
		case CardIds.CarielRoame_BG21_HERO_000:
			return CardIds.CaptainFairmount_BG21_HERO_000_Buddy;
		case CardIds.Chenvaala_TB_BaconShop_HERO_78:
			return CardIds.SnowElemental_TB_BaconShop_HERO_78_Buddy;
		case CardIds.CookieTheCook_BG21_HERO_020:
			return CardIds.SousChef_BG21_HERO_020_Buddy;
		case CardIds.Cthun_TB_BaconShop_HERO_29:
			return CardIds.TentacleOfCthun_TB_BaconShop_HERO_29_Buddy;
		case CardIds.DancinDeryl:
			return CardIds.AsherTheHaberdasher_TB_BaconShop_HERO_36_Buddy;
		case CardIds.DeathSpeakerBlackthorn_BG20_HERO_103:
			return CardIds.DeathsHeadSage_BG20_HERO_103_Buddy;
		case CardIds.Deathwing_TB_BaconShop_HERO_52:
			return CardIds.LadySinestra_TB_BaconShop_HERO_52_Buddy;
		case CardIds.DinotamerBrann_TB_BaconShop_HERO_43:
			return CardIds.BrannsEpicEgg_TB_BaconShop_HERO_43_Buddy;
		case CardIds.Drekthar_BG22_HERO_002:
			return CardIds.FrostwolfLieutenant_BG22_HERO_002_Buddy;
		case CardIds.EdwinVancleef_TB_BaconShop_HERO_01:
			return CardIds.Si7Scout_TB_BaconShop_HERO_01_Buddy;
		case CardIds.EliseStarseeker_TB_BaconShop_HERO_42:
			return CardIds.JrNavigator_TB_BaconShop_HERO_42_Buddy;
		case CardIds.ForestWardenOmu_TB_BaconShop_HERO_74:
			return CardIds.EvergreenBotani_TB_BaconShop_HERO_74_Buddy;
		case CardIds.FungalmancerFlurgl:
			return CardIds.SparkfinSoothsayer_TB_BaconShop_HERO_55_Buddy;
		case CardIds.Galakrond:
			return CardIds.ApostleOfGalakrond_TB_BaconShop_HERO_02_Buddy;
		case CardIds.Galewing:
			return CardIds.FlightTrainer_BG20_HERO_283_Buddy;
		case CardIds.GeorgeTheFallen_TB_BaconShop_HERO_15:
			return CardIds.KarlTheLost_TB_BaconShop_HERO_15_Buddy;
		case CardIds.Greybough_TB_BaconShop_HERO_95:
			return CardIds.WanderingTreant_TB_BaconShop_HERO_95_Buddy;
		case CardIds.GuffRunetotem_BG20_HERO_242:
			return CardIds.BabyKodo_BG20_HERO_242_Buddy;
		case CardIds.IllidanStormrage_TB_BaconShop_HERO_08:
			return CardIds.EclipsionIllidari_TB_BaconShop_HERO_08_Buddy;
		case CardIds.InfiniteToki:
			return CardIds.ClockworkAssistant_TB_BaconShop_HERO_28_Buddy;
		case CardIds.JandiceBarov_TB_BaconShop_HERO_71:
			return CardIds.JandicesApprentice_TB_BaconShop_HERO_71_Buddy;
		case CardIds.KaelthasSunstrider_TB_BaconShop_HERO_60:
			return CardIds.CrimsonHandCenturion_TB_BaconShop_HERO_60_Buddy;
		case CardIds.KingMukla_TB_BaconShop_HERO_38:
			return CardIds.CrazyMonkey_TB_BaconShop_HERO_38_Buddy;
		case CardIds.KurtrusAshfallen_BG20_HERO_280:
			return CardIds.LivingNightmare_BG20_HERO_280_Buddy;
		case CardIds.LichBazhial:
			return CardIds.UnearthedUnderling_TB_BaconShop_HERO_25_Buddy;
		case CardIds.LordBarov_TB_BaconShop_HERO_72:
			return CardIds.BarovsApprentice_TB_BaconShop_HERO_72_Buddy;
		case CardIds.LordJaraxxus_TB_BaconShop_HERO_37:
			return CardIds.Kilrek_TB_BaconShop_HERO_37_Buddy;
		case CardIds.MaievShadowsong_TB_BaconShop_HERO_62:
			return CardIds.ShadowWarden_TB_BaconShop_HERO_62_Buddy;
		case CardIds.Malygos:
			return CardIds.NexusLord_TB_BaconShop_HERO_58_Buddy;
		case CardIds.MasterNguyen:
			return CardIds.LeiFlamepaw_BG20_HERO_202_Buddy;
		case CardIds.MillhouseManastorm_TB_BaconShop_HERO_49:
			return CardIds.MagnusManastorm_TB_BaconShop_HERO_49_Buddy;
		case CardIds.MillificentManastorm:
			return CardIds.ElementiumSquirrelBomb_TB_BaconShop_HERO_17_Buddy;
		case CardIds.MrBigglesworth_TB_BaconShop_HERO_70:
			return CardIds.LilKT_TB_BaconShop_HERO_70_Buddy;
		case CardIds.MutanusTheDevourer_BG20_HERO_301:
			return CardIds.NightmareEctoplasm_BG20_HERO_301_Buddy;
		case CardIds.Nozdormu_TB_BaconShop_HERO_57:
			return CardIds.Chromie_TB_BaconShop_HERO_57_Buddy;
		case CardIds.Nzoth:
			return CardIds.BabyNzoth_TB_BaconShop_HERO_93_Buddy;
		case CardIds.OverlordSaurfang_BG20_HERO_102:
			return CardIds.DranoshSaurfang_BG20_HERO_102_Buddy;
		case CardIds.PatchesThePirate_TB_BaconShop_HERO_18:
			return CardIds.TuskarrRaider_TB_BaconShop_HERO_18_Buddy;
		case CardIds.Patchwerk_TB_BaconShop_HERO_34:
			return CardIds.Weebomination_TB_BaconShop_HERO_34_Buddy;
		case CardIds.Pyramad:
			return CardIds.TitanicGuardian_TB_BaconShop_HERO_39_Buddy;
		case CardIds.QueenWagtoggle_TB_BaconShop_HERO_14:
			return CardIds.ElderTaggawag_TB_BaconShop_HERO_14_Buddy;
		case CardIds.RagnarosTheFirelord_TB_BaconShop_HERO_11:
			return CardIds.Lucifron_TB_BaconShop_HERO_11_Buddy;
		case CardIds.Rakanishu_TB_BaconShop_HERO_75:
			return CardIds.LanternTender_TB_BaconShop_HERO_75_Buddy;
		case CardIds.RenoJackson_TB_BaconShop_HERO_41:
			return CardIds.SrTombDiver_TB_BaconShop_HERO_41_Buddy;
		case CardIds.ScabbsCutterbutter_BG21_HERO_010:
			return CardIds.WardenThelwater_BG21_HERO_010_Buddy;
		case CardIds.Shudderwock_TB_BaconShop_HERO_23:
			return CardIds.Muckslinger_TB_BaconShop_HERO_23_Buddy;
		case CardIds.SilasDarkmoon_TB_BaconShop_HERO_90:
			return CardIds.Burth_TB_BaconShop_HERO_90_Buddy;
		case CardIds.Sindragosa_TB_BaconShop_HERO_27:
			return CardIds.ThawedChampion_TB_BaconShop_HERO_27_Buddy;
		case CardIds.SirFinleyMrrgglton_TB_BaconShop_HERO_40:
			return CardIds.MaxwellMightySteed_TB_BaconShop_HERO_40_Buddy;
		case CardIds.SkycapnKragg_TB_BaconShop_HERO_68:
			return CardIds.Sharkbait_TB_BaconShop_HERO_68_Buddy;
		case CardIds.Sneed_BG21_HERO_030:
			return CardIds.PilotedWhirlOTron_BG21_HERO_030_Buddy;
		case CardIds.TamsinRoame_BG20_HERO_282:
			return CardIds.Monstrosity_BG20_HERO_282_Buddy;
		case CardIds.TavishStormpike_BG22_HERO_000:
			return CardIds.Crabby_BG22_HERO_000_Buddy;
		case CardIds.TessGreymane_TB_BaconShop_HERO_50:
			return CardIds.HunterOfOld_TB_BaconShop_HERO_50_Buddy;
		case CardIds.TheCurator_TB_BaconShop_HERO_33:
			return CardIds.Mishmash_TB_BaconShop_HERO_33_Buddy;
		case CardIds.TheGreatAkazamzarak:
			return CardIds.StreetMagician_TB_BaconShop_HERO_21_Buddy;
		case CardIds.TheLichKing_TB_BaconShop_HERO_22:
			return CardIds.Arfus_TB_BaconShop_HERO_22_Buddy;
		case CardIds.TheRatKing_TB_BaconShop_HERO_12:
			return CardIds.PigeonLord_TB_BaconShop_HERO_12_Buddy;
		case CardIds.Tickatus_TB_BaconShop_HERO_94:
			return CardIds.TicketCollector_TB_BaconShop_HERO_94_Buddy;
		case CardIds.TradePrinceGallywix_TB_BaconShop_HERO_10:
			return CardIds.BilgewaterMogul_TB_BaconShop_HERO_10_Buddy;
		case CardIds.VanndarStormpike_BG22_HERO_003:
			return CardIds.StormpikeLieutenant_BG22_HERO_003_Buddy;
		case CardIds.Voljin_BG20_HERO_201:
			return CardIds.MasterGadrin_BG20_HERO_201_Buddy;
		case CardIds.Xyrella_BG20_HERO_101:
			return CardIds.BabyElekk_BG20_HERO_101_Buddy;
		case CardIds.YoggSaronHopesEnd_TB_BaconShop_HERO_35:
			return CardIds.AcolyteOfYoggSaron_TB_BaconShop_HERO_35_Buddy;
		case CardIds.Ysera_TB_BaconShop_HERO_53:
			return CardIds.ValithriaDreamwalker_TB_BaconShop_HERO_53_Buddy;
		case CardIds.Yshaarj:
			return CardIds.BabyYshaarj_TB_BaconShop_HERO_92_Buddy;
		case CardIds.ZephrysTheGreat_TB_BaconShop_HERO_91:
			return CardIds.Phyresz_TB_BaconShop_HERO_91_Buddy;
		case CardIds.VardenDawngrasp_BG22_HERO_004:
			return CardIds.VardensAquarrior_BG22_HERO_004_Buddy;
		case CardIds.Rokara_BG20_HERO_100:
			return CardIds.IcesnarlTheMighty_BG20_HERO_100_Buddy;
		case CardIds.Onyxia_BG22_HERO_305:
			return CardIds.ManyWhelps_BG22_HERO_305_Buddy;
		case CardIds.AmbassadorFaelin_BG22_HERO_201:
			return CardIds.SubmersibleChef_BG22_HERO_201_Buddy;
		case CardIds.IniStormcoil_BG22_HERO_200:
			return CardIds.SubScrubber_BG22_HERO_200_Buddy;
		case CardIds.QueenAzshara_BG22_HERO_007:
			return CardIds.ImperialDefender_BG22_HERO_007_Buddy;
		case CardIds.Ozumat_BG23_HERO_201:
			return CardIds.Tamuzo_BG23_HERO_201_Buddy;
		case CardIds.LadyVashj_BG23_HERO_304:
			return CardIds.CoilfangElite_BG23_HERO_304_Buddy;
		case CardIds.HeistbaronTogwaggle_BG23_HERO_305:
			return CardIds.WaxadredTheDrippy_BG23_HERO_305_Buddy;
		case CardIds.SireDenathrius_BG24_HERO_100:
			return CardIds.ShadyAristocrat_BG24_HERO_100_Buddy;
		case CardIds.SylvanasWindrunner_BG23_HERO_306:
			return CardIds.NathanosBlightcaller_BG23_HERO_306_Buddy;
		case CardIds.TheJailer_TB_BaconShop_HERO_702:
			return CardIds.MawswornSoulkeeper_TB_BaconShop_HERO_702_Buddy;
		case CardIds.EnhanceOMechano_BG24_HERO_204:
			return CardIds.EnhanceOMedico_BG24_HERO_204_Buddy;
		case CardIds.ProfessorPutricide_BG25_HERO_100:
			return CardIds.Festergut_BG25_HERO_100_Buddy;
		case CardIds.TeronGorefiend_BG25_HERO_103:
			return CardIds.ShadowyConstruct_BG25_HERO_103_Buddy;
		case CardIds.MurlocHolmes_BG23_HERO_303:
			return CardIds.Watfin_BG23_HERO_303_Buddy;
		case CardIds.ETCBandManager_BG25_HERO_105:
			return CardIds.TalentScout_BG25_HERO_105_Buddy;
		default:
			if (!!heroCardId) {
				console.error('missing buddy section for ', heroCardId);
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
	if (
		battleInfo.playerBoard?.player?.heroPowerId === CardIds.Prestidigitation_TB_BaconShop_HP_020 ||
		battleInfo.opponentBoard?.player?.heroPowerId === CardIds.Prestidigitation_TB_BaconShop_HP_020
	) {
		console.log('[bgs-simulation] is supported?', result);
	}
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
		} else if (hasPilotedWhirlOTron(boardInfo)) {
			return {
				isSupported: false,
				reason: 'piloted-whirl-o-tron',
			};
		}
		// else if (hasMinions(boardInfo, [CardIds.RylakMetalhead_BG26_801, CardIds.RylakMetalhead_BG26_801_G])) {
		// 	return {
		// 		isSupported: false,
		// 		reason: 'rylak',
		// 	};
		// }
		// else if (!isPlayer && hasMinions(boardInfo, [CardIds.Bassgill, CardIds.BassgillBattlegrounds])) {
		// 	return {
		// 		isSupported: false,
		// 		reason: 'bassgill',
		// 	};
		// }
		// else if (hasMinions(boardInfo, [CardIds.ChoralMrrrglr, CardIds.ChoralMrrrglrBattlegrounds])) {
		// 	return {
		// 		isSupported: false,
		// 		reason: 'choral-mrrrglr',
		// 	};
		// }
		else if (boardInfo?.secrets?.length > 0) {
			return {
				isSupported: false,
				reason: 'secret',
			};
		} else if (hasStreetMagician(boardInfo)) {
			return {
				isSupported: false,
				reason: 'secret',
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

const hasScallywag = (boardInfo: BgsBoardInfo) => {
	return (
		hasMinionOnBoard(boardInfo, CardIds.Scallywag_BGS_061) ||
		hasMinionOnBoard(boardInfo, CardIds.Scallywag_TB_BaconUps_141)
	);
};

const hasPilotedWhirlOTron = (boardInfo: BgsBoardInfo) => {
	return (
		hasMinionOnBoard(boardInfo, CardIds.PilotedWhirlOTron_BG21_HERO_030_Buddy) ||
		hasMinionOnBoard(boardInfo, CardIds.PilotedWhirlOTron_BG21_HERO_030_Buddy_G)
	);
};

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

export const buildEntityFromBoardEntity = (minion: BoardEntity, allCards: CardsFacadeService): Entity => {
	return Entity.fromJS({
		id: minion.entityId,
		cardID: minion.cardId,
		damageForThisAction: 0,
		tags: {
			[GameTag[GameTag.ATK]]: minion.attack,
			[GameTag[GameTag.HEALTH]]: minion.health,
			[GameTag[GameTag.TAUNT]]: minion.taunt ? 1 : 0,
			[GameTag[GameTag.STEALTH]]: minion.stealth ? 1 : 0,
			[GameTag[GameTag.DIVINE_SHIELD]]: minion.divineShield ? 1 : 0,
			[GameTag[GameTag.POISONOUS]]: minion.poisonous ? 1 : 0,
			[GameTag[GameTag.VENOMOUS]]: minion.venomous ? 1 : 0,
			[GameTag[GameTag.REBORN]]: minion.reborn ? 1 : 0,
			[GameTag[GameTag.WINDFURY]]: minion.windfury ? 1 : 0,
			[GameTag[GameTag.TAG_SCRIPT_DATA_NUM_1]]: minion.scriptDataNum1,
			[GameTag[GameTag.PREMIUM]]: allCards.getCard(minion.cardId)?.battlegroundsNormalDbfId ? 1 : 0,
		},
		// This probably won't work with positioning auras, but I don't think there are many
		// left (used to have Dire Wolf Alpha)
		enchantments: minion.enchantments,
	} as any);
};

/** @deprecated */
export const isBattlegrounds = (gameType: GameType | StatGameModeType): boolean => {
	return (
		[
			GameType.GT_BATTLEGROUNDS,
			GameType.GT_BATTLEGROUNDS_FRIENDLY,
			GameType.GT_BATTLEGROUNDS_AI_VS_AI,
			GameType.GT_BATTLEGROUNDS_PLAYER_VS_AI,
		].includes(gameType as GameType) ||
		['battlegrounds', 'battlegrounds-friendly'].includes(gameType as StatGameModeType)
	);
};

export const isBattlegroundsScene = (scene: SceneMode): boolean => {
	return [SceneMode.BACON].includes(scene);
};
