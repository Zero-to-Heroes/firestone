import { BoosterType, CardClass, CardIds, GameTag, Race, ReferenceCard } from '@firestone-hs/reference-data';
import { PackResult } from '@firestone-hs/user-packs';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { CollectionCardType } from '../models/collection/collection-card-type.type';
import { tutors } from './decktracker/card-info/card-tutors';
import { giftCreators } from './decktracker/card-info/gift-creators';
import { LocalizationFacadeService } from './localization-facade.service';
import { bwonsamdiBoonsEnchantments } from '@firestone/game-state';

// Used for cache purposes, only in dev
export const CARDS_VERSION = '20251107';
export const isPreReleaseBuild = false;

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
	}
};

export const battlecryGlobalEffectCards = [
	CardIds.AldorAttendant,
	CardIds.AldorTruthseeker,
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
	CardIds.InterstellarStarslicer_GDB_726,
	CardIds.InterstellarWayfarer_GDB_721,
	CardIds.Inzah,
	CardIds.IronweaveBloodletterTavernBrawl,
	CardIds.JotunTheEternal,
	CardIds.JungleGiants_BarnabusTheStomperToken,
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
	CardIds.TheAzeriteDragonToken_DEEP_999t4,
	CardIds.TheAzeriteMurlocToken_DEEP_999t5,
	CardIds.TheDemonSeed_BlightbornTamsinToken,
	CardIds.TheStonewright,
	CardIds.Turbulus_WORK_013,
	CardIds.ValdrisFelgorge,
	CardIds.WyrmrestPurifier,
];

export const deathrattleGlobalEffectCards = [
	CardIds.BonelordFrostwhisper,
	CardIds.Infestor_SC_002,
	CardIds.InterstellarStarslicer_GDB_726,
	CardIds.JadeDisplay_TOY_803,
	CardIds.Therazane_DEEP_036,
	CardIds.UnluckyPowderman_WW_367,
];

export const startOfGameGlobalEffectCards = [
	CardIds.GennGreymane_GIL_692,
	CardIds.BakuTheMooneater,
	CardIds.DarkbishopBenedictus,
	CardIds.DarkbishopBenedictusCore,
	CardIds.ChogallTwilightChieftain_YOG_530,
	CardIds.HamuulRunetotem_EDR_845,
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
	// CardIds.CityChiefEsho_KinEnchantment_TLC_110e, // The enchantment is applied to each card, so we don't have a global thing
];

