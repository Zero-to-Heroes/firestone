import { CardIds, Race, ReferenceCard } from '@firestone-hs/reference-data';
import { BgsBattleInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-battle-info';
import { BgsBoardInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-board-info';
import { CardsFacadeService } from '@services/cards-facade.service';
import { BattleInfoMessage } from '../../models/battlegrounds/battle-info-message.type';
import { VisualAchievement } from '../../models/visual-achievement';
import { capitalizeFirstLetter } from '../utils';

export const getTribeName = (tribe: Race): string => capitalizeFirstLetter(Race[tribe]?.toLowerCase());

export const getTribeIcon = (tribe: string | Race): string => {
	const referenceCardId = getReferenceTribeCardId(tribe);
	return `https://static.zerotoheroes.com/hearthstone/cardart/256x/${referenceCardId}.jpg`;
};

export const getReferenceTribeCardId = (tribe: string | Race): string => {
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
			referenceCardId = CardIds.Collectible.Warlock.Malganis1;
			break;
		case 'Dragon':
		case Race.DRAGON:
			referenceCardId = CardIds.NonCollectible.Neutral.RazorgoreTavernBrawl;
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
	return referenceCardId;
};

export const getHeroPower = (heroCardId: string): string => {
	switch (heroCardId) {
		case 'TB_BaconShop_HERO_01':
			return 'TB_BaconShop_HP_001';
		case 'TB_BaconShop_HERO_02':
			return 'TB_BaconShop_HP_011';
		case 'TB_BaconShop_HERO_08':
			return 'TB_BaconShop_HP_069';
		case CardIds.NonCollectible.Neutral.RagnarosTheFirelordBattlegrounds:
			return CardIds.NonCollectible.Neutral.DieInsectsBattlegrounds2;
		case 'TB_BaconShop_HERO_12':
			return 'TB_BaconShop_HP_041';
		case CardIds.NonCollectible.Neutral.QueenWagtoggleBattlegrounds:
			return CardIds.NonCollectible.Neutral.WaxWarbandBattlegrounds;
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
		case CardIds.NonCollectible.Neutral.CaptainHooktuskBattlegrounds:
			return CardIds.NonCollectible.Neutral.TrashForTreasureBattlegrounds;
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
		case CardIds.NonCollectible.Neutral.ChenvaalaBattlegrounds:
			return CardIds.NonCollectible.Neutral.AvalancheBattlegrounds;
		case CardIds.NonCollectible.Neutral.RakanishuBattlegrounds:
			return CardIds.NonCollectible.Neutral.TavernLightingBattlegrounds;
		case CardIds.NonCollectible.Neutral.AlakirBattlegrounds:
			return CardIds.NonCollectible.Neutral.SwattingInsectsBattlegrounds;
		case CardIds.NonCollectible.Neutral.ZephrysTheGreatBattlegrounds:
			return CardIds.NonCollectible.Neutral.ThreeWishesBattlegrounds;
		case CardIds.NonCollectible.Neutral.SilasDarkmoonBattlegrounds:
			return CardIds.NonCollectible.Neutral.ComeOneComeAllBattlegrounds;
		case CardIds.NonCollectible.Neutral.CthunBattlegrounds:
			return CardIds.NonCollectible.Neutral.SaturdayCthunsBattlegrounds;
		case CardIds.NonCollectible.Neutral.NzothBattlegrounds:
			return CardIds.NonCollectible.Neutral.AvatarOfNzothBattlegrounds;
		case CardIds.NonCollectible.Neutral.YshaarjBattlegrounds:
			return CardIds.NonCollectible.Neutral.EmbraceYourRageBattlegrounds;
		case CardIds.NonCollectible.Neutral.TickatusBattlegrounds:
			return CardIds.NonCollectible.Neutral.PrizeWallBattlegrounds;
		case CardIds.NonCollectible.Neutral.GreyboughBattlegrounds:
			return CardIds.NonCollectible.Neutral.SproutItOutBattlegrounds;
		case CardIds.NonCollectible.Neutral.OverlordSaurfang2:
			return CardIds.NonCollectible.Warrior.OverlordSaurfang_ForTheHorde;
		case CardIds.NonCollectible.Neutral.DeathSpeakerBlackthorn2:
			return CardIds.NonCollectible.Neutral.DeathSpeakerBlackthorn_Bloodbound;
		case CardIds.NonCollectible.Neutral.Voljin2:
			return CardIds.NonCollectible.Neutral.Voljin_SpiritSwap1;
		case CardIds.NonCollectible.Neutral.Xyrella2:
			return CardIds.NonCollectible.Priest.Xyrella_SeeTheLight;
		case CardIds.NonCollectible.Neutral.MutanusTheDevourer2:
			return CardIds.NonCollectible.Neutral.MutanusTheDevourer_Devour;
		case CardIds.NonCollectible.Druid.GuffRunetotem2:
			return CardIds.NonCollectible.Druid.GuffRunetotem_NaturalBalance;
		case CardIds.NonCollectible.Demonhunter.KurtrusAshfallen2:
			return CardIds.NonCollectible.Demonhunter.KurtrusAshfallen_FinalShowdown;
		case CardIds.NonCollectible.Neutral.Galewing:
			return CardIds.NonCollectible.Neutral.Galewing_DungarsGryphon;
		case CardIds.NonCollectible.Neutral.TradePrinceGallywixBattlegrounds:
			return CardIds.NonCollectible.Rogue.SmartSavingsBattlegrounds;
		case '':
			return null; // new heroes
	}
};

export const normalizeHeroCardId = (
	heroCardId: string,
	fullNormalize = false,
	allCards: CardsFacadeService = null,
): string => {
	if (!heroCardId) {
		return heroCardId;
	}

	// Generic handling of BG hero skins, hoping they will keep the same pattern
	// In fact, keep the hero skin. It will be up to all the data processing jobs to
	// properly map it to the correct base hero
	// TMP: deactivated until I have a way to generate the card images for the
	// new skins
	if (true || fullNormalize) {
		if (allCards) {
			const heroCard = allCards.getCard(heroCardId);
			if (!!heroCard?.battlegroundsHeroParentDbfId) {
				const parentCard = allCards.getCardFromDbfId(heroCard.battlegroundsHeroParentDbfId);
				if (!!parentCard) {
					return parentCard.id;
				}
			}
		}
		// Fallback to regex
		const bgHeroSkinMatch = heroCardId.match(/(.*)_SKIN_.*/);
		// console.debug('normalizing', heroCardId, bgHeroSkinMatch);
		if (bgHeroSkinMatch) {
			return bgHeroSkinMatch[1];
		}
	}

	switch (heroCardId) {
		case 'TB_BaconShop_HERO_59t':
			return 'TB_BaconShop_HERO_59';
		default:
			return heroCardId;
	}
};

export const getAllCardsInGame = (
	availableTribes: readonly Race[],
	allCards: CardsFacadeService,
): readonly ReferenceCard[] => {
	return allCards
		.getCards()
		.filter((card) => card.techLevel)
		.filter((card) => card.set !== 'Vanilla')
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
		case CardIds.NonCollectible.Neutral.PackLeader:
		case CardIds.NonCollectible.Neutral.PackLeaderBattlegrounds:
		case CardIds.Collectible.Druid.VirmenSensei:
		case CardIds.NonCollectible.Druid.VirmenSenseiBattlegrounds:
			return Race.BEAST;
		case CardIds.NonCollectible.Neutral.WrathWeaver:
		case CardIds.NonCollectible.Neutral.WrathWeaverBattlegrounds:
		case CardIds.NonCollectible.Warlock.SoulJuggler:
		case CardIds.NonCollectible.Warlock.SoulJugglerBattlegrounds:
			return Race.DEMON;
		case CardIds.NonCollectible.Neutral.WaxriderTogwaggle2:
		case CardIds.NonCollectible.Neutral.WaxriderTogwaggleBattlegrounds:
		case CardIds.NonCollectible.Neutral.NadinaTheRed:
		case CardIds.NonCollectible.Neutral.NadinaTheRedBattlegrounds:
			return Race.DRAGON;
		case CardIds.NonCollectible.Neutral.MajordomoExecutus3:
		case CardIds.NonCollectible.Neutral.MajordomoExecutusBattlegrounds:
		case CardIds.NonCollectible.Neutral.NomiKitchenNightmare:
		case CardIds.NonCollectible.Neutral.NomiKitchenNightmareBattlegrounds:
			return Race.ELEMENTAL;
		case CardIds.NonCollectible.Neutral.KangorsApprentice:
		case CardIds.NonCollectible.Neutral.KangorsApprenticeBattlegrounds:
			return Race.MECH;
		case CardIds.NonCollectible.Neutral.TheTideRazor:
		case CardIds.NonCollectible.Neutral.TheTideRazorBattlegrounds:
			return Race.PIRATE;
		case CardIds.NonCollectible.Neutral.AgamagganTheGreatBoar:
		case CardIds.NonCollectible.Neutral.AgamagganTheGreatBoarBattlegrounds:
		case CardIds.NonCollectible.Neutral.ProphetOfTheBoar:
		case CardIds.NonCollectible.Neutral.ProphetOfTheBoarBattlegrounds:
			return Race.QUILBOAR;
		default:
			return getEffectiveTribeEnum(card);
	}
};

export const getEffectiveTribe = (card: ReferenceCard, groupMinionsIntoTheirTribeGroup: boolean): string => {
	const tribe: Race = groupMinionsIntoTheirTribeGroup ? getTribeForInclusion(card) : getEffectiveTribeEnum(card);
	return Race[tribe];
};

export const getEffectiveTribeEnum = (card: ReferenceCard): Race => {
	return card.race ? Race[card.race.toUpperCase()] : Race.BLANK;
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
		case Race[Race.ALL]:
			return 9;
		case Race[Race.BLANK]:
			return 10;
	}
};

