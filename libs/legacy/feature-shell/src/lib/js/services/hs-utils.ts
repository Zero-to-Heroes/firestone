import {
	allDuelsHeroesExtended,
	BoosterType,
	CardClass,
	CardIds,
	GameTag,
	Race,
	ReferenceCard,
} from '@firestone-hs/reference-data';
import { PackResult } from '@firestone-hs/user-packs';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { CollectionCardType } from '../models/collection/collection-card-type.type';
import { tutors } from './decktracker/card-info/card-tutors';
import { giftCreators } from './decktracker/card-info/gift-creators';
import { LocalizationFacadeService } from './localization-facade.service';

// Don't specify anything by default, so that the "cache refresh" properly refreshes the data
// (it is query-specific).
// Only use a string in dev mode, otherwise rely on cache purge
// Actually, it looks relying on the CF cache doesn't work too well for the cards (while it
// works well in the browser, you sometimes get old data when getting it in the app). So the
// string will be used in Firestone only
export const CARDS_VERSION = '';

export const classes = [
	'deathknight',
	'demonhunter',
	'druid',
	'hunter',
	'mage',
	'paladin',
	'priest',
	'rogue',
	'shaman',
	'warlock',
	'warrior',
];
export const classesForPieChart = [
	'deathknight',
	'rogue',
	'druid',
	'hunter',
	'demonhunter',
	'paladin',
	'warrior',
	'warlock',
	'shaman',
	'mage',
	'priest',
];

/** @deprecated */
export const formatClass = (playerClass: string, i18n: { translateString: (string) => string }): string => {
	return i18n.translateString(`global.class.${playerClass?.toLowerCase()}`);
};

export const colorForClass = (playerClass: string): string => {
	switch (playerClass) {
		case 'deathknight':
			return '#6aaeb9';
		case 'demonhunter':
			return '#123B17';
		case 'druid':
			return '#664122';
		case 'hunter':
			return '#436612';
		case 'mage':
			return '#277BC2';
		case 'paladin':
			return '#D6951A';
		case 'priest':
			return '#AEB9D1';
		case 'rogue':
			return '#393A3D';
		case 'shaman':
			return '#1D2F75';
		case 'warrior':
			return '#9E2111';
		case 'warlock':
			return '#662A75';
	}
};

