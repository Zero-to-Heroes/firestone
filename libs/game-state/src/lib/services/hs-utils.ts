import { BoosterType, CardClass, CardIds, GameTag, Race, ReferenceCard } from '@firestone-hs/reference-data';
import { CollectionCardType, PackResult } from '@firestone-hs/user-packs';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { bwonsamdiBoonsEnchantments } from '../related-cards/dynamic-pools';
import { tutors } from './cards/card-tutors';
import { giftCreators } from './cards/gift-creators';
import { currentEffectsInternal } from './current-effects';

/** Re-export: defined in power-log-parser so `Oracle` can use it without importing game-state (avoids circular deps). */
export { SHATTER_HAND_PIECE_CREATOR_FALLBACK_CARD_IDS } from '@firestone/power-log-parser';

// Used for cache purposes, only in dev
export const CARDS_VERSION = '36.0.0';
export const isPreReleaseBuild = false;
export const isDualClassArena = false;

/** @deprecated use ALL_CLASSES */
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
	return '';
};
export const classForTribe = (tribe: Race): CardClass => {
	switch (tribe) {
		case Race.ELEMENTAL:
			return CardClass.MAGE;
		case Race.BEAST:
			return CardClass.HUNTER;
		case Race.PIRATE:
			return CardClass.ROGUE;
		case Race.MURLOC:
			return CardClass.SHAMAN;
		case Race.QUILBOAR:
			return CardClass.DRUID;
		case Race.UNDEAD:
			return CardClass.DEATHKNIGHT;
		case Race.DRAGON:
			return CardClass.WARRIOR;
		case Race.DEMON:
			return CardClass.WARLOCK;
		case Race.MECH:
			return CardClass.PALADIN;
		case Race.NAGA:
			return CardClass.DEMONHUNTER;
		default:
			return CardClass.INVALID;
	}
};

// TODO: we should probably have the C# parser return an event for POWER blocks being sent, and use this
export const battlecryGlobalEffectCards = [
	CardIds.AlexandrosMograine,
	CardIds.ArchbishopBenedictus_CORE_ICC_215,
	CardIds.ArchbishopBenedictus_ICC_215,
	CardIds.ArchVillainRafaam_DAL_422,
	CardIds.ArchVillainRafaam_CORE_DAL_422,
	// CardIds.Artanis_SC_754,
	CardIds.AudioAmplifier,
	CardIds.BladeOfTheBurningSun,
	CardIds.BolideBehemoth_GDB_434,
	CardIds.CardboardGolem_TOY_809,
	CardIds.CommandTheElements_StormcallerBrukanToken,
	CardIds.DarkInquisitorXanesh,
	CardIds.DarkPharaohTekahn,
	CardIds.DeepminerBrann_DEEP_020,
	CardIds.DefendTheDwarvenDistrict_TavishMasterMarksmanToken,
	CardIds.DemonslayerKurtrusToken,
	CardIds.DrBoomMadGenius,
	CardIds.ForebodingFlame_GDB_121,
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
	// CardIds.JotunTheEternal,
	CardIds.JungleGiants_BarnabusTheStomperToken,
	CardIds.LadyInWhite,
	CardIds.LadyPrestor_SW_078,
	CardIds.LorekeeperPolkelt,
	CardIds.LorthemarTheron_RLK_593,
	CardIds.LothraxionTheRedeemedCore,
	CardIds.LothraxionTheRedeemed,
	CardIds.NeeruFireblade_BAR_919,
	CardIds.OdynPrimeDesignate,
	CardIds.OrderInTheCourt,
	CardIds.PrinceKeleseth_CORE_ICC_851,
	CardIds.PrinceKeleseth_ICC_851,
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
	CardIds.TheAzeriteDragonToken_DEEP_999t4,
	CardIds.TheAzeriteMurlocToken_DEEP_999t5,
	CardIds.TheDemonSeed_BlightbornTamsinToken,
	CardIds.TheStonewright,
	CardIds.ValdrisFelgorge,
	CardIds.WyrmrestPurifier,
	// Below this: use POWER blocks (I have made sure their effects have a POWER block)
	CardIds.Vyranoth_CATA_213,
	CardIds.Ebyssian_CATA_553,
	CardIds.Ebyssian_EbyssianToken_CATA_553t,
	CardIds.LadyAshvane_TSC_943,
];