export const getAchievementsForHero = (
	heroCardId: string,
	heroAchievements: readonly VisualAchievement[],
	allCards: CardsFacadeService,
): readonly VisualAchievement[] => {
	const dbHero = allCards.getCard(heroCardId);
	const heroName = formatHeroNameForAchievements(dbHero);
	if (!heroName) {
		return [];
	}

	const searchName = `as ${heroName}`;
	return (heroAchievements ?? []).filter((ach) => ach.text.replace(/,/g, '').includes(searchName));
};

// Because inconsistencies
const formatHeroNameForAchievements = (hero: ReferenceCard): string => {
	switch (hero?.id) {
		case CardIds.NonCollectible.Neutral.MaievShadowsongBattlegrounds:
			return 'Maiev';
		case CardIds.NonCollectible.Neutral.KingMuklaBattlegrounds:
			return 'Mukla';
		case CardIds.NonCollectible.Neutral.DinotamerBrannBattlegrounds:
			return 'Brann';
		case CardIds.NonCollectible.Neutral.ArannaStarseekerBattlegrounds:
			return 'Aranna';
		case CardIds.NonCollectible.Neutral.RagnarosTheFirelordBattlegrounds:
			return 'Ragnaros';
		case CardIds.NonCollectible.Neutral.AFKayBattlegrounds:
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
		battleInfo.playerBoard?.player?.heroPowerId === CardIds.NonCollectible.Neutral.PrestidigitationBattlegrounds ||
		battleInfo.opponentBoard?.player?.heroPowerId === CardIds.NonCollectible.Neutral.PrestidigitationBattlegrounds
	) {
		console.log(
			'[bgs-simulation] is supported?',
			result,
			playerSupport,
			oppSupport,
			battleInfo?.playerBoard?.secrets,
			battleInfo?.opponentBoard?.secrets,
			battleInfo,
		);
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
		// if (hasScallywag(boardInfo) && (hasBaron(boardInfo) || hasKhadgar(boardInfo))) {
		// 	console.warn('[bgs-simulation] Unsupported Scallywag exodia, not reporting an error');
		// 	return {
		// 		isSupported: false,
		// 		reason: 'scallywag',
		// 	};
		// } else
		if (boardInfo?.secrets?.length > 0) {
			//console.debug('not supported');
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
		hasMinionOnBoard(boardInfo, CardIds.NonCollectible.Neutral.Scallywag) ||
		hasMinionOnBoard(boardInfo, CardIds.NonCollectible.Neutral.ScallywagBattlegrounds)
	);
};

const hasBaron = (boardInfo: BgsBoardInfo) => {
	return (
		hasMinionOnBoard(boardInfo, CardIds.Collectible.Neutral.BaronRivendare2) ||
		hasMinionOnBoard(boardInfo, CardIds.NonCollectible.Neutral.BaronRivendareBattlegrounds)
	);
};

const hasKhadgar = (boardInfo: BgsBoardInfo) => {
	return (
		hasMinionOnBoard(boardInfo, CardIds.Collectible.Mage.Khadgar1) ||
		hasMinionOnBoard(boardInfo, CardIds.NonCollectible.Mage.KhadgarBattlegrounds)
	);
};

const hasMinionOnBoard = (boardInfo: BgsBoardInfo, cardId: string): boolean => {
	if (!boardInfo?.board?.length) {
		return false;
	}

	return boardInfo.board.find((entity) => entity.cardId === cardId) != null;
};