export const battlecryGlobalEffectCards = [
	CardIds.AldorAttendant,
	CardIds.AldorTruthseeker,
	CardIds.AlexandrosMograine,
	CardIds.ArchbishopBenedictus_CORE_ICC_215,
	CardIds.ArchbishopBenedictus_ICC_215,
	CardIds.ArchVillainRafaam_DAL_422,
	CardIds.AudioAmplifier,
	CardIds.BladeOfTheBurningSun,
	CardIds.CommandTheElements_StormcallerBrukanToken,
	CardIds.DarkInquisitorXanesh,
	CardIds.DarkPharaohTekahn,
	CardIds.DefendTheDwarvenDistrict_TavishMasterMarksmanToken,
	CardIds.DemonslayerKurtrusToken,
	CardIds.DrBoomMadGenius,
	CardIds.EliteTaurenChampion,
	CardIds.FrizzKindleroost,
	CardIds.FrostLichJaina_CORE_ICC_833,
	CardIds.FrostLichJaina_ICC_833,
	CardIds.UnearthedRaptor_GoldenMonkeyToken,
	CardIds.GoruTheMightree,
	CardIds.GraniteForgeborn,
	CardIds.HalduronBrightwing,
	CardIds.Helya,
	CardIds.HemetJungleHunter,
	CardIds.HobartGrapplehammer,
	CardIds.HobartGrapplehammer_WON_117,
	CardIds.InfiniteMurloc,
	CardIds.Inzah,
	CardIds.IronweaveBloodletterTavernBrawl,
	CardIds.JotunTheEternal,
	CardIds.LadyInWhite,
	CardIds.LadyPrestor_SW_078,
	CardIds.LordaeronAttendantToken,
	CardIds.LorekeeperPolkelt,
	CardIds.LorthemarTheron_RLK_593,
	CardIds.LothraxionTheRedeemedCore,
	CardIds.LothraxionTheRedeemed,
	CardIds.NeeruFireblade_BAR_919,
	CardIds.OdynPrimeDesignate,
	CardIds.OrderInTheCourt,
	CardIds.PrinceKeleseth_CORE_ICC_851,
	CardIds.PrinceKeleseth_ICC_851,
	CardIds.RadiantLightspawn,
	CardIds.RazaTheChained,
	CardIds.RiseToTheOccasion_LightbornCarielToken,
	CardIds.RottenRodent,
	CardIds.ShandoWildclaw, // TODO: only show the effect if the "beast in your deck +1/+1 option, is chosen"
	CardIds.SkulkingGeist_CORE_ICC_701,
	CardIds.SkulkingGeist_ICC_701,
	CardIds.Snapdragon,
	CardIds.SorcerersGambit_ArcanistDawngraspToken,
	CardIds.SowTheSeeds,
	CardIds.SowTheSeedsTavernBrawl,
	CardIds.AzsharanScavenger_SunkenScavengerToken,
	CardIds.AzsharanGardens_SunkenGardensToken,
	CardIds.TopiorTheShrubbagazzor,
	CardIds.TheDemonSeed_BlightbornTamsinToken,
	CardIds.TheStonewright,
	CardIds.ValdrisFelgorge,
	// CardIds.VampiricBlood_RLK_051,
	CardIds.WildheartGuff,
	CardIds.WyrmrestPurifier,
];

export const deathrattleGlobalEffectCards = [CardIds.BonelordFrostwhisper, CardIds.UnluckyPowderman_WW_367];

export const startOfGameGlobalEffectCards = [
	CardIds.GennGreymane_GIL_692,
	CardIds.BakuTheMooneater,
	CardIds.DarkbishopBenedictus,
	CardIds.DarkbishopBenedictusCore,
	CardIds.PrinceRenathal,
	CardIds.ChogallTwilightChieftain_YOG_530,
];

export const globalEffectCards = [
	...battlecryGlobalEffectCards,
	...startOfGameGlobalEffectCards,
	...deathrattleGlobalEffectCards,
	CardIds.BestialMadness_YOG_505,
	CardIds.BlackrockNRoll,
	CardIds.CelestialAlignment,
	CardIds.DeckOfChaos,
	CardIds.DeckOfLunacy,
	CardIds.DraconicMunitionTavernBrawl,
	CardIds.TheFiresOfZinAzshari,
	CardIds.Embiggen,
	// CardIds.GrandTotemEysor, // We handle the effects triggered instead of the card played
	CardIds.HornsOfFlameTavernBrawlToken,
	CardIds.HumbleBlessingsTavernBrawl,
	CardIds.IncantersFlow,
	CardIds.InfiniteArcaneTavernBrawlToken,
	CardIds.InvigoratingSermon,
	CardIds.LunasPocketGalaxy,
	CardIds.MenAtArmsTavernBrawlToken,
	CardIds.PursuitOfJustice,
	CardIds.ReductomaraToken,
	// CardIds.RelicOfDimensions,
	// CardIds.RelicOfExtinction,
	// CardIds.RelicOfPhantasms,
	CardIds.RenounceDarkness,
	CardIds.RaidTheDocks_SecureTheSuppliesToken, // Cap'n Rokara
	CardIds.SurvivalOfTheFittest,
	CardIds.StarlightGroove,
	CardIds.TheCavernsBelow_CrystalCoreToken,
	CardIds.TheDemonSeed_CompleteTheRitualToken, // BLightborn Tamsin
	CardIds.UpgradedPackMule,
	CardIds.Wildfire,
];

// Also whitelist in the parser
export const globalEffectPowers = [CardIds.DewProcess];
export const globalEffectPowersAlsoOpponent = [CardIds.DewProcess];