export const deathrattleGlobalEffectCards = [
	CardIds.BonelordFrostwhisper,
	CardIds.Infestor_SC_002,
	CardIds.JadeDisplay_TOY_803,
	CardIds.Therazane_DEEP_036,
	CardIds.UnluckyPowderman_WW_367,
	CardIds.Seismopod_DINO_421,
	CardIds.InfiniteWolf,
];

export const startOfGameGlobalEffectCards = [
	CardIds.GennGreymane_GIL_692,
	CardIds.BakuTheMooneater,
	CardIds.DarkbishopBenedictus,
	CardIds.DarkbishopBenedictusCore,
	CardIds.ChogallTwilightChieftain_YOG_530,
	CardIds.HamuulRunetotem_EDR_845,
	CardIds.PrinceRenathal,
	CardIds.PrinceRenathal_CORE_REV_018,
	CardIds.DragonSoulShattered_CATA_EVENT_110,
	CardIds.AyaLotusKingpin_JAIL_504,
	CardIds.ChefNethrek_JAIL_860,
];

export const globalEffectCardsPlayed = [
	...battlecryGlobalEffectCards,
	CardIds.ApocalypseTavernBrawlToken,
	CardIds.JourneyToTheEast_UberApocalypseTavernBrawl,
	CardIds.BestialMadness_YOG_505,
	CardIds.BlackrockNRoll,
	CardIds.CelestialAlignment,
	CardIds.DeckOfChaos,
	CardIds.DeckOfLunacy,
	CardIds.DraconicMunitionTavernBrawl,
	CardIds.TheFiresOfZinAzshari,
	CardIds.Embiggen,
	CardIds.Ensmallen_TOY_805,
	// CardIds.GrandTotemEysor, // We handle the effects triggered instead of the card played
	CardIds.HornsOfFlameTavernBrawlToken,
	CardIds.HumbleBlessingsTavernBrawl,
	CardIds.IncantersFlow,
	CardIds.InfiniteArcaneTavernBrawlToken,
	CardIds.InvigoratingSermon,
	CardIds.LunasPocketGalaxy,
	CardIds.MenAtArmsTavernBrawlToken,
	CardIds.PursuitOfJustice,
	CardIds.Quasar_GDB_467,
	CardIds.ReductomaraToken,
	CardIds.RenounceDarkness,
	CardIds.RaidTheDocks_SecureTheSuppliesToken, // Cap'n Rokara
	CardIds.SurvivalOfTheFittest,
	CardIds.StarlightGroove,
	CardIds.SurrenderToMadness,
	CardIds.SupremeDinomancy_TLC_828,
	CardIds.TheCavernsBelow_CrystalCoreToken,
	CardIds.TheDemonSeed_CompleteTheRitualToken, // BLightborn Tamsin
	CardIds.UpgradedPackMule,
	CardIds.Wildfire,
	CardIds.WishUponAStar_TOY_877,
];
const globalEffectEnchantments = [
	CardIds.UnleashTheColossus_GorishisFavorEnchantment_TLC_631e,
	CardIds.AshalonRidgeGuardian_PerfectEvolutionEnchantment_TLC_229t14e,
	CardIds.LohTheLivingLegend_LivingLegendEnchantment_TLC_257e1,
	...bwonsamdiBoonsEnchantments,
	CardIds.AvianaElunesChosen_FullMoonEnchantment_EDR_895e,
	CardIds.Kiljaeden_KiljaedensPortalEnchantment_GDB_145e,
	CardIds.LieInWait_MasterDuskReshufflePlayerEnchantEnchantment_TLC_513e2,
	CardIds.AlexstraszaGuardianOfLife_CleansedOfCorruptionEnchantment_CATA_307e,
	CardIds.CommanderGeddon_BarrenEnchantment_CATA_591e,
	CardIds.CleansingCleric_FreeFromCorruptionEnchantment_CATA_216e,
	CardIds.JotunTheEternal_JotunsSwiftnessEnchantmentToken,
	// CardIds.CityChiefEsho_KinEnchantment_TLC_110e, // The enchantment is applied to each card, so we don't have a global thing
];