export const globalEffectCards = [
	...globalEffectCardsPlayed,
	...startOfGameGlobalEffectCards,
	...deathrattleGlobalEffectCards,
	...globalEffectEnchantments,
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
	// The logs here attribute the source and target to the current hero, not the card being played
	{
		effectPrefab: 'SCFX_Artanis_Protoss_CostReduction_BuffImpact_Super',
		cardId: CardIds.PhotonCannon_SC_753,
		forceUseParentInfo: true,
	},
	{
		effectPrefab: 'SCFX_Artanis_Protoss_CostReduction_BuffImpact_Super',
		cardId: CardIds.Artanis_SC_754,
		forceUseParentInfo: true,
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

export const CURRENT_EFFECTS_WHITELIST = [
	// Generated via script
	CardIds.AegwynnTheGuardian_GuardiansLegacyPlayerCoreEnchantment,
	CardIds.Agamaggan_CorruptedThornsEnchantment_EDR_489e1,
	CardIds.Agamaggan_CorruptedThornsEnchantment_EDR_489e2,
	CardIds.AimedShot_AimingEnchantment,
	CardIds.AlexandrosMograine_MograinesMigraineEnchantment,
	CardIds.AncientKnowledge_AncientKnowledgeEnchantment,
	CardIds.Anubrekhan_HardenedCarapaceEnchantment_RLK_659e,
	CardIds.ArcaneKnowledge_ArcaneKnowledgePlayerEnchDntEnchantment_BG31_HERO_006pe,
	CardIds.ArchdruidNaralex_DreamingEnchantment,
	CardIds.ArchimondePlayerEnchantDntEnchantment_BG31_873pe,
	CardIds.Astrobiologist_AstrobiologistEnchantment_GDB_874e,
	CardIds.AthleticStudies_AthleticStudiesEnchantment,
	CardIds.BlessingOfAeons_WiseBeyondYearsEnchantment,
	CardIds.BlessingOfTheMonkeyTavernBrawlEnchantment,
	CardIds.Bloodbloom_DarkPowerEnchantment,
	CardIds.BootsOfHaste_BootsOfHasteEnchantment,
	CardIds.CarrionStudies_CarrionStudiesEnchantment,
	CardIds.CelestialEmissary_CelestialPowerEnchantment_BOT_531e,
	CardIds.CelestialEmissary_CelestialPowerEnchantment_BOT_531e2,
	CardIds.CelestialInkSet_InscriptionEnchantEnchantment,
	CardIds.CelestialPowerEnchantment_BOT_531e2_Puzzle,
	CardIds.CelestialPowerEnchantment_BOT_531e_Puzzle,
	CardIds.CelestialProjectionist_AstralProjectionEnchantment,
	CardIds.CelestialShot_CelestialEmbraceEnchantment_YOG_082e,
	CardIds.CenarionHold_CenariOnHoldEnchantment_WON_015e,
	CardIds.ChaosGazer_WitheringAwayEnchantment,
	CardIds.ChitinousPlating_MoltingEnchantment,
	CardIds.CloakOfEmeraldDreams_CloakOfEmeraldDreamsTavernBrawlEnchantment,
	CardIds.Clownfish_ClownfishCarEnchantment,
	CardIds.ColdBlooded_ColdBloodedEnchantment_TWI_001hpe,
	CardIds.ColdFeet_ColdFeetEnchantment_JAM_006e,
	CardIds.CommanderUlthok_BloodSqueezeEnchantment,
	CardIds.Conductivity_ConductiveEnchantment_YOG_522e,
	CardIds.ConstructPylons_PsionicMatrixEnchantment_SC_755e2,
	CardIds.CookinEnchantment_BAR_552e_bom_puzzle,
	CardIds.Copycat_CopycatEnchantment,
	CardIds.CraterGator_CraterGatorPlayerEnchantEnchantment_TLC_250e,
	CardIds.CultNeophyte_SpoiledEnchantment,
	CardIds.CurseOfFlesh_CurseOfFleshEnchantment_YOG_503e1,
	CardIds.CursedEnchantment,
	CardIds.Cursed_CursedEnchantment,
	CardIds.DaringFireEater_FlameweavingEnchantment_TRL_390e,
	CardIds.DaringFireEater_FlameweavingEnchantment_TRL_390e2,
	CardIds.DistressedKvaldir_FrostFeverEnchantment_TTN_450e,
	CardIds.DoorOfShadows_ShadowstalkingEnchantment,
	CardIds.Dragoncaster_DraconicMagicEnchantment,
	CardIds.DreamboundDisciple_DreamboundEnchantment_EDR_847e,
	CardIds.DryscaleDeputy_DryscaleDeputyEnchantment_WW_383e,
	CardIds.EchoingRoar_EchoingRoarEnchantment_BG28_814e,
	CardIds.ElectraStormsurge_ElectricEnchantment,
	CardIds.ElectraStormsurge_ElectrickingEnchantment,
	CardIds.EtherealContract_ContractedTavernBrawlEnchantment,
	CardIds.EtherealContract_ProposedContractTavernBrawlEnchantment,
	CardIds.Evocation_EvocationEnchantment,
	CardIds.ExarchMaladaar_NecromanticPowerEnchantment_GDB_470e,
	CardIds.FelfireBonfire_AmpleOfferingEnchantment_VAC_952e,
	CardIds.FierceOutsider_IntrovertedEnchantment,
	CardIds.FlameWaves_FlameWavesTavernBrawlEnchantment,
	CardIds.ForbiddenShrine_LuminosityEnchantment_EDR_520e,
	CardIds.ForensicDuster_DustingEnchantment,
	CardIds.Fortifications_ChaoticFortificationsEnchantment_TTN_002t30e,
	CardIds.FortifiedBunker_FortifiedBunkerEnchantment_BG31_HERO_801pthe,
	CardIds.FoxyFraud_EnablingEnchantment,
	CardIds.FreezingTrap_TrappedLegacyEnchantment,
	CardIds.FrostStrike_GlacialAdvanceEnchantment_RLK_025e,
	CardIds.FrostStrike_GlacialAdvanceEnchantment_RLK_025o,
	CardIds.Frostbite_FrostbittenEnchantment_AV_259e,
	CardIds.FrozenBuckler_ChillyEnchantment,
	CardIds.GibberingReject_SharpStatueEnchantment_MIS_911e,
	CardIds.GiftReceiptEnchantment_GIFT_99e,
	CardIds.GlacialAdvanceEnchantment_RLK_Prologue_RLK_025e,
	CardIds.GlacialAdvanceEnchantment_RLK_Prologue_RLK_025o,
	CardIds.GlacialDownpour_GlacialDownpourTavernBrawlEnchantment,
	CardIds.HarrowingOx_OxChillEnchantment_WW_356e,
	CardIds.HauntingVisions_VisionsEnchantment,
	CardIds.HolyCowboy_HolyCowboyEnchantment_WW_335e,
	CardIds.HornOfPlenty_HornOfPlentyEnchantment_EDR_270e,
	CardIds.HotStreak_HotStreakEnchantment,
	CardIds.HurryUp_TimeManagementPlayerEnchDntEnchantment_BG31_881te2,
	CardIds.IdolsOfElune_IdolsOfEluneTavernBrawlEnchantment,
	CardIds.IllidariStudies_LonerEnchantment_RLK_Prologue_YOP_001e,
	CardIds.IllidariStudies_LonerEnchantment_YOP_001e,
	CardIds.InfinitizeTheMaxitude_InfinitizeTheMaxitudeEnchantment,
	CardIds.InkmasterSolia_FreeSpellEnchantment,
	CardIds.JazzBass_ElectricSlideEnchantment_ETC_813e,
	CardIds.LabConstructor_LabConstructorEnchantment,
	CardIds.LibramOfDivinity_LibramOfDivinityEnchantment_GDB_138e2,
	CardIds.Lifeguard_ProtectionEnchantment_VAC_919e,
	CardIds.LoadTheChamber_LoadedFelSpellEnchantment_WW_409e2,
	CardIds.Loatheb_NecroticAuraEnchantment_FP1_030e,
	CardIds.LuckyComet_ComboCometEnchantment_GDB_873e,
	CardIds.Lullabot_LullabotEnchantment_BG26_146_Ge2,
	CardIds.Lullabot_LullabotEnchantment_BG26_146e2,
	CardIds.LunarEclipse_LunarEmpowermentEnchantment_DMF_057e,
	CardIds.LunarEclipse_LunarEmpowermentEnchantment_DMF_057o,
	CardIds.LunarwingMessenger_FleetingMagicEnchantment_EDR_449e,
	CardIds.MagtheridonUnreleased_WorkingOvertimeEnchantment_TOY_647e3,
	CardIds.MarvelousMycelium_MarvelousSporesTavernBrawlEnchantment,
	CardIds.MillhouseManastorm_KillMillhouseLegacyEnchantmentToken,
	CardIds.MimironTheMastermind_CooledDownEnchantment_TTN_920e2,
	CardIds.MimironTheMastermind_CooledDownEnchantment_TTN_920e3,
	CardIds.MurkwaterScribe_MurkyEnchantment,
	CardIds.MurozondUnbounded_MurozondEndOfTimeEnchantment_TIME_024e2,
	CardIds.NatureStudies_NatureStudiesEnchantment,
	CardIds.NextHeroPowerGoldensEnchantment,
	CardIds.NightmareCurse_NightmarishEnchantment,
	CardIds.NordrassilDruid_NaturesRiteCoreEnchantment,
	CardIds.OminousSeer_ForetoldEnchantment_BG31_330e,
	CardIds.ParrotSanctuary_ParrotingEnchantment_VAC_409e,
	CardIds.PartnerInCrime_AlibiEnchantment,
	CardIds.PocketSand_SandInYourEyesEnchantment_WW_403e,
	CardIds.PocketSand_SandyEnchantment_WW_403e1,
	CardIds.PopularPixie_GladesGuidanceEnchantment,
	CardIds.Preparation_PreparationLegacyEnchantment_EX1_145e,
	CardIds.Preparation_PreparationLegacyEnchantment_EX1_145o,
	CardIds.Preparation_PreparationTavernBrawlEnchantment_TB_Champs_EX1_145e,
	CardIds.Preparation_PreparationTavernBrawlEnchantment_TB_Champs_EX1_145o,
	CardIds.Preparation_PreparationVanillaEnchantment_VAN_EX1_145e,
	CardIds.Preparation_PreparationVanillaEnchantment_VAN_EX1_145o,
	CardIds.PrestorsPyromancer_BurningHotEnchantment_SW_112e,
	CardIds.PrestorsPyromancer_BurningHotEnchantment_SW_112e2,
	CardIds.PrideSeeker_GrownUpEnchantment,
	CardIds.PrimordialStudies_RunicStudiesEnchantment,
	CardIds.PrimordialTerrarium_TerrariumEnchantment_BG30_MagicItem_979e,
	CardIds.PureOfHeart_PurestHeartEnchantment,
	CardIds.RaidNegotiator_DecisiveEnchantment,
	CardIds.RavenousFlock_RavenousFlockPlayerEnchantEnchantment_TLC_232e,
	CardIds.Rebuke_RebukedEnchantment,
	CardIds.RecklessInvestment_LoseGoldNextTurnDntEnchantment_BG28_513e,
	CardIds.RecklessReinforcements_LeeroooyJeeenkinsEnchantment_THD_019hpe,
	CardIds.RelicVault_RelicsOfOldEnchantment,
	CardIds.Relicologist_RelicPowerEnchantment,
	CardIds.ReroutePower_ReroutePowerPlayerEnchantment,
	CardIds.RottenApple_FractureEnchantment_EDR_482e,
	CardIds.RunicHelm_RunicHelmTavernBrawlEnchantment,
	CardIds.RustingAwayEnchantment,
	CardIds.SandboxScoundrel_OnSaleEnchantment_TOY_521e,
	CardIds.SandboxScoundrel_OnSaleReductionEnchantment_TOY_521e1,
	CardIds.ScabbsCutterbutter_CookinEnchantment_BAR_552e,
	CardIds.SeaShill_SeaShillEnchantment_VAC_332e,
	CardIds.SerratedBoneSpike_SerratedEnchantment_REV_939e,
	CardIds.SerratedBoneSpike_SerratedEnchantment_REV_939e2,
	CardIds.Shattershambler_InShamblesEnchantment,
	CardIds.SheldrasMoontree_ElunesGuidance2Enchantment,
	CardIds.SheldrasMoontree_ElunesGuidanceEnchantment,
	CardIds.ShieldBattery_KhalaiIngenuityEnchantment_SC_759e,
	CardIds.ShiningMoonlight_ShiningMoonlightEnchantPlayerEnchantment_TLC_100t12e,
	CardIds.ShiningMoonlight_ShiningMoonlightEnchantPlayerEnchantment_TLC_100t22e,
	CardIds.ShiningMoonlight_ShiningMoonlightEnchantPlayerEnchantment_TLC_100t32e,
	CardIds.Si7Skulker_SpyStuffEnchantment,
	CardIds.SigilOfSilence_SigilEnchantment,
	CardIds.SketchArtist_LightSketchEnchantment_TOY_916e1,
	CardIds.SleepEnchantment,
	CardIds.SleightOfHand_SleightOfHandEnchantment_AV_203pe,
	CardIds.SleightOfHand_SleightOfHandEnchantment_AV_203po,
	CardIds.SlowMotion_SlowedDownEnchantment_TIME_716e3,
	CardIds.SolarEclipse_SolarEmpowermentEnchantment_DMF_058e,
	CardIds.SolarEclipse_SolarEmpowermentEnchantment_DMF_058o,
	CardIds.SolidAlibi_SolidAlibiEnchantment,
	CardIds.SoulrestCeremony_SoulrestEnchantment_DINO_417e,
	CardIds.SpacerockCollector_RockCollectionEnchantment_GDB_875e,
	CardIds.SparklingPhial_SparklingEnchantment_TOY_800e1,
	CardIds.SpeakerStomper_TooLoudEnchantment,
	CardIds.Spelunker_SpelunkerEnchantPlayerEnchantment_TLC_450e,
	CardIds.SpringySpriggan_SpringySprigganEnchantment_BG32_171_Ge2,
	CardIds.SpringySpriggan_SpringySprigganEnchantment_BG32_171e2,
	CardIds.SubmergedSpacerock_SubmergedEnchantment,
	CardIds.Surfalopod_RideTheWaveEnchantment_VAC_443e,
	CardIds.SweetenedSnowflurry_MeltingEnchantment_TOY_307e,
	CardIds.SwiftscaleTrickster_FooledTheAudienceEnchantment,
	CardIds.TalentedArcanist_TouchOfArcaneEnchantment_BAR_064e,
	CardIds.TalentedArcanist_TouchOfArcaneEnchantment_BAR_064e2,
	CardIds.TemporaryEnchantment_GBL_999e,
	CardIds.Tenacity_TenaciousEnchantment,
	CardIds.TheCrystalCove_TreasuresBelowEnchantment_TOY_512e1,
	CardIds.TheEternalHold_JailbreakEnchantment_TIME_446e,
	CardIds.ThePrimus_ChillOfDeathEnchantment,
	CardIds.TheSoularium_FleetingSoulEnchantment,
	CardIds.ToTheFront_FrontlinedEnchantment,
	CardIds.TogwagglesDice_TogwagglesDicePlayerEnchantment,
	CardIds.TwinbowTerrorcoil_TwinnedEnchantment,
	CardIds.TwinbowTerrorcoil_TwinningEnchantment,
	CardIds.Tyrande_PullOfTheMoonEnchantment_EDR_464e2,
	CardIds.UnlimitedPotential_PotentialUnboundEnchantment,
	CardIds.UnstableMagic_UnstableMagicEnchantment_THD_043hpe,
	CardIds.WarpGate_WarpConduitEnchantment_SC_751e,
	CardIds.WaterTap_WaterTapEnchantment_Story_11_WaterTape,
	CardIds.WaterTap_WaterTapEnchantment_Story_11_WaterTapee,
	CardIds.WildernessPack_KnockOffPackEnchantment_MIS_104e,
	CardIds.WorkForHagatha_WorkForHagathaTavernBrawlEnchantment,
	CardIds.YshaarjTheDefiler_TrueCorruptionEnchantment,

	// Manually added
	CardIds.SpacerockCollector_RockCollectionEnchantment_GDB_875e,
	CardIds.SparklingPhial_SparklingEnchantment_TOY_800e1,
	CardIds.Corpsicle_CorpsicleEnchantment_VAC_427e,
	CardIds.SandboxScoundrel_OnSaleEnchantment_TOY_521e,
	CardIds.StrandedSpaceman_StrandedSpacemanFutureBuffEnchantment_GDB_861e,
	CardIds.ShieldBattery_KhalaiIngenuityEnchantment_SC_759e,
	CardIds.StarlightWanderer_StarlightWandererFutureBuffEnchantment_GDB_720e,
	CardIds.MimironTheMastermind_CooledDownEnchantment_TTN_920e2,
	// CardIds.MimironTheMastermind_CooledDownEnchantment_TTN_920e3, // Duplicate of the above?
	CardIds.Preparation_PreparationLegacyEnchantment_EX1_145e,
	// CardIds.Preparation_PreparationLegacyEnchantment_EX1_145o, // Dupe?
	CardIds.ShiningMoonlight_ShiningMoonlightEnchantPlayerEnchantment_TLC_100t12e,
	CardIds.ShiningMoonlight_ShiningMoonlightEnchantPlayerEnchantment_TLC_100t22e,
	CardIds.ShiningMoonlight_ShiningMoonlightEnchantPlayerEnchantment_TLC_100t32e,
	CardIds.SleightOfHand_SleightOfHandEnchantment_AV_203pe,
	// CardIds.SleightOfHand_SleightOfHandEnchantment_AV_203po,
	CardIds.ElementalEvocation_ElementalEvocationEnchantment,
	CardIds.AthleticStudies_AthleticStudiesEnchantment,
	CardIds.BloodsailDeckhand_ToArrrmsCoreEnchantment,
	CardIds.CarrionStudies_CarrionStudiesEnchantment,
	CardIds.CenarionHold_CenariOnHoldEnchantment_WON_015e,
	CardIds.DemonicStudies_DemonicStudiesEnchantment,
	CardIds.DraconicStudies_DraconicStudiesEnchantment,
	CardIds.FierceOutsider_IntrovertedEnchantment,
	CardIds.FrequencyOscillator_OscillatingEnchantment,
	CardIds.IllidariStudies_LonerEnchantment_YOP_001e,
	CardIds.KindlingElemental_KindleEnchantment,
	CardIds.NatureStudies_NatureStudiesEnchantment,
	CardIds.PrimordialStudies_RunicStudiesEnchantment,
	CardIds.ShadowtouchedKvaldir_TwistedToTheCoreEnchantment_YOG_300e,
	CardIds.Shattershambler_InShamblesEnchantment,
	CardIds.Shudderblock_ReadyForActionEnchantment_TOY_501e,
	CardIds.ThornmantleMusician_ThornmantlesMuseEnchantment_ETC_831e,
	CardIds.AnonymousInformant_InformedEnchantment_REV_841e,
	CardIds.AquaArchivist_AncientWatersEnchantment,
	CardIds.BusyPeon_ZugZugEnchantment_WORK_041e,
	CardIds.CelestialEmissary_CelestialPowerEnchantment_BOT_531e,
	CardIds.Conductivity_ConductiveEnchantment_YOG_522e,
	CardIds.CowerInFear_CowerInFearPlayerEnchantEnchantment_TLC_823e1,
	CardIds.Frostbite_FrostbittenEnchantment_AV_259e,
	CardIds.GhoulishAlchemist,
];

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
	// CardIds.TheotarTheMadDuke,
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
	// Cards that discover a card in your deck do count as drawing but cards that discover a copy do not.
	CardIds.ShadowVisions,
];

export const cardsConsideredPublic = [CardIds.LibramOfWisdom_BT_025, CardIds.LibramOfWisdom_Story_01_LibramofWisdom];

export const creatorChangeMeansCardChanged = [CardIds.MarinTheManager_GoldenKoboldToken_VAC_702t4];

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
	CardIds.IceTrap_CORE_AV_226,
	CardIds.BeaststalkerTavish_ImprovedIceTrapToken,
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

export const CREATES_PUBLIC_COPY_FROM_DECK = [CardIds.CraneGame_TOY_884];

// These cards are added to the deck only for the Joust, but are not part of the initial deck
export const FAKE_JOUST_CARDS = [CardIds.ProGamer_RoshamboEnchantment_MIS_916e];
export const dontActuallyDestroyCardsInDeck = [
	CardIds.Overplanner_VAC_444,
	CardIds.AdaptiveAmalgam_VAC_958,
	CardIds.Kiljaeden_GDB_145,
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
		cardId: CardIds.TidepoolPupil_VAC_304,
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