export const globalEffectTriggers = [
	{
		// There are actually several effects that are triggered (one for hand, deck and board)
		// We use only the deck one, as it's the one that is most likely to always be there
		// We could also create a brand new event on the parser side, but I'd rather first
		// see how other minions/effects will be handled in the future
		effectPrefab: 'DMF_GrandTotemAmikwe_Battlecry_DeckBoosh_Super.prefab',
		cardId: CardIds.GrandTotemEysorCore,
	},
	{
		effectPrefab: 'DMF_GrandTotemAmikwe_Battlecry_DeckBoosh_Super.prefab',
		cardId: CardIds.GrandTotemEysor,
	},
	{
		effectPrefab: 'AVFX_VannderSpike_Trigger_DeckAE_Super',
		cardId: CardIds.VanndarStormpike_AV_223,
	},
	{
		effectPrefab: 'ReuseFX_Holy_BuffImpact_Heal_Small_Super',
		cardId: CardIds.HopeOfQuelthalas,
	},
	{
		effectPrefab: 'ReuseFX_Blood_DeathKnight_BuffImpact_GainHealth_Medium_ConsumeCorpse_Super_SourceHero',
		cardId: CardIds.VampiricBlood_RLK_051,
	},
	{
		effectPrefab: 'ReuseFX_Blood_DeathKnight_BuffImpact_GainHealth_Small_Super_SourceHero',
		cardId: CardIds.VampiricBlood_RLK_051,
	},
];

export const globalEffectTriggersEffects = globalEffectTriggers.map((effect) => effect.effectPrefab);

export const globalEffectQuestlines = [
	{
		questStepCreated: CardIds.DefendTheDwarvenDistrict_TakeTheHighGroundToken,
		stepReward: CardIds.DefendTheDwarvenDistrict,
	},
	{
		questStepCreated: CardIds.DefendTheDwarvenDistrict_KnockEmDownToken,
		stepReward: CardIds.DefendTheDwarvenDistrict_TakeTheHighGroundToken,
	},
];

export const globalEffectQuestlinesTriggers = globalEffectQuestlines.map((effect) => effect.questStepCreated);

export const cardsRevealedWhenDrawn = [
	CardIds.AncientShade_AncientCurseToken,
	CardIds.BeneathTheGrounds_NerubianAmbushToken,
	CardIds.Chromie_BattleForMountHyjalToken,
	CardIds.Chromie_CullingOfStratholmeToken,
	CardIds.Chromie_EscapeFromDurnholdeToken,
	CardIds.Chromie_OpeningTheDarkPortalToken,
	CardIds.CurseOfAgony_AgonyToken,
	CardIds.DeckOfWonders_ScrollOfWonderToken,
	CardIds.EncumberedPackMule,
	CardIds.FaldoreiStrider_SpiderAmbush,
	CardIds.Framester_FramedToken,
	CardIds.DreadlichTamsin_FelRiftToken,
	CardIds.FlyBy_KadoomBotToken,
	CardIds.HakkarTheSoulflayer_CorruptedBloodToken,
	CardIds.IronJuggernaut_BurrowingMineToken,
	CardIds.PlaguedGrain_GrainCrateCoreToken,
	CardIds.PortalKeeper_FelhoundPortalToken,
	CardIds.SandTrap,
	CardIds.SchoolSpirits_SoulFragmentToken,
	CardIds.SeaforiumBomber_BombToken,
	CardIds.ShadowOfDeath_ShadowToken,
	CardIds.TheDarkness_DarknessCandleToken,
	CardIds.TicketMaster_TicketsToken,
	CardIds.TwistPlagueOfMurlocs_SurpriseMurlocsToken,
	CardIds.Undermine_ImprovisedExplosiveToken,
	CardIds.Undermine_ImprovisedExplosiveTavernBrawlToken,
	CardIds.Waxadred_WaxadredsCandleToken,
	CardIds.YseraUnleashed_DreamPortalToken,
];