export const globalEffectCards = [
	...globalEffectCardsPlayed,
	...startOfGameGlobalEffectCards,
	...deathrattleGlobalEffectCards,
	...globalEffectEnchantments,
];

// Also whitelist in the parser
export const globalEffectPowers = [CardIds.DewProcess, CardIds.DewProcess_CORE_MAW_024];
export const globalEffectPowersAlsoOpponent = [CardIds.DewProcess, CardIds.DewProcess_CORE_MAW_024];

export const globalEffectTriggers: { effectPrefab: string; cardId: string; forceUseParentInfo?: boolean }[] = [
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
		effectPrefab: 'ReuseFX_Beast_Impact_FangBite_Gold_Super',
		cardId: CardIds.GroovyCat,
	},
	{
		effectPrefab: 'ReuseFX_Beast_BuffImpact_Paw_Super',
		cardId: CardIds.FreeSpirit,
	},
	{
		effectPrefab: 'TIME_609t2_Vereesa_DeckAE_Super',
		cardId: CardIds.RangerGeneralSylvanas_RangerInitiateVereesaToken_TIME_609t2,
	},
	{
		effectPrefab: 'TLCFX_CityChiefEsho_BuffAE_DeckBoardandHand_Super',
		cardId: CardIds.CityChiefEsho_TLC_110,
	},
	{
		effectPrefab: 'ReuseFX_Nature_DeckAndHandAE_WithBuffImpact_Super',
		cardId: CardIds.Turbulus_WORK_013,
	},
	{
		effectPrefab: 'CATAFX_ArchmageKalec_Hand_AE_Super',
		cardId: CardIds.ArchmageKalec_CATA_458,
	},
	{
		effectPrefab: 'JAILFX_Godfrey_StartOfGame_FX',
		cardId: CardIds.GodfreytheBetrayer_JAIL_509,
	},
	{
		effectPrefab: 'JAIL_719_IridaSinseeker_FAB_DeckAE_Super',
		cardId: CardIds.IridaSinseeker_JAIL_719,
	},
	// {
	// 	effectPrefab: 'EDRFX_AvianaElunesChosen_StartOfTurnComplete',
	// 	cardId: CardIds.AvianaElunesChosen_MoonCycleEnchantmentToken_EDR_895t,
	// },
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

export const getCardForCurrentEffect = (cardId: CardIds | string | null | undefined): string | null => {
	switch (cardId) {
		case CardIds.DistressedKvaldir_FrostFeverEnchantment_TTN_450e:
			return CardIds.DistressedKvaldir_FrostPlagueToken;
		case CardIds.PetalPicker_ManaBloomEnchantment_FIR_921e:
			return CardIds.EmberscarredWhelp_FIR_927;
		default:
			return null;
	}
};

export const getCardForGlobalEffect = (cardId: CardIds): string => {
	switch (cardId) {
		case CardIds.Kiljaeden_KiljaedensPortalEnchantment_GDB_145e:
			return CardIds.Kiljaeden_GDB_145;
		case CardIds.UnleashTheColossus_GorishisFavorEnchantment_TLC_631e:
			return CardIds.UnleashTheColossus_GorishiColossusToken_TLC_631t;
		case CardIds.TalanjiOfTheGraves_BoonOfPowerPlayerEnchEnchantment_TIME_619e:
			return CardIds.TalanjiOfTheGraves_BoonOfPowerToken_TIME_619t3;
		case CardIds.TalanjiOfTheGraves_BoonOfSpeedPlayerEnchEnchantment_TIME_619e3:
			return CardIds.TalanjiOfTheGraves_BoonOfSpeedToken_TIME_619t5;
		case CardIds.TalanjiOfTheGraves_BoonOfLongevityPlayerEnchEnchantment_TIME_619e2:
			return CardIds.TalanjiOfTheGraves_BoonOfLongevityToken_TIME_619t4;
		case CardIds.LieInWait_MasterDuskReshufflePlayerEnchantEnchantment_TLC_513e2:
			return CardIds.LieInWait_MasterDuskToken_TLC_513t;
		case CardIds.JotunTheEternal_JotunsSwiftnessEnchantmentToken:
			return CardIds.JotunTheEternal;
		default:
			if (cardId.endsWith('e')) {
				// This is a global effect enchantment, so we return the card id without the "e" at the end
				return cardId.slice(0, -1);
			}
			if (cardId.endsWith('e1')) {
				// This is a global effect enchantment, so we return the card id without the "e" at the end
				return cardId.slice(0, -2);
			}
			return cardId;
	}
};

