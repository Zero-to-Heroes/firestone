import { CardIds, Race } from '@firestone-hs/reference-data';
import { ReferenceCard } from '@firestone-hs/reference-data/lib/models/reference-cards/reference-card';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { BgsBattleInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-battle-info';
import { BgsBoardInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-board-info';
import { VisualAchievement } from '../../models/visual-achievement';

export const getTribeIcon = (tribe: string | Race): string => {
	let referenceCardId: string;
	switch (tribe) {
		case 'Mech':
		case Race.MECH:
			referenceCardId = CardIds.Collectible.Rogue.IronSensei;
			break;
		case 'Beast':
		case Race.BEAST:
			referenceCardId = CardIds.NonCollectible.Neutral.MamaBear;
			break;
		case 'Demon':
		case Race.DEMON:
			referenceCardId = CardIds.Collectible.Warlock.Malganis;
			break;
		case 'Dragon':
		case Race.DRAGON:
			referenceCardId = CardIds.NonCollectible.Neutral.Razorgore;
			break;
		case 'Murloc':
		case Race.MURLOC:
			referenceCardId = CardIds.NonCollectible.Neutral.KingBagurgle;
			break;
		case 'Pirate':
		case Race.PIRATE:
			referenceCardId = 'BGS_080';
			break;
		case 'Elemental':
		case Race.ELEMENTAL:
			referenceCardId = CardIds.NonCollectible.Neutral.LilRag;
			break;
		case 'Quilboar':
		case Race.QUILBOAR:
			referenceCardId = CardIds.NonCollectible.Neutral.Charlga;
			break;
		case 'All':
		case Race.ALL:
			referenceCardId = CardIds.NonCollectible.Neutral.Amalgadon;
			break;
		default:
			referenceCardId = CardIds.NonCollectible.Neutral.ZappSlywick;
			break;
	}
	return `https://static.zerotoheroes.com/hearthstone/cardart/256x/${referenceCardId}.jpg`;
};

export const getHeroPower = (heroCardId: string): string => {
	switch (heroCardId) {
		case 'TB_BaconShop_HERO_01':
			return 'TB_BaconShop_HP_001';
		case 'TB_BaconShop_HERO_02':
			return 'TB_BaconShop_HP_011';
		case 'TB_BaconShop_HERO_08':
			return 'TB_BaconShop_HP_069';
		case CardIds.NonCollectible.Neutral.RagnarosTheFirelordTavernBrawlBATTLEGROUNDS:
			return CardIds.NonCollectible.Neutral.DieInsectsTavernBrawl2;
		case 'TB_BaconShop_HERO_12':
			return 'TB_BaconShop_HP_041';
		case CardIds.NonCollectible.Neutral.QueenWagtoggleTavernBrawl:
			return CardIds.NonCollectible.Neutral.WaxWarbandTavernBrawl;
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
		case 'TB_BaconShop_HERO_44':
			return 'TB_BaconShop_HP_050';
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
		case CardIds.NonCollectible.Neutral.CaptainHooktuskTavernBrawl:
			return CardIds.NonCollectible.Neutral.TrashForTreasureTavernBrawl;
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
		case CardIds.NonCollectible.Neutral.ChenvaalaTavernBrawl:
			return CardIds.NonCollectible.Neutral.AvalancheTavernBrawl;
		case CardIds.NonCollectible.Neutral.RakanishuTavernBrawl2:
			return CardIds.NonCollectible.Neutral.TavernLightingTavernBrawl;
		case CardIds.NonCollectible.Neutral.AlakirTavernBrawl:
			return CardIds.NonCollectible.Neutral.SwattingInsectsTavernBrawl;
		case CardIds.NonCollectible.Neutral.ZephrysTheGreatTavernBrawl:
			return CardIds.NonCollectible.Neutral.ThreeWishesTavernBrawl;
		case CardIds.NonCollectible.Neutral.SilasDarkmoonTavernBrawl:
			return CardIds.NonCollectible.Neutral.ComeOneComeAllTavernBrawl;
		case CardIds.NonCollectible.Neutral.CthunTavernBrawl:
			return CardIds.NonCollectible.Neutral.SaturdayCthunsTavernBrawl;
		case CardIds.NonCollectible.Neutral.NzothTavernBrawl:
			return CardIds.NonCollectible.Neutral.AvatarOfNzothTavernBrawl;
		case CardIds.NonCollectible.Neutral.YshaarjTavernBrawl:
			return CardIds.NonCollectible.Neutral.EmbraceYourRageTavernBrawl;
		case CardIds.NonCollectible.Neutral.TickatusTavernBrawl:
			return CardIds.NonCollectible.Neutral.PrizeWallTavernBrawl;
		case CardIds.NonCollectible.Neutral.GreyboughTavernBrawl:
			return CardIds.NonCollectible.Neutral.SproutItOutTavernBrawl;
		case CardIds.NonCollectible.Neutral.OverlordSaurfang:
			return CardIds.NonCollectible.Warrior.OverlordSaurfang_ForTheHorde2;
		case CardIds.NonCollectible.Neutral.DeathSpeakerBlackthorn:
			return CardIds.NonCollectible.Neutral.DeathSpeakerBlackthorn_Bloodbound;
		case CardIds.NonCollectible.Neutral.Voljin:
			return CardIds.NonCollectible.Neutral.Voljin_SpiritSwap1;
		case CardIds.NonCollectible.Neutral.Xyrella:
			return CardIds.NonCollectible.Priest.Xyrella_SeeTheLight;
		case '':
			return null; // new heroes
	}
};

export const normalizeHeroCardId = (heroCardId: string): string => {
	if (heroCardId === 'TB_BaconShop_HERO_59t') {
		return 'TB_BaconShop_HERO_59';
	}
	return heroCardId;
};

const REMOVED_CARD_IDS = [
	'GVG_085', // Annoy-o-Tron
	'BGS_025', // Mounted Raptor
	'GIL_681', // Nightmare Amalgam
	'GVG_058', // Shielded Minibot
	'ULD_179', // Phallanx Commander
	'OG_145', // Psych-o-Tron
	'UNG_037', // Tortollian Shellraiser
	'GIL_655', // Festeroot Hulk
	'BGS_024', // Piloted Sky Golem
	'UNG_010', // Sated Threshadon
	'OG_300', // Boogeymonster
	CardIds.Collectible.Neutral.Zoobot,
	CardIds.NonCollectible.Neutral.ZoobotTavernBrawl,
	CardIds.Collectible.Neutral.MenagerieMagician,
	CardIds.NonCollectible.Neutral.MenagerieMagicianTavernBrawl,
	CardIds.Collectible.Paladin.CobaltGuardian,
	CardIds.NonCollectible.Neutral.GentleMegasaur,
	CardIds.NonCollectible.Neutral.GentleMegasaurTavernBrawl,
	CardIds.NonCollectible.Neutral.NatPagleExtremeAngler_TreasureChestToken,
	CardIds.NonCollectible.Neutral.NatPagleExtremeAngler_TreasureChestTokenTavernBrawl,
	CardIds.NonCollectible.Neutral.PilotedShredder,
	CardIds.NonCollectible.Neutral.PilotedShredderTavernBrawl,
	CardIds.Collectible.Neutral.WhirlwindTempest,
	CardIds.NonCollectible.Neutral.WhirlwindTempestTavernBrawl,
	CardIds.Collectible.Rogue.PogoHopper,
	CardIds.NonCollectible.Rogue.PogoHopperTavernBrawl,
	CardIds.Collectible.Paladin.RighteousProtector,
	CardIds.NonCollectible.Paladin.RighteousProtectorTavernBrawl,
	CardIds.Collectible.Neutral.TheBeast,
	CardIds.NonCollectible.Neutral.TheBeastTavernBrawl,
	CardIds.Collectible.Neutral.CrowdFavorite,
	CardIds.NonCollectible.Neutral.CrowdFavoriteTavernBrawl,
	CardIds.NonCollectible.Neutral.ShifterZerus,
	CardIds.NonCollectible.Neutral.ShifterZerusTavernBrawl,
	CardIds.Collectible.Warlock.FloatingWatcher,
	CardIds.NonCollectible.Warlock.FloatingWatcherTavernBrawl,
];

export const getAllCardsInGame = (
	availableTribes: readonly Race[],
	allCards: AllCardsService,
): readonly ReferenceCard[] => {
	return allCards
		.getCards()
		.filter((card) => card.techLevel)
		.filter((card) => card.set !== 'Vanilla')
		.filter((card) => !availableTribes?.length || isValidTribe(availableTribes, Race[getTribeForInclusion(card)]))
		.filter((card) => !card.id.startsWith('TB_BaconUps')); // Ignore golden
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
		case CardIds.NonCollectible.Neutral.PackLeader:
		case CardIds.NonCollectible.Neutral.PackLeaderTavernBrawl:
		case CardIds.Collectible.Druid.VirmenSensei:
		case CardIds.NonCollectible.Druid.VirmenSenseiTavernBrawl:
			return Race.BEAST;
		case CardIds.NonCollectible.Neutral.WrathWeaver:
		case CardIds.NonCollectible.Neutral.WrathWeaverTavernBrawl:
		case CardIds.NonCollectible.Warlock.SoulJuggler:
		case CardIds.NonCollectible.Warlock.SoulJugglerTavernBrawl:
			return Race.DEMON;
		case CardIds.NonCollectible.Neutral.WaxriderTogwaggle:
		case CardIds.NonCollectible.Neutral.WaxriderTogwaggleTavernBrawl:
		case CardIds.NonCollectible.Neutral.NadinaTheRed:
		case CardIds.NonCollectible.Neutral.NadinaTheRedTavernBrawl:
			return Race.DRAGON;
		case CardIds.NonCollectible.Neutral.MajordomoExecutusBATTLEGROUNDS:
		case CardIds.NonCollectible.Neutral.MajordomoExecutusTavernBrawl:
		case CardIds.NonCollectible.Neutral.NomiKitchenNightmare:
		case CardIds.NonCollectible.Neutral.NomiKitchenNightmareTavernBrawl:
			return Race.ELEMENTAL;
		case CardIds.NonCollectible.Neutral.KangorsApprentice:
		case CardIds.NonCollectible.Neutral.KangorsApprenticeTavernBrawl:
			return Race.MECH;
		case CardIds.NonCollectible.Neutral.TheTideRazor:
		case CardIds.NonCollectible.Neutral.TheTideRazorTavernBrawl:
			return Race.PIRATE;
		default:
			return getEffectiveTribeEnum(card);
	}
};

export const getEffectiveTribe = (card: ReferenceCard): string => {
	const tribe: Race = getEffectiveTribeEnum(card);
	return Race[tribe];
};

export const getEffectiveTribeEnum = (card: ReferenceCard): Race => {
	return card.race ? Race[card.race.toUpperCase()] : Race.BLANK;
};

export const getAchievementsForHero = (
	heroCardId: string,
	heroAchievements: readonly VisualAchievement[],
	allCards: AllCardsService,
): readonly VisualAchievement[] => {
	const dbHero = allCards.getCard(heroCardId);
	const heroName = formatHeroNameForAchievements(dbHero);
	if (!heroName) {
		return [];
	}

	const searchName = `as ${heroName}`;
	return heroAchievements.filter((ach) => ach.text.replace(/,/g, '').includes(searchName));
};

// Because inconsistencies
const formatHeroNameForAchievements = (hero: ReferenceCard): string => {
	switch (hero?.id) {
		case CardIds.NonCollectible.Neutral.MaievShadowsongTavernBrawl:
			return 'Maiev';
		case CardIds.NonCollectible.Neutral.KingMuklaTavernBrawl:
			return 'Mukla';
		case CardIds.NonCollectible.Neutral.DinotamerBrannTavernBrawl:
			return 'Brann';
		case CardIds.NonCollectible.Neutral.ArannaStarseekerTavernBrawl1:
			return 'Aranna';
		case CardIds.NonCollectible.Neutral.AFKayTavernBrawl:
			return 'A.F.Kay'; // No whitespace
		default:
			return hero?.name?.replace(/,/g, '');
	}
};

export const isSupportedScenario = (battleInfo: BgsBattleInfo): boolean => {
	return (
		isSupportedScenarioForPlayer(battleInfo.playerBoard) && isSupportedScenarioForPlayer(battleInfo.opponentBoard)
	);
};

const isSupportedScenarioForPlayer = (boardInfo: BgsBoardInfo): boolean => {
	try {
		if (hasScallywag(boardInfo) && (hasBaron(boardInfo) || hasKhadgar(boardInfo))) {
			console.warn('[bgs-simulation] Unsupported Scallywag exodia, not reporting an error');
			return false;
		}
		return true;
	} catch (e) {
		console.error('[bgs-simularion] Error when parsing board', e);
		return true;
	}
};

const hasScallywag = (boardInfo: BgsBoardInfo) => {
	return (
		hasMinionOnBoard(boardInfo, CardIds.NonCollectible.Neutral.Scallywag) ||
		hasMinionOnBoard(boardInfo, CardIds.NonCollectible.Neutral.ScallywagTavernBrawl)
	);
};

const hasBaron = (boardInfo: BgsBoardInfo) => {
	return (
		hasMinionOnBoard(boardInfo, CardIds.Collectible.Neutral.BaronRivendare) ||
		hasMinionOnBoard(boardInfo, CardIds.NonCollectible.Neutral.BaronRivendareTavernBrawl)
	);
};

const hasKhadgar = (boardInfo: BgsBoardInfo) => {
	return (
		hasMinionOnBoard(boardInfo, CardIds.Collectible.Mage.Khadgar) ||
		hasMinionOnBoard(boardInfo, CardIds.NonCollectible.Mage.KhadgarTavernBrawl)
	);
};

const hasMinionOnBoard = (boardInfo: BgsBoardInfo, cardId: string): boolean => {
	if (!boardInfo?.board?.length) {
		return false;
	}

	return boardInfo.board.find((entity) => entity.cardId === cardId) != null;
};