// These are used to prevent info leaks in hand because we might know too much information
// Mostly useful when the opponent plays it
export const forcedHiddenCardCreators = [
	CardIds.Bibliomite,
	CardIds.Chameleos,
	CardIds.Eureka,
	CardIds.FromDeOtherSide,
	// CardIds.CoilfangConstrictor,
	// // Prevent the player from knowing too much about the opponent's hand when we play IT
	// // However, it has the side-effect of hiding the cards drawn by the opponent
	// CardIds.IdentityTheft,
	// CardIds.KoboldIllusionist,
	// CardIds.MadameLazul,
	CardIds.MaskOfMimicry,
	CardIds.MaskOfMimicryTavernBrawl,
	CardIds.NellieTheGreatThresher_NelliesPirateShipToken,
	// CardIds.MindVisionLegacy,
	// CardIds.MindVisionVanilla,
	// So that even "revealed when drawn" cards are not revelaed when plundered by Hooktusk
	CardIds.PirateAdmiralHooktusk_TakeTheirGoldToken,
	CardIds.PirateAdmiralHooktusk_TakeTheirShipToken,
	CardIds.PirateAdmiralHooktusk_TakeTheirSuppliesToken,
	// CardIds.PsychicConjurerCore,
	// CardIds.PsychicConjurerLegacy,
	CardIds.SpymastersGambitTavernBrawlToken,
	// CardIds.TheotarTheMadDuke,
];

// These are used to prevent info leaks in hand because we might know too much information
// But only when the player plays it
export const hideInfoWhenPlayerPlaysIt = [
	CardIds.Chameleos,
	CardIds.CoilfangConstrictor,
	// Prevent the player from knowing too much about the opponent's hand when we play IT
	// However, it has the side-effect of hiding the cards drawn by the opponent
	CardIds.GhastlyGravedigger,
	CardIds.IdentityTheft,
	CardIds.IncriminatingPsychic,
	CardIds.KoboldIllusionist,
	CardIds.MadameLazul,
	CardIds.MindVisionLegacy,
	CardIds.MindVisionVanilla,
	CardIds.PsychicConjurerCore,
	CardIds.PsychicConjurerLegacy,
	CardIds.RenosCraftyLasso,
	CardIds.RenosCraftyLassoTavernBrawl,
	CardIds.TheotarTheMadDuke,
];

export const forceHideInfoWhenDrawnInfluencers = [
	// Doesn't trigger Mankrik's Wife, so it probably behaves like Secret Passage
	CardIds.TrackingCore,
	CardIds.TrackingLegacy,
	CardIds.TrackingVanilla,
	// From what I've tested, Glide / Plot Twist seem to behave properly (cast when drawn
	// effects apply)
	CardIds.SecretPassage,
	// Cards that discover a card in your deck do count as drawing but cards that discover a copy do not.
	CardIds.ShadowVisions,
];

export const cardsConsideredPublic = [CardIds.LibramOfWisdom_BT_025, CardIds.LibramOfWisdom_Story_01_LibramofWisdom];

// Only use it for cards that create cards in hand. If used for cards that create cards in deck,
// this will lead to an info leak, as we use this array to decide whether a created card should
// be considered "known", meaning we can safely show the info in the opponent's hand
const publicCardGiftCreators = giftCreators;

// You draw something, but you don't know the exact card
export const cardTutors = tutors;

// You know the exact card drawn
export const publicTutors = [
	CardIds.ConquerorsBanner,
	CardIds.FelLordBetrug_DAL_607, // don't know if you're talking about the card in hand or the minion summoned
	CardIds.IceTrap,
	CardIds.BeaststalkerTavish_ImprovedIceTrapToken,
	CardIds.KingsElekk,
	CardIds.KronxDragonhoof,
	CardIds.Parrrley_DED_005, // the parrrley generated by parrrley is a gift, though
	CardIds.Parrrley_Story_11_ParrrleyPuzzle, // the parrrley generated by parrrley is a gift, though
	CardIds.RavenFamiliar_LOOT_170,
	CardIds.SouthseaScoundrel_BAR_081, // the copy for the opponent is the original card, the copy for the player is created
	CardIds.SouthseaScoundrel_Story_11_SouthseaPuzzle, // the copy for the opponent is the original card, the copy for the player is created
];