export const CURRENT_EFFECTS_WHITELIST = currentEffectsInternal;

export const cardsRevealedWhenDrawn = [
	CardIds.AncientShade_AncientCurseToken,
	CardIds.BronzeBroodmother,
	CardIds.BeneathTheGrounds_NerubianAmbushToken,
	CardIds.Chromie_BattleForMountHyjalToken,
	CardIds.Chromie_CullingOfStratholmeToken,
	CardIds.Chromie_EscapeFromDurnholdeToken,
	CardIds.Chromie_OpeningTheDarkPortalToken,
	CardIds.CurseOfAgony_AgonyToken,
	CardIds.DeckOfWonders_ScrollOfWonderToken,
	CardIds.EncumberedPackMule,
	CardIds.Roach_SC_012,
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
	CardIds.TemporalAnomaly,
];

// These are used to prevent info leaks in hand because we might know too much information
// Mostly useful when the opponent plays it
export const forcedHiddenCardCreators = [
	CardIds.Bibliomite,
	CardIds.Chameleos,
	// CardIds.Shapeshifter,
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
	CardIds.EnergyShaper,
	// Fast Forward: opponent draws/reduces hidden cards — logs expose CardID; treat like Hooktusk until revealed.
	CardIds.FastForward_TIME_770,
	// CardIds.TheotarTheMadDuke,
];

/**
 * CARD_BACK_TO_DECK: the opponent's "influencer" put a card onto the local player's deck, but the
 * power.log can still include the true CardID — clear it. This is the isPlayer (local deck) analogue
 * of {@link forcedHiddenCardCreators}, which only runs for !isPlayer.
 */
export const forcedHiddenInfluencersWhenCardEntersLocalDeck: readonly CardIds[] = [
	// Puts a discovered spell on the top of the opponent's deck; victim must not see the choice.
	CardIds.Qonzu_EDR_517,
	CardIds.EyesInTheSky_TLC_521,
];

// These are used to prevent info leaks in hand because we might know too much information
// But only when the player plays it
export const hideInfoWhenPlayerPlaysIt = [
	CardIds.Chameleos,
	// CardIds.Shapeshifter,
	CardIds.CoilfangConstrictor,
	// Prevent the player from knowing too much about the opponent's hand when we play IT
	// However, it has the side-effect of hiding the cards drawn by the opponent
	CardIds.GhastlyGravedigger,
	CardIds.IdentityTheft,
	CardIds.IncriminatingPsychic,
	CardIds.KoboldIllusionist,
	CardIds.MadameLazul,
	// CardIds.MadameLazulCore,
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
	CardIds.SecretPassage_SecretEntranceEnchantment,
	// Cards that discover a card in your deck do count as drawing but cards that discover a copy do not.
	CardIds.ShadowVisions,
];

/** Deck-to-hand moves that do not count toward "cards drawn this turn" (e.g. Everything Must Go!). */
export const doesNotCountTowardCardsDrawnThisTurn: readonly CardIds[] = [CardIds.SecretPassage];

export const cardsConsideredPublic = [CardIds.LibramOfWisdom_BT_025, CardIds.LibramOfWisdom_Story_01_LibramofWisdom];

export const creatorChangeMeansCardChanged = [
	CardIds.MarinTheManager_GoldenKoboldToken_VAC_702t4,
	CardIds.AgentOfTheOldOnes_CATA_200,
];

