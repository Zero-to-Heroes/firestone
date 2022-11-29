import { CardIds, GameTag, GameType, Race, ReferenceCard, SceneMode } from '@firestone-hs/reference-data';
import { Entity } from '@firestone-hs/replay-parser';
import { BgsBattleInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-battle-info';
import { BgsBoardInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-board-info';
import { BoardEntity } from '@firestone-hs/simulate-bgs-battle/dist/board-entity';
import { CardsFacadeService } from '@services/cards-facade.service';
import { BattleInfoMessage } from '../../models/battlegrounds/battle-info-message.type';
import { StatGameModeType } from '../../models/mainwindow/stats/stat-game-mode.type';
import { VisualAchievement } from '../../models/visual-achievement';
import { LocalizationFacadeService } from '../localization-facade.service';

export const allBgsRaces = [
	Race.BEAST,
	Race.DEMON,
	Race.DRAGON,
	Race.MECH,
	Race.MURLOC,
	Race.PIRATE,
	Race.ELEMENTAL,
	Race.QUILBOAR,
	Race.NAGA,
];

export const NON_BUYABLE_MINION_IDS = [
	CardIds.CuddlgamBattlegrounds_TB_BaconShop_HP_033t_SKIN_A,
	CardIds.CuddlgamBattlegrounds_TB_BaconShop_HP_033t_SKIN_A_G,
	CardIds.ArgentBraggart_BG_SCH_149,
	CardIds.ArgentBraggartBattlegrounds,
	CardIds.AvatarOfNzoth_FishOfNzothTokenBattlegrounds,
	CardIds.FishOfNzothBattlegrounds,
	CardIds.CattlecarpOfNzothBattlegrounds_TB_BaconShop_HP_105t_SKIN_A,
	CardIds.CattlecarpOfNzothBattlegrounds_TB_BaconShop_HP_105t_SKIN_A_G,
	CardIds.SnakeTrap_SnakeLegacyToken,
	CardIds.SnakeTrap_SnakeVanillaToken,
	CardIds.ImprovedSnakeTrap_SnakeToken,
	CardIds.ElementEarth_StoneElementalToken,
	CardIds.BabyKrush_DevilsaurToken,
	CardIds.DevilsaurBattlegrounds,
	// To remove once the cards list is properly updated
	CardIds.FriendOfAFriend_BG22_404,
	CardIds.FriendOfAFriend_BG22_404_G,
	CardIds.Onyxia_OnyxianWhelpToken,
	CardIds.MurlocWarleaderCore,
	CardIds.MurlocWarleaderVanilla,
	// 23.4, probably not needed since they are already tokens
	CardIds.Tentacular_OzumatsTentacleToken_BG23_HERO_201pt,
	CardIds.Tentacular_OzumatsTentacleToken_BG23_HERO_201pt2,
	CardIds.Tentacular_OzumatsTentacleToken_BG23_HERO_201pt3,
	CardIds.Tentacular_OzumatsTentacleToken_BG23_HERO_201pt4,
	CardIds.Tentacular_OzumatsTentacleToken_BG23_HERO_201pt5,
	CardIds.Tentacular_OzumatsTentacleToken_BG23_HERO_201pt6,
	// 26.0, same
	CardIds.EmperorCobraLegacy_BG_EX1_170,
	CardIds.EmperorCobraLegacy_BG_EX1_170_G,
	CardIds.EmperorCobraLegacy_EX1_170,
	CardIds.SnakeLegacyToken,
	CardIds.SnakeLegacy,
	CardIds.StoneElemental,
	CardIds.BolvarFireblood_CORE_ICC_858,
	CardIds.BolvarFireblood_ICC_858,
];

export const getTribeName = (tribe: Race, i18n: LocalizationFacadeService): string =>
	i18n.translateString(`app.battlegrounds.tribes.${Race[tribe]?.toLowerCase()}`);

export const getTribeIcon = (tribe: string | Race): string => {
	const referenceCardId = getReferenceTribeCardId(tribe);
	return `https://static.zerotoheroes.com/hearthstone/cardart/256x/${referenceCardId}.jpg`;
};

export const getReferenceTribeCardId = (tribe: string | Race): string => {
	let referenceCardId: string;
	tribe = (tribe as string)?.padStart ? (tribe as string).toLowerCase() : tribe;
	switch (tribe) {
		case 'mech':
		case Race.MECH:
			referenceCardId = CardIds.MicroMummy_BG_ULD_217;
			break;
		case 'beast':
		case Race.BEAST:
			referenceCardId = CardIds.Alleycat_BG_CFM_315;
			break;
		case 'demon':
		case Race.DEMON:
			referenceCardId = CardIds.ImpulsiveTrickster;
			break;
		case 'dragon':
		case Race.DRAGON:
			referenceCardId = CardIds.RedWhelp;
			break;
		case 'murloc':
		case Race.MURLOC:
			referenceCardId = CardIds.RockpoolHunter_BG_UNG_073;
			break;
		case 'pirate':
		case Race.PIRATE:
			referenceCardId = CardIds.Scallywag;
			break;
		case 'elemental':
		case Race.ELEMENTAL:
			referenceCardId = CardIds.Sellemental;
			break;
		case 'naga':
		case Race.NAGA:
			referenceCardId = CardIds.MiniMyrmidon;
			break;
		case 'quilboar':
		case Race.QUILBOAR:
			referenceCardId = CardIds.SunBaconRelaxer;
			break;
		case 'all':
		case Race.ALL:
			referenceCardId = CardIds.Amalgadon;
			break;
		default:
			referenceCardId = CardIds.TavernTipper;
			break;
	}
	return referenceCardId;
};

export const getHeroPower = (heroCardId: string, allCards: CardsFacadeService): string => {
	const normalized = normalizeHeroCardId(heroCardId, allCards);
	switch (normalized) {
		case 'TB_BaconShop_HERO_01':
			return 'TB_BaconShop_HP_001';
		case 'TB_BaconShop_HERO_02':
			return 'TB_BaconShop_HP_011';
		case 'TB_BaconShop_HERO_08':
			return 'TB_BaconShop_HP_069';
		case CardIds.RagnarosTheFirelordBattlegrounds:
			return CardIds.DieInsectsBattlegrounds_TB_BaconShop_HP_087;
		case 'TB_BaconShop_HERO_12':
			return 'TB_BaconShop_HP_041';
		case CardIds.QueenWagtoggleBattlegrounds:
			return CardIds.WaxWarbandBattlegrounds;
		case 'TB_BaconShop_HERO_15':
			return 'TB_BaconShop_HP_010';
		case 'TB_BaconShop_HERO_16':
			return 'TB_BaconShop_HP_044';
		case 'TB_BaconShop_HERO_17':
			return 'TB_BaconShop_HP_015';
		case 'TB_BaconShop_HERO_18':
			return 'TB_BaconShop_HP_072';
		case 'TB_BaconShop_HERO_20':
			return 'TB_BaconShop_HP_018';
		case 'TB_BaconShop_HERO_21':
			return 'TB_BaconShop_HP_020';
		case 'TB_BaconShop_HERO_22':
			return 'TB_BaconShop_HP_024';
		case 'TB_BaconShop_HERO_23':
			return 'TB_BaconShop_HP_022';
		case 'TB_BaconShop_HERO_25':
			return 'TB_BaconShop_HP_049';
		case 'TB_BaconShop_HERO_27':
			return 'TB_BaconShop_HP_014';
		case 'TB_BaconShop_HERO_28':
			return 'TB_BaconShop_HP_028';
		case 'TB_BaconShop_HERO_30':
			return 'TB_BaconShop_HP_043';
		case 'TB_BaconShop_HERO_31':
			return 'TB_BaconShop_HP_009';
		case 'TB_BaconShop_HERO_33':
			return 'TB_BaconShop_HP_033';
		case 'TB_BaconShop_HERO_34':
			return 'TB_BaconShop_HP_035';
		case 'TB_BaconShop_HERO_35':
			return 'TB_BaconShop_HP_039';
		case 'TB_BaconShop_HERO_36':
			return 'TB_BaconShop_HP_042';
		case 'TB_BaconShop_HERO_37':
			return 'TB_BaconShop_HP_036';
		case 'TB_BaconShop_HERO_38':
			return 'TB_BaconShop_HP_038';
		case 'TB_BaconShop_HERO_39':
			return 'TB_BaconShop_HP_040';
		case 'TB_BaconShop_HERO_40':
			return 'TB_BaconShop_HP_057';
		case 'TB_BaconShop_HERO_41':
			return 'TB_BaconShop_HP_046';
		case 'TB_BaconShop_HERO_42':
			return 'TB_BaconShop_HP_047';
		case 'TB_BaconShop_HERO_43':
			return 'TB_BaconShop_HP_048';
		// case 'TB_BaconShop_HERO_44':
		// 	return 'TB_BaconShop_HP_050';
		case 'TB_BaconShop_HERO_45':
			return 'TB_BaconShop_HP_053';
		case 'TB_BaconShop_HERO_47':
			return 'TB_BaconShop_HP_051';
		case 'TB_BaconShop_HERO_49':
			return 'TB_BaconShop_HP_054';
		case 'TB_BaconShop_HERO_50':
			return 'TB_BaconShop_HP_077';
		case 'TB_BaconShop_HERO_52':
			return 'TB_BaconShop_HP_061';
		case 'TB_BaconShop_HERO_53':
			return 'TB_BaconShop_HP_062';
		case 'TB_BaconShop_HERO_55':
			return 'TB_BaconShop_HP_056';
		case 'TB_BaconShop_HERO_56':
			return 'TB_BaconShop_HP_064';
		case 'TB_BaconShop_HERO_57':
			return 'TB_BaconShop_HP_063';
		case 'TB_BaconShop_HERO_58':
			return 'TB_BaconShop_HP_052';
		case 'TB_BaconShop_HERO_59t':
			return 'TB_BaconShop_HP_065t2';
		case 'TB_BaconShop_HERO_59':
			return 'TB_BaconShop_HP_065';
		case 'TB_BaconShop_HERO_60':
			return 'TB_BaconShop_HP_066';
		case 'TB_BaconShop_HERO_61':
			return 'TB_BaconShop_HP_067';
		case 'TB_BaconShop_HERO_62':
			return 'TB_BaconShop_HP_068';
		case 'TB_BaconShop_HERO_64':
			return 'TB_BaconShop_HP_074';
		case CardIds.CaptainHooktuskBattlegrounds:
			return CardIds.TrashForTreasureBattlegrounds;
		case 'TB_BaconShop_HERO_68':
			return 'TB_BaconShop_HP_076';
		case 'TB_BaconShop_HERO_70':
			return 'TB_BaconShop_HP_080';
		case 'TB_BaconShop_HERO_71':
			return 'TB_BaconShop_HP_084';
		case 'TB_BaconShop_HERO_72':
			return 'TB_BaconShop_HP_081';
		case 'TB_BaconShop_HERO_74':
			return 'TB_BaconShop_HP_082';
		case CardIds.ChenvaalaBattlegrounds:
			return CardIds.AvalancheBattlegrounds;
		case CardIds.RakanishuBattlegrounds:
			return CardIds.TavernLightingBattlegrounds;
		case CardIds.AlakirBattlegrounds:
			return CardIds.SwattingInsectsBattlegrounds;
		case CardIds.ZephrysTheGreatBattlegrounds:
			return CardIds.ThreeWishesBattlegrounds;
		case CardIds.SilasDarkmoonBattlegrounds:
			return CardIds.ComeOneComeAllBattlegrounds;
		case CardIds.CthunBattlegrounds:
			return CardIds.SaturdayCthunsBattlegrounds;
		case CardIds.NzothBattlegrounds:
			return CardIds.AvatarOfNzothBattlegrounds;
		case CardIds.YshaarjBattlegrounds:
			return CardIds.EmbraceYourRageBattlegrounds;
		case CardIds.TickatusBattlegrounds:
			return CardIds.PrizeWallBattlegrounds;
		case CardIds.GreyboughBattlegrounds:
			return CardIds.SproutItOutBattlegrounds;
		case CardIds.OverlordSaurfang_BG20_HERO_102:
			return CardIds.OverlordSaurfang_ForTheHorde;
		case CardIds.DeathSpeakerBlackthorn_BG20_HERO_103:
			return CardIds.DeathSpeakerBlackthorn_Bloodbound;
		case CardIds.Voljin_BG20_HERO_201:
			return CardIds.Voljin_SpiritSwap_BG20_HERO_201p;
		case CardIds.Xyrella_BG20_HERO_101:
			return CardIds.Xyrella_SeeTheLight;
		case CardIds.MutanusTheDevourer_BG20_HERO_301:
			return CardIds.MutanusTheDevourer_Devour;
		case CardIds.GuffRunetotem_BG20_HERO_242:
			return CardIds.GuffRunetotem_NaturalBalance;
		case CardIds.KurtrusAshfallen_BG20_HERO_280:
			return CardIds.KurtrusAshfallen_FinalShowdown;
		case CardIds.Galewing:
			return CardIds.Galewing_DungarsGryphon;
		case CardIds.TradePrinceGallywixBattlegrounds:
			return CardIds.SmartSavingsBattlegrounds;
		case CardIds.MasterNguyen:
			return CardIds.MasterNguyen_PowerOfTheStorm;
		case CardIds.CarielRoame_BG21_HERO_000:
			return CardIds.CarielRoame_ConvictionRank1;
		case CardIds.Diablo:
			return CardIds.Diablo_RealmOfTerror;
		case CardIds.Sneed_BG21_HERO_030:
			return CardIds.Sneed_SneedsReplicator;
		case CardIds.CookieTheCook_BG21_HERO_020:
			return CardIds.CookieTheCook_StirThePot;
		case CardIds.TamsinRoame_BG20_HERO_282:
			return CardIds.TamsinRoame_FragrantPhylactery;
		case CardIds.ScabbsCutterbutter_BG21_HERO_010:
			return CardIds.ScabbsCutterbutter_ISpy;
		case CardIds.Brukan_BG22_HERO_001:
			return CardIds.Brukan_EmbraceTheElements;
		case CardIds.Drekthar_BG22_HERO_002:
			return CardIds.Drekthar_LeadTheFrostwolves;
		case CardIds.VanndarStormpike_BG22_HERO_003:
			return CardIds.VanndarStormpike_LeadTheStormpikes;
		case CardIds.TavishStormpike_BG22_HERO_000:
			return CardIds.TavishStormpike_Deadeye;
		case CardIds.VardenDawngrasp_BG22_HERO_004:
			return CardIds.VardenDawngrasp_TwiceAsNice;
		case CardIds.Rokara_BG20_HERO_100:
			return CardIds.Rokara_GloryOfCombat;
		case CardIds.Onyxia_BG22_HERO_305:
			return CardIds.Onyxia_Broodmother;
		case CardIds.AmbassadorFaelin_BG22_HERO_201:
			return CardIds.AmbassadorFaelin_ExpeditionPlans;
		case CardIds.IniStormcoil_BG22_HERO_200:
			return CardIds.IniStormcoil_Mechgyver;
		case CardIds.QueenAzshara_BG22_HERO_007:
			return CardIds.QueenAzshara_AzsharasAmbition;
		case CardIds.Ozumat_BG23_HERO_201:
			return CardIds.Ozumat_Tentacular;
		case CardIds.LadyVashj_BG23_HERO_304:
			return CardIds.LadyVashj_RelicsOfTheDeep;
		case CardIds.HeistbaronTogwaggle_BG23_HERO_305:
			return CardIds.HeistbaronTogwaggle_ThePerfectCrime;
		case CardIds.MurlocHolmes_BG23_HERO_303:
			return CardIds.MurlocHolmes_DetectiveForHire;
		case CardIds.SireDenathrius_BG24_HERO_100:
			return CardIds.SireDenathrius_Whodunitquestion;
		case CardIds.SylvanasWindrunner_BG23_HERO_306:
			return CardIds.SylvanasWindrunner_ReclaimedSouls;
		case CardIds.TheJailerBattlegrounds:
			return CardIds.RunicEmpowermentBattlegrounds;
		case CardIds.EnhanceOMechano_BG24_HERO_204:
			return CardIds.EnhanceOMechano_Enhancification;

		case '':
			return null; // new heroes
	}
};

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
	return allCards
		.getCards()
		.filter((card) => card.techLevel)
		.filter((card) => card.set !== 'Vanilla')
		.filter((card) => !card.mechanics?.includes(GameTag[GameTag.BACON_BUDDY]))
		.filter((card) => !NON_BUYABLE_MINION_IDS.includes(card.id as CardIds))
		.filter((card) => !availableTribes?.length || isValidTribe(availableTribes, Race[getTribeForInclusion(card)]))
		.filter((card) => !card.battlegroundsNormalDbfId); // Ignore golden
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

export const getTribeForInclusion = (card: ReferenceCard): Race => {
	switch (card.id) {
		// Some cases are only included when specific tribes are
		case CardIds.BirdBuddy:
		case CardIds.BirdBuddyBattlegrounds:
		case CardIds.PackLeader:
		case CardIds.PackLeaderBattlegrounds:
		case CardIds.VirmenSensei:
		case CardIds.VirmenSenseiBattlegrounds:
		case CardIds.HoundmasterLegacy:
		case CardIds.HoundmasterVanilla:
		case CardIds.HoundmasterBattlegrounds:
		case CardIds.Houndmaster:
			return Race.BEAST;
		case CardIds.ImpatientDoomsayer:
		case CardIds.ImpatientDoomsayerBattlegrounds:
		case CardIds.SoulJuggler:
		case CardIds.SoulJugglerBattlegrounds:
		case CardIds.WrathWeaver:
		case CardIds.WrathWeaverBattlegrounds:
			return Race.DEMON;
		case CardIds.SeafoodSlinger_BG21_011:
		case CardIds.SeafoodSlinger_BG21_011_G:
			return Race.MURLOC;
		case CardIds.NadinaTheRed:
		case CardIds.NadinaTheRedBattlegrounds:
		case CardIds.WaxriderTogwaggle_BGS_035:
		case CardIds.WaxriderTogwaggleBattlegrounds:
		case CardIds.WhelpSmuggler:
		case CardIds.WhelpSmugglerBattlegrounds:
			return Race.DRAGON;
		case CardIds.MajordomoExecutus_BGS_105:
		case CardIds.MajordomoExecutusBattlegrounds:
		case CardIds.MasterOfRealities_BG21_036:
		case CardIds.MasterOfRealitiesBattlegrounds:
		case CardIds.NomiKitchenNightmare:
		case CardIds.NomiKitchenNightmareBattlegrounds:
			return Race.ELEMENTAL;
		case CardIds.KangorsApprentice:
		case CardIds.KangorsApprenticeBattlegrounds:
			return Race.MECH;
		case CardIds.DefiantShipwright_BG21_018:
		case CardIds.DefiantShipwright_BG21_018_G:
		case CardIds.TheTideRazor:
		case CardIds.TheTideRazorBattlegrounds:
			return Race.PIRATE;
		case CardIds.AgamagganTheGreatBoar:
		case CardIds.AgamagganTheGreatBoarBattlegrounds:
		case CardIds.ProphetOfTheBoar:
		case CardIds.ProphetOfTheBoarBattlegrounds:
			return Race.QUILBOAR;
		case CardIds.OrgozoaTheTender:
		case CardIds.OrgozoaTheTenderBattlegrounds:
			return Race.NAGA;
		default:
			return getEffectiveTribeEnum(card);
	}
};

export const getEffectiveTribe = (card: ReferenceCard, groupMinionsIntoTheirTribeGroup: boolean): string => {
	const tribe: Race = groupMinionsIntoTheirTribeGroup ? getTribeForInclusion(card) : getEffectiveTribeEnum(card);
	return Race[tribe];
};

export const getEffectiveTribeEnum = (card: ReferenceCard): Race => {
	return !!card.races?.length ? Race[card.races[0].toUpperCase()] : Race.BLANK;
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
		case Race[Race.ALL]:
			return 10;
		case Race[Race.BLANK]:
			return 11;
	}
};

export const getAchievementsForHero = (
	heroCardId: string,
	heroAchievements: readonly VisualAchievement[],
	allCards: CardsFacadeService,
): readonly VisualAchievement[] => {
	const dbHero = allCards.getCard(heroCardId);
	const heroName = formatHeroNameForAchievements(dbHero);
	const sectionId = getAchievementSectionIdFromHeroCardId(heroCardId, heroName);
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

const getAchievementSectionIdFromHeroCardId = (heroCardId: string, heroName: string): number => {
	switch (heroCardId) {
		case CardIds.EdwinVancleefBattlegrounds:
			return 227;
		case CardIds.GalakrondBattlegrounds:
			return 231;
		case CardIds.IllidanStormrageBattlegrounds:
			return 234;
		case CardIds.RagnarosTheFirelordBattlegrounds:
			return 254;
		case CardIds.TheRatKingBattlegrounds:
			return 266;
		case CardIds.QueenWagtoggleBattlegrounds:
			return 253;
		case CardIds.GeorgeTheFallenBattlegrounds:
			return 232;
		case CardIds.AFKayBattlegrounds:
			return 215;
		case CardIds.MillificentManastormBattlegrounds:
			return 244;
		case CardIds.PatchesThePirateBattlegrounds:
			return 250;
		case CardIds.TheGreatAkazamzarakBattlegrounds:
			return 264;
		case CardIds.TheLichKingBattlegrounds:
			return 265;
		case CardIds.ShudderwockBattlegrounds:
			return 257;
		case CardIds.LichBazhialBattlegrounds:
			return 238;
		case CardIds.SindragosaBattlegrounds:
			return 259;
		case CardIds.InfiniteTokiBattlegrounds:
			return 235;
		case CardIds.TheCuratorBattlegrounds:
			return 263;
		case CardIds.PatchwerkBattlegrounds:
			return 251;
		case CardIds.YoggSaronHopesEndBattlegrounds:
			return 269;
		case CardIds.DancinDerylBattlegrounds:
			return 225;
		case CardIds.LordJaraxxusBattlegrounds:
			return 240;
		case CardIds.KingMuklaBattlegrounds:
			return 246;
		case CardIds.PyramadBattlegrounds:
			return 252;
		case CardIds.SirFinleyMrrggltonBattlegrounds:
			return 260;
		case CardIds.RenoJacksonBattlegrounds:
			return 256;
		case CardIds.EliseStarseekerBattlegrounds:
			return 228;
		case CardIds.DinotamerBrannBattlegrounds:
			return 220;
		case CardIds.ArchVillainRafaamBattlegrounds:
			return 219;
		case CardIds.MillhouseManastormBattlegrounds:
			return 243;
		case CardIds.TessGreymaneBattlegrounds:
			return 262;
		case CardIds.DeathwingBattlegrounds:
			return 226;
		case CardIds.YseraBattlegrounds:
			return 270;
		case CardIds.FungalmancerFlurglBattlegrounds:
			return 230;
		case CardIds.AlexstraszaBattlegrounds:
			return 217;
		case CardIds.NozdormuBattlegrounds:
			return 248;
		case CardIds.MalygosBattlegrounds:
			return 242;
		case CardIds.ArannaStarseekerBattlegrounds:
		case CardIds.ArannaStarseeker_ArannaUnleashedTokenBattlegrounds:
			return 218;
		case CardIds.KaelthasSunstriderBattlegrounds:
			return 237;
		case CardIds.MaievShadowsongBattlegrounds:
			return 241;
		case CardIds.CaptainEudoraBattlegrounds:
			return 222;
		case CardIds.CaptainHooktuskBattlegrounds:
			return 223;
		case CardIds.SkycapnKraggBattlegrounds:
			return 261;
		case CardIds.MrBigglesworthBattlegrounds:
			return 245;
		case CardIds.JandiceBarovBattlegrounds:
			return 236;
		case CardIds.LordBarovBattlegrounds:
			return 239;
		case CardIds.ForestWardenOmuBattlegrounds:
			return 229;
		case CardIds.ChenvaalaBattlegrounds:
			return 224;
		case CardIds.RakanishuBattlegrounds:
			return 255;
		case CardIds.AlakirBattlegrounds:
			return 216;
		case CardIds.ZephrysTheGreatBattlegrounds:
			return 271;
		case CardIds.SilasDarkmoonBattlegrounds:
			return 258;
		case CardIds.CthunBattlegrounds:
			return 221;
		case CardIds.NzothBattlegrounds:
			return 247;
		case CardIds.YshaarjBattlegrounds:
			return 268;
		case CardIds.TickatusBattlegrounds:
			return 267;
		case CardIds.GreyboughBattlegrounds:
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
		case CardIds.TradePrinceGallywixBattlegrounds:
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
		case CardIds.TheJailerBattlegrounds:
			return 459;
		case CardIds.EnhanceOMechano_BG24_HERO_204:
			return 462;
		default:
			if (heroCardId !== CardIds.Diablo) {
				console.error('missing achievements section for ', heroCardId);
			}
			return null;
	}
};

export const getBuddy = (heroCardId: CardIds, allCards: CardsFacadeService): CardIds => {
	switch (normalizeHeroCardId(heroCardId, allCards)) {
		case CardIds.AFKayBattlegrounds:
			return CardIds.SnackVendorBattlegrounds_TB_BaconShop_HERO_16_Buddy;
		case CardIds.AlakirBattlegrounds:
			return CardIds.SpiritOfAirBattlegrounds_TB_BaconShop_HERO_76_Buddy;
		case CardIds.AlexstraszaBattlegrounds:
			return CardIds.VaelastraszBattlegrounds_TB_BaconShop_HERO_56_Buddy;
		case CardIds.ArannaStarseeker_ArannaUnleashedTokenBattlegrounds:
		case CardIds.ArannaStarseekerBattlegrounds:
			return CardIds.SklibbDemonHunterBattlegrounds_TB_BaconShop_HERO_59_Buddy;
		case CardIds.ArchVillainRafaamBattlegrounds:
			return CardIds.LoyalHenchmanBattlegrounds_TB_BaconShop_HERO_45_Buddy;
		case CardIds.Brukan_BG22_HERO_001:
			return CardIds.SpiritRaptor;
		case CardIds.CaptainEudoraBattlegrounds:
			return CardIds.DagwikStickytoeBattlegrounds_TB_BaconShop_HERO_64_Buddy;
		case CardIds.CaptainHooktuskBattlegrounds:
			return CardIds.RagingContenderBattlegrounds_TB_BaconShop_HERO_67_Buddy;
		case CardIds.CarielRoame_BG21_HERO_000:
			return CardIds.CaptainFairmount;
		case CardIds.ChenvaalaBattlegrounds:
			return CardIds.SnowElementalBattlegrounds_TB_BaconShop_HERO_78_Buddy;
		case CardIds.CookieTheCook_BG21_HERO_020:
			return CardIds.SousChef;
		case CardIds.CthunBattlegrounds:
			return CardIds.TentacleOfCthunBattlegrounds_TB_BaconShop_HERO_29_Buddy;
		case CardIds.DancinDerylBattlegrounds:
			return CardIds.AsherTheHaberdasherBattlegrounds_TB_BaconShop_HERO_36_Buddy;
		case CardIds.DeathSpeakerBlackthorn_BG20_HERO_103:
			return CardIds.DeathsHeadSage;
		case CardIds.DeathwingBattlegrounds:
			return CardIds.LadySinestraBattlegrounds_TB_BaconShop_HERO_52_Buddy;
		case CardIds.DinotamerBrannBattlegrounds:
			return CardIds.BrannsEpicEggBattlegrounds_TB_BaconShop_HERO_43_Buddy;
		case CardIds.Drekthar_BG22_HERO_002:
			return CardIds.FrostwolfLieutenant;
		case CardIds.EdwinVancleefBattlegrounds:
			return CardIds.Si7ScoutBattlegrounds_TB_BaconShop_HERO_01_Buddy;
		case CardIds.EliseStarseekerBattlegrounds:
			return CardIds.JrNavigatorBattlegrounds_TB_BaconShop_HERO_42_Buddy;
		case CardIds.ForestWardenOmuBattlegrounds:
			return CardIds.EvergreenBotaniBattlegrounds_TB_BaconShop_HERO_74_Buddy;
		case CardIds.FungalmancerFlurglBattlegrounds:
			return CardIds.SparkfinSoothsayerBattlegrounds_TB_BaconShop_HERO_55_Buddy;
		case CardIds.GalakrondBattlegrounds:
			return CardIds.ApostleOfGalakrondBattlegrounds_TB_BaconShop_HERO_02_Buddy;
		case CardIds.Galewing:
			return CardIds.FlightTrainer;
		case CardIds.GeorgeTheFallenBattlegrounds:
			return CardIds.KarlTheLostBattlegrounds_TB_BaconShop_HERO_15_Buddy;
		case CardIds.GreyboughBattlegrounds:
			return CardIds.WanderingTreantBattlegrounds_TB_BaconShop_HERO_95_Buddy;
		case CardIds.GuffRunetotem_BG20_HERO_242:
			return CardIds.BabyKodo;
		case CardIds.IllidanStormrageBattlegrounds:
			return CardIds.EclipsionIllidariBattlegrounds_TB_BaconShop_HERO_08_Buddy;
		case CardIds.InfiniteTokiBattlegrounds:
			return CardIds.ClockworkAssistantBattlegrounds_TB_BaconShop_HERO_28_Buddy;
		case CardIds.JandiceBarovBattlegrounds:
			return CardIds.JandicesApprenticeBattlegrounds_TB_BaconShop_HERO_71_Buddy;
		case CardIds.KaelthasSunstriderBattlegrounds:
			return CardIds.CrimsonHandCenturionBattlegrounds_TB_BaconShop_HERO_60_Buddy;
		case CardIds.KingMuklaBattlegrounds:
			return CardIds.CrazyMonkeyBattlegrounds_TB_BaconShop_HERO_38_Buddy;
		case CardIds.KurtrusAshfallen_BG20_HERO_280:
			return CardIds.LivingNightmare;
		case CardIds.LichBazhialBattlegrounds:
			return CardIds.UnearthedUnderlingBattlegrounds_TB_BaconShop_HERO_25_Buddy;
		case CardIds.LordBarovBattlegrounds:
			return CardIds.BarovsApprenticeBattlegrounds_TB_BaconShop_HERO_72_Buddy;
		case CardIds.LordJaraxxusBattlegrounds:
			return CardIds.KilrekBattlegrounds_TB_BaconShop_HERO_37_Buddy;
		case CardIds.MaievShadowsongBattlegrounds:
			return CardIds.ShadowWardenBattlegrounds_TB_BaconShop_HERO_62_Buddy;
		case CardIds.MalygosBattlegrounds:
			return CardIds.NexusLordBattlegrounds_TB_BaconShop_HERO_58_Buddy;
		case CardIds.MasterNguyen:
			return CardIds.LeiFlamepaw_BG20_HERO_202_Buddy;
		case CardIds.MillhouseManastormBattlegrounds:
			return CardIds.MagnusManastormBattlegrounds_TB_BaconShop_HERO_49_Buddy;
		case CardIds.MillificentManastormBattlegrounds:
			return CardIds.ElementiumSquirrelBombBattlegrounds_TB_BaconShop_HERO_17_Buddy;
		case CardIds.MrBigglesworthBattlegrounds:
			return CardIds.LilKTBattlegrounds_TB_BaconShop_HERO_70_Buddy;
		case CardIds.MutanusTheDevourer_BG20_HERO_301:
			return CardIds.NightmareEctoplasm;
		case CardIds.NozdormuBattlegrounds:
			return CardIds.ChromieBattlegrounds_TB_BaconShop_HERO_57_Buddy;
		case CardIds.NzothBattlegrounds:
			return CardIds.BabyNzothBattlegrounds_TB_BaconShop_HERO_93_Buddy;
		case CardIds.OverlordSaurfang_BG20_HERO_102:
			return CardIds.DranoshSaurfang;
		case CardIds.PatchesThePirateBattlegrounds:
			return CardIds.TuskarrRaiderBattlegrounds_TB_BaconShop_HERO_18_Buddy;
		case CardIds.PatchwerkBattlegrounds:
			return CardIds.WeebominationBattlegrounds_TB_BaconShop_HERO_34_Buddy;
		case CardIds.PyramadBattlegrounds:
			return CardIds.TitanicGuardianBattlegrounds_TB_BaconShop_HERO_39_Buddy;
		case CardIds.QueenWagtoggleBattlegrounds:
			return CardIds.ElderTaggawagBattlegrounds_TB_BaconShop_HERO_14_Buddy;
		case CardIds.RagnarosTheFirelordBattlegrounds:
			return CardIds.LucifronBattlegrounds_TB_BaconShop_HERO_11_Buddy;
		case CardIds.RakanishuBattlegrounds:
			return CardIds.LanternTenderBattlegrounds_TB_BaconShop_HERO_75_Buddy;
		case CardIds.RenoJacksonBattlegrounds:
			return CardIds.SrTombDiverBattlegrounds_TB_BaconShop_HERO_41_Buddy;
		case CardIds.ScabbsCutterbutter_BG21_HERO_010:
			return CardIds.WardenThelwater_BG21_HERO_010_Buddy;
		case CardIds.ShudderwockBattlegrounds:
			return CardIds.MuckslingerBattlegrounds_TB_BaconShop_HERO_23_Buddy;
		case CardIds.SilasDarkmoonBattlegrounds:
			return CardIds.BurthBattlegrounds_TB_BaconShop_HERO_90_Buddy;
		case CardIds.SindragosaBattlegrounds:
			return CardIds.ThawedChampionBattlegrounds_TB_BaconShop_HERO_27_Buddy;
		case CardIds.SirFinleyMrrggltonBattlegrounds:
			return CardIds.MaxwellMightySteedBattlegrounds_TB_BaconShop_HERO_40_Buddy;
		case CardIds.SkycapnKraggBattlegrounds:
			return CardIds.SharkbaitBattlegrounds_TB_BaconShop_HERO_68_Buddy;
		case CardIds.Sneed_BG21_HERO_030:
			return CardIds.PilotedWhirlOTron;
		case CardIds.TamsinRoame_BG20_HERO_282:
			return CardIds.Monstrosity;
		case CardIds.TavishStormpike_BG22_HERO_000:
			return CardIds.Crabby_BG22_HERO_000_Buddy;
		case CardIds.TessGreymaneBattlegrounds:
			return CardIds.HunterOfOldBattlegrounds_TB_BaconShop_HERO_50_Buddy;
		case CardIds.TheCuratorBattlegrounds:
			return CardIds.MishmashBattlegrounds_TB_BaconShop_HERO_33_Buddy;
		case CardIds.TheGreatAkazamzarakBattlegrounds:
			return CardIds.StreetMagicianBattlegrounds_TB_BaconShop_HERO_21_Buddy;
		case CardIds.TheLichKingBattlegrounds:
			return CardIds.ArfusBattlegrounds_TB_BaconShop_HERO_22_Buddy;
		case CardIds.TheRatKingBattlegrounds:
			return CardIds.PigeonLordBattlegrounds_TB_BaconShop_HERO_12_Buddy;
		case CardIds.TickatusBattlegrounds:
			return CardIds.TicketCollectorBattlegrounds_TB_BaconShop_HERO_94_Buddy;
		case CardIds.TradePrinceGallywixBattlegrounds:
			return CardIds.BilgewaterMogulBattlegrounds_TB_BaconShop_HERO_10_Buddy;
		case CardIds.VanndarStormpike_BG22_HERO_003:
			return CardIds.StormpikeLieutenant;
		case CardIds.Voljin_BG20_HERO_201:
			return CardIds.MasterGadrin;
		case CardIds.Xyrella_BG20_HERO_101:
			return CardIds.BabyElekk_BG20_HERO_101_Buddy;
		case CardIds.YoggSaronHopesEndBattlegrounds:
			return CardIds.AcolyteOfYoggSaronBattlegrounds_TB_BaconShop_HERO_35_Buddy;
		case CardIds.YseraBattlegrounds:
			return CardIds.ValithriaDreamwalkerBattlegrounds_TB_BaconShop_HERO_53_Buddy;
		case CardIds.YshaarjBattlegrounds:
			return CardIds.BabyYshaarjBattlegrounds_TB_BaconShop_HERO_92_Buddy;
		case CardIds.ZephrysTheGreatBattlegrounds:
			return CardIds.PhyreszBattlegrounds_TB_BaconShop_HERO_91_Buddy;
		case CardIds.VardenDawngrasp_BG22_HERO_004:
			return CardIds.VardensAquarrior;
		case CardIds.Rokara_BG20_HERO_100:
			return CardIds.IcesnarlTheMighty;
		case CardIds.Onyxia_BG22_HERO_305:
			return CardIds.ManyWhelpsBattlegrounds;
		case CardIds.AmbassadorFaelin_BG22_HERO_201:
			return CardIds.SubmersibleChef;
		case CardIds.IniStormcoil_BG22_HERO_200:
			return CardIds.SubScrubber;
		default:
			console.error('missing buddy section for ', heroCardId);
			return null;
	}
};

// Because inconsistencies
const formatHeroNameForAchievements = (hero: ReferenceCard): string => {
	switch (hero?.id) {
		case CardIds.MaievShadowsongBattlegrounds:
			return 'Maiev';
		case CardIds.KingMuklaBattlegrounds:
			return 'Mukla';
		case CardIds.DinotamerBrannBattlegrounds:
			return 'Brann';
		case CardIds.ArannaStarseekerBattlegrounds:
			return 'Aranna';
		case CardIds.RagnarosTheFirelordBattlegrounds:
			return 'Ragnaros';
		case CardIds.AFKayBattlegrounds:
			return 'A.F.Kay'; // No whitespace
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
	const playerSupport = isSupportedScenarioForPlayer(battleInfo.playerBoard);
	const oppSupport = isSupportedScenarioForPlayer(battleInfo.opponentBoard);
	const result = {
		isSupported: playerSupport.isSupported && oppSupport.isSupported,
		reason: playerSupport.reason ?? oppSupport.reason,
	};
	if (
		battleInfo.playerBoard?.player?.heroPowerId === CardIds.PrestidigitationBattlegrounds ||
		battleInfo.opponentBoard?.player?.heroPowerId === CardIds.PrestidigitationBattlegrounds
	) {
		console.log('[bgs-simulation] is supported?', result);
	}
	return result;
};

const isSupportedScenarioForPlayer = (
	boardInfo: BgsBoardInfo,
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
		} else if (boardInfo?.secrets?.length > 0) {
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

const hasScallywag = (boardInfo: BgsBoardInfo) => {
	return (
		hasMinionOnBoard(boardInfo, CardIds.Scallywag) || hasMinionOnBoard(boardInfo, CardIds.ScallywagBattlegrounds)
	);
};

const hasPilotedWhirlOTron = (boardInfo: BgsBoardInfo) => {
	return (
		hasMinionOnBoard(boardInfo, CardIds.PilotedWhirlOTron) ||
		hasMinionOnBoard(boardInfo, CardIds.PilotedWhirlOTronBattlegrounds)
	);
};

const hasBaron = (boardInfo: BgsBoardInfo) => {
	return (
		hasMinionOnBoard(boardInfo, CardIds.BaronRivendare_FP1_031) ||
		hasMinionOnBoard(boardInfo, CardIds.BaronRivendareBattlegrounds)
	);
};

const hasStreetMagician = (boardInfo: BgsBoardInfo) => {
	return (
		hasMinionOnBoard(boardInfo, CardIds.StreetMagicianBattlegrounds_TB_BaconShop_HERO_21_Buddy) ||
		hasMinionOnBoard(boardInfo, CardIds.StreetMagicianBattlegrounds_TB_BaconShop_HERO_21_Buddy_G)
	);
};

const hasKhadgar = (boardInfo: BgsBoardInfo) => {
	return (
		hasMinionOnBoard(boardInfo, CardIds.Khadgar_DAL_575) ||
		hasMinionOnBoard(boardInfo, CardIds.KhadgarBattlegrounds)
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
			[GameTag[GameTag.REBORN]]: minion.reborn ? 1 : 0,
			[GameTag[GameTag.WINDFURY]]: minion.windfury || minion.megaWindfury ? 1 : 0,
			[GameTag[GameTag.MEGA_WINDFURY]]: minion.megaWindfury ? 1 : 0,
			[GameTag[GameTag.PREMIUM]]: allCards.getCard(minion.cardId)?.battlegroundsNormalDbfId ? 1 : 0,
		},
		// This probably won't work with positioning auras, but I don't think there are many
		// left (used to have Dire Wolf Alpha)
		enchantments: minion.enchantments,
	} as any);
};

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