export const publicCardInfos = [...cardsConsideredPublic, ...publicCardGiftCreators, ...publicTutors];

export const publicCardCreators = [...cardsConsideredPublic, ...publicCardGiftCreators, ...cardTutors, ...publicTutors];

// Some cards auto-generate themselves, in a way that doesn't link a creator / influenced by
export const specialCasePublicCardCreators = [CardIds.HeadcrackLegacy, CardIds.HeadcrackVanilla];

export const CARDS_THAT_IMPROVE_WHEN_TRADED = [
	CardIds.AmuletOfUndying,
	CardIds.BlacksmithingHammer,
	CardIds.WickedShipment,
];

export const supportedAdditionalData = [
	CardIds.Ignite,
	CardIds.RenosMagicalTorchTavernBrawl,
	CardIds.Bottomfeeder,
	CardIds.SirakessCultist_AbyssalCurseToken,
	CardIds.StudentOfTheStars,
	...CARDS_THAT_IMPROVE_WHEN_TRADED,
];

export const getGalakrondCardFor = (cardClass: CardClass, invokeCount: number): string => {
	switch (cardClass) {
		case CardClass.PRIEST:
			if (invokeCount >= 4) {
				return CardIds.GalakrondTheUnspeakable_GalakrondAzerothsEndToken;
			} else if (invokeCount >= 2) {
				return CardIds.GalakrondTheUnspeakable_GalakrondTheApocalypseToken;
			}
			return CardIds.GalakrondTheUnspeakable;
		case CardClass.ROGUE:
			if (invokeCount >= 4) {
				return CardIds.GalakrondTheNightmare_GalakrondAzerothsEndToken;
			} else if (invokeCount >= 2) {
				return CardIds.GalakrondTheNightmare_GalakrondTheApocalypseToken;
			}
			return CardIds.GalakrondTheNightmare;
		case CardClass.SHAMAN:
			if (invokeCount >= 4) {
				return CardIds.GalakrondTheTempest_GalakrondAzerothsEndToken;
			} else if (invokeCount >= 2) {
				return CardIds.GalakrondTheTempest_GalakrondTheApocalypseToken;
			}
			return CardIds.GalakrondTheTempest;
		case CardClass.WARLOCK:
			if (invokeCount >= 4) {
				return CardIds.GalakrondTheWretched_GalakrondAzerothsEndToken;
			} else if (invokeCount >= 2) {
				return CardIds.GalakrondTheWretched_GalakrondTheApocalypseToken;
			}
			return CardIds.GalakrondTheWretched;
		case CardClass.WARRIOR:
			if (invokeCount >= 4) {
				return CardIds.GalakrondTheUnbreakable_GalakrondAzerothsEndToken;
			} else if (invokeCount >= 2) {
				return CardIds.GalakrondTheUnbreakable_GalakrondTheApocalypseToken;
			}
			return CardIds.GalakrondTheUnbreakable;
	}
	return null;
};

/** @deprecated */
export const dustFor = (rarity: string, cardType: CollectionCardType): number => {
	return cardType === 'NORMAL' ? dustForNormal(rarity) : dustForPremium(rarity);
};

/** @deprecated */
const dustForNormal = (rarity: string): number => {
	switch (rarity?.toLowerCase()) {
		case 'legendary':
			return 400;
		case 'epic':
			return 100;
		case 'rare':
			return 20;
		default:
			return 5;
	}
};

/** @deprecated */
const dustForPremium = (rarity: string): number => {
	return 4 * dustForNormal(rarity?.toLowerCase());
};