// Only use it for cards that create cards in hand. If used for cards that create cards in deck,
// this will lead to an info leak, as we use this array to decide whether a created card should
// be considered "known", meaning we can safely show the info in the opponent's hand
const publicCardGiftCreators = giftCreators;

// You draw something, but you don't know the exact card
export const cardTutors = tutors;

// You know the exact card drawn
// Only cards with explicitly known drawn identity belong here (not just known constraints like card type).
export const publicTutors = [
	CardIds.ConquerorsBanner,
	CardIds.FelLordBetrug_DAL_607, // don't know if you're talking about the card in hand or the minion summoned
	CardIds.IceTrap,
	CardIds.IceTrap_CORE_AV_226,
	CardIds.BeaststalkerTavish_ImprovedIceTrapToken,
	CardIds.Isorath_CATA_481,
	CardIds.KingsElekk,
	CardIds.KronxDragonhoof,
	CardIds.Parrrley_DED_005, // the parrrley generated by parrrley is a gift, though
	CardIds.Parrrley_Story_11_ParrrleyPuzzle, // the parrrley generated by parrrley is a gift, though
	CardIds.RavenFamiliar_LOOT_170,
	CardIds.SouthseaScoundrel_BAR_081, // the copy for the opponent is the original card, the copy for the player is created
	CardIds.SouthseaScoundrel_Story_11_SouthseaPuzzle, // the copy for the opponent is the original card, the copy for the player is created
	CardIds.Mimicry_EDR_522,
];

export const allowDirectFlaggingOfCardInOpponentHand = [CardIds.RoyalInformant_TIME_036];

export const publicCardInfos = [...cardsConsideredPublic, ...publicCardGiftCreators, ...publicTutors];
// Some cards both create in hand and in deck - we want to hide the information when drawn from the deck
export const hiddenWhenDrawFromDeck = [CardIds.MerchantOfLegend_TLC_514];

export const publicCardCreators = [...cardsConsideredPublic, ...publicCardGiftCreators, ...cardTutors, ...publicTutors];

// Some cards auto-generate themselves, in a way that doesn't link a creator / influenced by
export const specialCasePublicCardCreators = [
	CardIds.HeadcrackLegacy,
	CardIds.HeadcrackVanilla,
	'MIXED_CONCOCTION_UNKNOWN',
];

export const CARDS_THAT_IMPROVE_WHEN_TRADED = [
	CardIds.AmuletOfUndying,
	CardIds.BlacksmithingHammer,
	CardIds.WickedShipment,
	CardIds.WindUpEnforcer_TOY_880,
	CardIds.WindUpMusician_TOY_509,
	CardIds.WindUpSapling_TOY_802,
];

export const CREATES_PUBLIC_COPY_FROM_DECK = [CardIds.CraneGame_TOY_884, CardIds.TrialOfTheJormungars_WON_028];

/**
 * Same-controller deck→hand copies (e.g. Cultist Map second dredge pick): bidirectional
 * `cardCopyLinks` can mirror a revealed token onto the hidden hand row. Some power.log lines omit
 * `DREDGE` on the token or omit DeckCard attribution until later — match these creator /
 * `lastAffectedBy` ids on the copy or hidden hand row so we still treat the flow as opponent
 * self-dredge and skip linking. Extend when a similar incomplete-log leak appears.
 */
export const SELF_COPY_HAND_LEAK_INCOMPLETE_LOG_CARD_IDS: readonly CardIds[] = [
	CardIds.CultistMap_TLC_515,
	CardIds.CultistMap_CultistMapPlayerEnchantEnchantment_TLC_515e,
];

export const isSelfCopyHandLeakIncompleteLogCardId = (cardId: string | null | undefined): boolean =>
	!!cardId && SELF_COPY_HAND_LEAK_INCOMPLETE_LOG_CARD_IDS.includes(cardId as CardIds);

// These cards are added to the deck only for the Joust, but are not part of the initial deck
export const FAKE_JOUST_CARDS = [CardIds.ProGamer_RoshamboEnchantment_MIS_916e];
export const dontActuallyDestroyCardsInDeck = [
	CardIds.Overplanner_VAC_444,
	CardIds.AdaptiveAmalgam_VAC_958,
	CardIds.Kiljaeden_GDB_145,
	CardIds.Broxigar_TIME_020,
	CardIds.IridaSinseeker_JAIL_719,
];

export const supportedAdditionalData = [
	CardIds.Ignite,
	CardIds.FloppyHydra_TOY_897,
	CardIds.RenosMagicalTorchTavernBrawl,
	CardIds.Bottomfeeder,
	CardIds.SirakessCultist_AbyssalCurseToken,
	CardIds.StudentOfTheStars,
	CardIds.MuradinHighKing_HighKingsHammerToken_TIME_209t,
	...CARDS_THAT_IMPROVE_WHEN_TRADED,
];

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
	CardIds.IceTrap_CORE_AV_226,
	CardIds.BeaststalkerTavish_ImprovedIceTrapToken,
	CardIds.Objection,
	CardIds.Objection_CORE_MAW_006,
	// Even though it's a specific enchantment that counters the spell, the trigger entity is the minion itself
	CardIds.BlademasterOkani,
];

export const CARDS_THAT_REMEMBER_SPELLS_PLAYED = [
	{
		cardId: CardIds.CarressCabaretStar_VAC_449,
		mustHaveSpellSchool: true,
		numberOfCards: 9999,
	},
	{
		cardId: CardIds.CommanderSivara_TSC_087,
		mustHaveSpellSchool: false,
		numberOfCards: 3,
	},
	{
		cardId: CardIds.HedraTheHeretic_TSC_658,
		mustHaveSpellSchool: false,
		numberOfCards: 9999,
	},
];
export const CARDS_IDS_THAT_REMEMBER_SPELLS_PLAYED = CARDS_THAT_REMEMBER_SPELLS_PLAYED.map((c) => c.cardId);

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

/** @deprecated */
export const normalizeDeckHeroDbfId = (
	heroDbfId: number,
	cards: CardsFacadeService,
	// Should probably not be needed
	deckClass?: CardClass,
): number => {
	const cardFromHeroDbfId = cards.getCardFromDbfId(heroDbfId);
	// Don't normalize the dual-class heroes
	switch (cardFromHeroDbfId.id) {
		// Sometimes a neutral hero is provided even though the deck has class cards
		case CardIds.VanndarStormpikeTavernBrawl:
			switch (deckClass) {
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
			switch (deckClass) {
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

	const playerClass: CardClass = CardClass[cards.getCardFromDbfId(heroDbfId)?.playerClass?.toUpperCase()];

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

export const ladderRankToInt = (rank: string): number | null => {
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

export const ladderIntRankToString = (rank: number, isLegend: boolean, i18n: ILocalizationService): string | null => {
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

const rankToLeague = (rank: number, i18n: ILocalizationService): string => {
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

export const hasRace = (card: ReferenceCard | null, race: Race): boolean => {
	return card?.races?.includes(Race[race]) || card?.races?.includes(Race[Race.ALL]) || false;
};

export const isCastWhenDrawn = (cardId: string, allCards: CardsFacadeService): boolean => {
	return (
		cardsRevealedWhenDrawn.includes(cardId as CardIds) ||
		allCards.getCard(cardId)?.mechanics?.includes(GameTag[GameTag.CASTS_WHEN_DRAWN]) ||
		allCards.getCard(cardId)?.mechanics?.includes(GameTag[GameTag.SUMMONED_WHEN_DRAWN])
	);
};

export const isSummonedWhenDrawn = (cardId: string, allCards: CardsFacadeService): boolean => {
	return allCards.getCard(cardId)?.mechanics?.includes(GameTag[GameTag.SUMMONED_WHEN_DRAWN]);
};

// A set of cards for which the mana cost in reference cards is not what we want to show
export const shouldKeepOriginalCost = (cardId: string | CardIds): boolean => {
	return cardId?.startsWith(CardIds.ZilliaxDeluxe3000_TOY_330);
};

/** Cards that create gifts in hand; used by UI to show the gift icon when only `lastAffectedByCardId` is set. */
export { giftCreators } from './cards/gift-creators';