/** @deprecated */
export const dustToCraftFor = (rarity: string): number => {
	switch (rarity?.toLowerCase()) {
		case 'legendary':
			return 1600;
		case 'epic':
			return 400;
		case 'rare':
			return 100;
		default:
			return 40;
	}
};

/** @deprecated */
export const dustToCraftForPremium = (rarity: string): number => {
	return 4 * dustToCraftFor(rarity?.toLowerCase());
};

/** @deprecated */
export const getPackDustValue = (pack: PackResult): number => {
	return pack.boosterId === BoosterType.MERCENARIES
		? pack.cards.map((card) => card.currencyAmount ?? 0).reduce((a, b) => a + b, 0)
		: pack.cards.map((card) => dustFor(card.cardRarity, card.cardType)).reduce((a, b) => a + b, 0);
};

export const COUNTERSPELLS = [
	CardIds.CounterspellLegacy,
	CardIds.CounterspellCore,
	CardIds.CounterspellVanilla,
	CardIds.OhMyYogg,
	CardIds.IceTrap,
	CardIds.BeaststalkerTavish_ImprovedIceTrapToken,
	// Even though it's a specific enchantment that counters the spell, the trigger entity is the minion itself
	CardIds.BlademasterOkani,
	CardIds.Objection,
];

export const getDefaultHeroDbfIdForClass = (playerClass: string): number => {
	switch (playerClass?.toLowerCase()) {
		case 'deathknight':
			return 78065;
		case 'demonhunter':
			return 56550;
		case 'druid':
			return 274;
		case 'hunter':
			return 31;
		case 'mage':
			return 637;
		case 'paladin':
			return 671;
		case 'priest':
			return 813;
		case 'rogue':
			return 930;
		case 'shaman':
			return 1066;
		case 'warlock':
			return 893;
		case 'warrior':
			return 7;
		default:
			console.warn('Could not normalize hero card id', playerClass);
			return 7;
	}
};

export const normalizeDeckHeroDbfId = (
	heroDbfId: number,
	cards: CardsFacadeService,
	duelsClass?: CardClass,
	// Should probably not be needed, but it's a safeguard in case we can't figure out the class from the Duels sign treasure
	deckClass?: CardClass,
): number => {
	const cardFromHeroDbfId = cards.getCardFromDbfId(heroDbfId);
	// Don't normalize the dual-class heroes
	switch (cardFromHeroDbfId.id) {
		// Sometimes a neutral hero is provided even though the deck has class cards
		case CardIds.VanndarStormpikeTavernBrawl:
			switch (duelsClass ?? deckClass) {
				case CardClass.DEMONHUNTER:
					return cards.getCard(CardIds.VanndarStormpike_VanndarStormpikeTavernBrawl_PVPDR_Hero_Vanndarv1)
						.dbfId;
				case CardClass.HUNTER:
					return cards.getCard(CardIds.VanndarStormpike_VanndarStormpikeTavernBrawl_PVPDR_Hero_Vanndarv2)
						.dbfId;
				case CardClass.PALADIN:
					return cards.getCard(CardIds.VanndarStormpike_VanndarStormpikeTavernBrawl_PVPDR_Hero_Vanndarv3)
						.dbfId;
				case CardClass.PRIEST:
					return cards.getCard(CardIds.VanndarStormpike_VanndarStormpikeTavernBrawl_PVPDR_Hero_Vanndarv4)
						.dbfId;
				case CardClass.ROGUE:
					return cards.getCard(CardIds.VanndarStormpike_VanndarStormpikeTavernBrawl_PVPDR_Hero_Vanndarv5)
						.dbfId;
			}
			break;
		case CardIds.DrektharTavernBrawl:
			switch (duelsClass ?? deckClass) {
				case CardClass.DRUID:
					return cards.getCard(CardIds.Drekthar_DrektharTavernBrawl_PVPDR_Hero_DrekTharv1).dbfId;
				case CardClass.MAGE:
					return cards.getCard(CardIds.Drekthar_DrektharTavernBrawl_PVPDR_Hero_DrekTharv2).dbfId;
				case CardClass.SHAMAN:
					return cards.getCard(CardIds.Drekthar_DrektharTavernBrawl_PVPDR_Hero_DrekTharv3).dbfId;
				case CardClass.WARLOCK:
					return cards.getCard(CardIds.Drekthar_DrektharTavernBrawl_PVPDR_Hero_DrekTharv4).dbfId;
				case CardClass.WARRIOR:
					return cards.getCard(CardIds.Drekthar_DrektharTavernBrawl_PVPDR_Hero_DrekTharv5).dbfId;
			}
			break;
	}

	// No need for further normalization, all heroes are supported in Duels
	if (duelsClass || allDuelsHeroesExtended.includes(cardFromHeroDbfId.id as CardIds)) {
		return heroDbfId;
	}

	const playerClass: CardClass = CardClass[cards.getCardFromDbfId(heroDbfId)?.playerClass?.toUpperCase()];
	// Not sure this should happen anymore now that all Duels heroes are supported
	if (!playerClass) {
		return heroDbfId;
	}

	// Used for all the skins
	switch (playerClass) {
		case CardClass.DEATHKNIGHT:
			return 78065;
		case CardClass.DEMONHUNTER:
			return 56550;
		case CardClass.DRUID:
			return 274;
		case CardClass.HUNTER:
			return 31;
		case CardClass.MAGE:
			return 637;
		case CardClass.PALADIN:
			return 671;
		case CardClass.PRIEST:
			return 813;
		case CardClass.ROGUE:
			return 930;
		case CardClass.SHAMAN:
			return 1066;
		case CardClass.WARLOCK:
			return 893;
		case CardClass.WARRIOR:
			return 7;
		default:
			// Keep the neutral heroes
			return heroDbfId;
	}
};

export const ladderRankToInt = (rank: string): number => {
	if (!rank?.length || !rank.includes('-')) {
		return null;
	}

	if (rank.includes('legend-')) {
		// So that top 1 is at the top
		return +rank.split('legend-')[1];
	}

	const [league, rankInLeague] = rank.split('-').map((info) => parseInt(info));
	return -(league - 5) * 10 + (10 - rankInLeague);
};

export const ladderIntRankToString = (rank: number, isLegend: boolean, i18n: LocalizationFacadeService): string => {
	if (rank == null) {
		return null;
	}

	if (isLegend) {
		return `${rank}`;
	}

	const league = rankToLeague(rank, i18n);
	if (rank >= 50) {
		return i18n.translateString('global.ranks.constructed.legend');
	}

	const rankInLeague = 10 - (rank % 10);
	return `${league} ${rankInLeague}`;
};

const rankToLeague = (rank: number, i18n: LocalizationFacadeService): string => {
	if (rank < 10) {
		return i18n.translateString('global.ranks.constructed.bronze');
	} else if (rank < 20) {
		return i18n.translateString('global.ranks.constructed.silver');
	} else if (rank < 30) {
		return i18n.translateString('global.ranks.constructed.gold');
	} else if (rank < 40) {
		return i18n.translateString('global.ranks.constructed.platinum');
	} else if (rank < 50) {
		return i18n.translateString('global.ranks.constructed.diamond');
	}
	return i18n.translateString('global.ranks.constructed.legend');
};

export const hasRace = (card: ReferenceCard, race: Race): boolean => {
	return card?.races?.includes(Race[race]) || card?.races?.includes(Race[Race.ALL]);
};

export const isCastWhenDrawn = (cardId: string, allCards: CardsFacadeService): boolean => {
	return (
		cardsRevealedWhenDrawn.includes(cardId as CardIds) ||
		allCards.getCard(cardId)?.mechanics?.includes(GameTag[GameTag.TOPDECK])
	);
};
