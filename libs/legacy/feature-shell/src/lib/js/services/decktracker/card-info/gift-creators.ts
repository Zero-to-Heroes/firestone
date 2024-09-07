import { CardIds } from '@firestone-hs/reference-data';

const COIN_IDS = [
	CardIds.TheCoinCore,
	CardIds.TheCoin_AT_COIN,
	CardIds.TheCoin_AV_COIN1,
	CardIds.TheCoin_AV_COIN2,
	CardIds.TheCoin_BAR_COIN1,
	CardIds.TheCoin_BAR_COIN2,
	CardIds.TheCoin_BAR_COIN3,
	CardIds.TheCoin_BT_COIN,
	CardIds.TheCoin_DAL_COIN,
	CardIds.TheCoin_DMF_COIN1,
	CardIds.TheCoin_DMF_COIN2,
	CardIds.TheCoin_DRG_COIN,
	CardIds.TheCoin_REV_COIN1,
	CardIds.TheCoin_REV_COIN2,
	CardIds.TheCoin_RLK_COIN1,
	CardIds.TheCoin_RLK_COIN2,
	CardIds.TheCoin_SW_COIN1,
	CardIds.TheCoin_SW_COIN2,
	CardIds.TheCoin_TSC_COIN1,
	CardIds.TheCoin_TSC_COIN2,
	CardIds.TheCoin_ULD_COIN,
	CardIds.TheCoin_ETC_COIN1,
	CardIds.TheCoin_ETC_COIN2,
	CardIds.TheCoin_TOY_COIN1,
	CardIds.TheCoin_TOY_COIN2,
	CardIds.TheCoin_TOY_COIN3,
	CardIds.TheCoin_TTN_COIN1,
	CardIds.TheCoin_TTN_COIN2,
	CardIds.TheCoin_WW_COIN1,
	CardIds.TheCoin_WW_COIN2,
	CardIds.TheCoin_VAC_COIN1,
	CardIds.TheCoin_VAC_COIN2,
];

export const giftCreators = [
	// For some reason the coin is flagged as created by the coin...
	...COIN_IDS,
	// CardIds.EnergyShaper,
	// CardIds.MarvelousMyceliumTavernBrawlToken, // Because of an info leak
	// CardIds.PhotographerFizzle,
	// CardIds.SirFinleySeaGuide, // Otherwise it flags all cards drawn as "create by Sir Finley"
	// CardIds.SymphonyOfSins, // Otherwise the info leaks when the opponent draws the card
	CardIds.AbyssalWave,
	CardIds.AceInTheHoleTavernBrawlToken,
	CardIds.Acornbearer,
	CardIds.Acrobatics,
	CardIds.AdorableInfestation,
	CardIds.AirRaid_YOD_012,
	CardIds.ALightInTheDarkness_WON_333,
	CardIds.ALightInTheDarkness,
	CardIds.AmalgamOfTheDeep,
	CardIds.Amanthul,
	CardIds.AmateurPuppeteer_TOY_828,
	CardIds.AmitusThePeacekeeper_ReinforcedToken,
	CardIds.AmphibiousElixir_WW_080,
	CardIds.AnduinsGift_CORE_GIFT_12,
	CardIds.AnduinsGift_GIFT_12,
	CardIds.ApexisSmuggler,
	CardIds.ApocalypseTavernBrawlToken,
	CardIds.ApothecaryHelbrim,
	CardIds.ArcaneBreath,
	CardIds.ArcaneBrilliance,
	CardIds.ArcaneFlux_ArcaneFluxTavernBrawlEnchantment,
	CardIds.ArcaneFluxTavernBrawl,
	CardIds.ArcaneQuiver_RLK_817,
	CardIds.ArcaneQuiver_RLK_Prologue_RLK_817,
	CardIds.ArcaneWyrm,
	CardIds.ArchdruidNaralex,
	CardIds.ArchmageAntonidas,
	CardIds.ArchmageAntonidasLegacy,
	CardIds.ArchmageAntonidasVanilla,
	CardIds.ArchmageArugal,
	CardIds.ArchmageStaff,
	CardIds.ArchmageStaffTavernBrawl,
	CardIds.ArchThiefRafaam,
	CardIds.ArchVillainRafaam_CORE_DAL_422,
	CardIds.ArchVillainRafaam_DAL_422,
	CardIds.Arcsplitter,
	CardIds.Arfus_CORE_ICC_854,
	CardIds.Arfus_ICC_854,
	CardIds.ArgusTheEmeraldStar_CrystalCarvingToken,
	CardIds.ArthassGift_CORE_GIFT_04,
	CardIds.ArthassGift_GIFT_04,
	CardIds.AssemblyLine_YOG_410,
	CardIds.AstalorBloodsworn_AstalorTheProtectorToken,
	CardIds.AstalorBloodsworn,
	CardIds.AstralRift,
	CardIds.AthleticStudies_SCH_237,
	CardIds.AudioSplitter,
	CardIds.AwakeningTremors,
	CardIds.AwakenTheMakers,
	CardIds.AzalinaSoulthief,
	CardIds.AzeriteVein_WW_422,
	CardIds.AzsharanScroll_SunkenScrollToken,
	CardIds.AzsharanScroll,
	CardIds.AzsharanSweeper_SunkenSweeperToken,
	CardIds.AzsharanSweeper_TSC_776,
	CardIds.AzureExplorer,
	CardIds.BabblingBook,
	CardIds.BabblingBookCore,
	CardIds.BagOfCoins_LOOTA_836,
	CardIds.BagOfCoins_Story_11_BagofCoinsPuzzle,
	CardIds.BagOfCoinsTavernBrawl,
	CardIds.BananaBuffoon,
	CardIds.BananaramaTavernBrawl,
	CardIds.BargainBin_MIS_105,
	CardIds.BaristaLynchen,
	CardIds.BarrelOfMonkeys_BarrelOfMonkeysToken_ETC_207t,
	CardIds.BarrelOfMonkeys,
	CardIds.BattleVicar,
	CardIds.BaubleOfBeetles_ULDA_307,
	CardIds.BazaarMugger,
	CardIds.BenevolentBanker_WW_384,
	CardIds.BeOurGuestTavernBrawl,
	CardIds.BlackSoulstoneTavernBrawl,
	CardIds.BlastCharge_WW_380,
	CardIds.BlastFromThePast_WON_115,
	CardIds.BlastmageMiner_WW_426,
	CardIds.BlastWave,
	CardIds.BlazingInvocation,
	CardIds.BlessedGoods,
	CardIds.BlessingOfTheAncients_DAL_351,
	CardIds.BlindBox_TOY_643,
	CardIds.BloodrockCoShovel_WW_412,
	CardIds.BloodsailFlybooter,
	CardIds.BloodsailRecruiter_VAC_430,
	CardIds.BolnerHammerbeak, // In case a repeated battlecry draws / creates something
	CardIds.BookOfWonders,
	CardIds.BoomSquad_YOD_023,
	CardIds.BoomWrench_BoomWrenchToken_TOY_604t,
	CardIds.BoomWrench_TOY_604,
	CardIds.Botface_TOY_906,
	CardIds.Bottomfeeder,
	CardIds.BottomlessToyChest_TOY_851,
	CardIds.BounceAroundFtGarona,
	CardIds.BountyWrangler_WW_363,
	CardIds.Breakdance,
	CardIds.Brightwing,
	CardIds.BrightwingLegacy,
	CardIds.BringOnRecruitsTavernBrawl,
	CardIds.BronzeExplorer,
	CardIds.BronzeExplorerCore,
	CardIds.BronzeHerald,
	CardIds.BronzeSignet_BronzeSignetTavernBrawlEnchantment,
	CardIds.BronzeSignetTavernBrawl,
	CardIds.BubbleBlower,
	CardIds.BubbleBlowerTavernBrawl,
	CardIds.BucketOfSoldiers_TOY_814,
	CardIds.BuildASnowman_BuildASnowbruteToken,
	CardIds.BuildASnowman_BuildASnowgreToken,
	CardIds.BuildASnowman,
	CardIds.BumperCar,
	CardIds.BunchOfBananas_BunchOfBananasToken_ETC_201t,
	CardIds.BunchOfBananas,
	CardIds.Burgle_AT_033,
	CardIds.Burgle_WON_071,
	CardIds.BurglyBully,
	CardIds.BurrowBuster_WW_002,
	CardIds.CabalistsTome_WON_037,
	CardIds.CabalistsTome,
	CardIds.CactusConstruct_WW_818,
	CardIds.CalamitysGrasp,
	CardIds.CallOfTheGrave,
	CardIds.CallOfTheVoidLegacy,
	CardIds.CardGrader_TOY_054,
	CardIds.CarelessCrafter_TOY_382,
	CardIds.CarrionStudies,
	CardIds.CarryOnGrub_VAC_935,
	CardIds.Castle,
	CardIds.CastleTavernBrawl,
	CardIds.CelestialProjectionist,
	CardIds.ChaosStorm_ChaosStormTavernBrawlEnchantment,
	CardIds.ChaosStormTavernBrawl,
	CardIds.ChiaDrake_ChiaDrakeToken_TOY_801t,
	CardIds.ChiaDrake_TOY_801,
	CardIds.ChromieTimehopper_EscapeFromDurnholdeToken_WON_041t3,
	CardIds.ChromieTimehopper_OpeningTheDarkPortalToken_WON_041t,
	CardIds.Cicigi_TOY_913,
	CardIds.ClayMatriarch_ClayMatriarchToken_TOY_380t,
	CardIds.ClayMatriarch_TOY_380,
	CardIds.CleverDisguise_ULD_328,
	CardIds.CloakOfEmeraldDreams_CloakOfEmeraldDreamsTavernBrawlEnchantment,
	CardIds.CloakOfEmeraldDreamsTavernBrawl,
	CardIds.ClockworkGnome,
	CardIds.CloningDevice,
	CardIds.CobaltSpellkin_DRG_075,
	CardIds.CommanderSivara_Story_11_Sivara,
	CardIds.CommanderSivara_TSC_087,
	CardIds.CommandTheElements_StormcallerBrukanToken,
	CardIds.CommandTheElements_TameTheFlamesToken, // Stormcaller Brukan
	CardIds.CommandTheElements,
	CardIds.ConchsCall,
	CardIds.Concoctor,
	CardIds.ConfectionCyclone,
	CardIds.ConjureManaBiscuit,
	CardIds.ConjurersCalling_DAL_177,
	CardIds.ConnectionsTavernBrawl,
	CardIds.Convert_WON_342,
	CardIds.Convert,
	CardIds.CoppertailSnoop_CoppertailSnoopEnchantment,
	CardIds.CoppertailSnoop,
	CardIds.Copycat_DED_514,
	CardIds.Corpsicle_CorpsicleEnchantment_VAC_427e,
	CardIds.Corpsicle_VAC_427,
	CardIds.CorsairCache,
	CardIds.CreationProtocol_CreationProtocolToken,
	CardIds.CreationProtocol,
	CardIds.Cryopreservation_WW_009,
	CardIds.CrystallineOracle,
	CardIds.CupOMuscle_CupOMuscleToken_VAC_338t,
	CardIds.CupOMuscle_VAC_338,
	CardIds.CuriousGlimmerroot,
	CardIds.CurseOfRafaam,
	CardIds.Cutpurse,
	CardIds.DarkPeddler_WON_096,
	CardIds.DarkPeddler,
	CardIds.DartThrow_WW_006,
	CardIds.DeathbringerSaurfangCore_RLK_082,
	CardIds.DeathstalkerRexxar_BuildABeast,
	CardIds.DeeprunEngineer,
	CardIds.DefendTheDwarvenDistrict_KnockEmDownToken, // For Tavish
	CardIds.DefenseAttorneyNathanos,
	CardIds.DelayedProduct_MIS_305,
	CardIds.DemonicDynamics,
	CardIds.DemonicStudies,
	CardIds.DemonizerTavernBrawlToken,
	CardIds.Dendrologist,
	CardIds.DesperateMeasures_DAL_141,
	CardIds.DetectiveMurlocHolmes,
	CardIds.DetectiveMurlocHolmesTavernBrawl,
	CardIds.DevouringSwarm,
	CardIds.DevoutBlessingsTavernBrawlToken,
	CardIds.DigForTreasure_TOY_510,
	CardIds.DiligentNotetaker,
	CardIds.DinoTrackingTavernBrawl,
	CardIds.DiscJockey,
	CardIds.DiscoveryOfMagic,
	CardIds.DispossessedSoul,
	CardIds.DivineBrew_DivineBrewToken_VAC_916t2,
	CardIds.DivineBrew_VAC_916,
	CardIds.DivineIllumination_DivineIlluminationTavernBrawlEnchantment,
	CardIds.DivineIlluminationTavernBrawl,
	CardIds.Doomerang_CORE_ICC_233,
	CardIds.Doomerang_ICC_233,
	CardIds.DraconicLackey,
	CardIds.DraconicStudies,
	CardIds.DraggedBelow,
	CardIds.DragonbaneShot,
	CardIds.DragonBreeder,
	CardIds.DragonqueenAlexstrasza,
	CardIds.DragonRoar_TRL_362,
	CardIds.DragonsHoard,
	CardIds.DragonTales_WW_821,
	CardIds.DrakonidOperative,
	CardIds.DrakonidOperativeCore,
	CardIds.DrBoomMadGenius_DeliveryDrone,
	CardIds.DrillyTheKid_WW_417,
	CardIds.DrinkServer_VAC_461,
	CardIds.DrivenToGreed_ChaoticUnspentCoinEnchantment_TTN_002t20e,
	CardIds.DroneDeconstructor,
	CardIds.DropletOfInsanityTavernBrawlToken,
	CardIds.DrygulchJailor,
	CardIds.DryscaleDeputy_DryscaleDeputyEnchantment_WW_383e,
	CardIds.DryscaleDeputy_WW_383,
	CardIds.Duplicate,
	CardIds.DustBunny_MIS_706,
	CardIds.EarthenMight,
	CardIds.EerieStone_EerieStoneCostTavernBrawlEnchantment,
	CardIds.EerieStone_EerieStoneTavernBrawlEnchantment,
	CardIds.EerieStoneTavernBrawl,
	CardIds.EliseTheEnlightened,
	CardIds.EliteTaurenChampion_MoltenPickOfRockToken,
	CardIds.EliteTaurenChampion,
	CardIds.EliteTaurenChieftainLegacy,
	CardIds.EliteTaurenChieftainVanilla,
	CardIds.EmbraceOfNature_EmbraceOfNatureToken,
	CardIds.EmbraceOfNature,
	CardIds.EmeraldExplorer_DRG_313,
	CardIds.EncumberedPackMule,
	CardIds.ErodedSediment_WW_428,
	CardIds.ETCBandManager_ETC_080,
	CardIds.ETCBandManager_SignANewArtist,
	CardIds.EtherealConjurer_CORE_LOE_003,
	CardIds.EtherealConjurer_LOE_003,
	CardIds.EtherealLackey,
	CardIds.EvilCableRat,
	CardIds.EvilConscripter,
	CardIds.EVILConscription,
	CardIds.EvilGenius,
	CardIds.EvilMiscreant,
	CardIds.EvilQuartermaster,
	CardIds.EvilTotem,
	CardIds.Evocation,
	CardIds.ExpiredMerchant,
	CardIds.ExplorersHat_WON_022,
	CardIds.ExplorersHat,
	CardIds.EyeOfChaos_YOG_515,
	CardIds.FalseDisciple,
	CardIds.FarmHand_WW_358,
	CardIds.FateSplitter,
	CardIds.FelerinTheForgotten,
	CardIds.Felosophy,
	CardIds.FelsoulJailer,
	CardIds.FelsoulJailerLegacy,
	CardIds.FiddlefireImp,
	CardIds.FightOverMe,
	CardIds.FinalShowdown_CloseThePortalToken, // Demonslayer Kurtrus
	CardIds.FindersKeepers,
	CardIds.FindTheImposter_MarkedATraitorToken, // Spymaster Scabbs
	CardIds.FindTheImposter_SpyOMaticToken,
	CardIds.FireFly_CORE_UNG_809,
	CardIds.FireFly,
	CardIds.FirePlumesHeart,
	CardIds.FiretreeWitchdoctor,
	CardIds.FirstDayOfSchool,
	CardIds.FirstFlame,
	CardIds.FirstWishTavernBrawl,
	CardIds.Fishflinger,
	CardIds.FishyFlyer,
	CardIds.FlameBehemoth,
	CardIds.FlameGeyser,
	CardIds.FlameGeyserCore,
	CardIds.FleshBehemoth_RLK_830,
	CardIds.FlightOfTheBronze,
	CardIds.FlintFirearm_FlintFirearmEnchantment_WW_379e,
	CardIds.FlintFirearm_WW_379,
	CardIds.FloSlatebrand,
	CardIds.FloSlatebrandTavernBrawl,
	CardIds.Flowrider,
	CardIds.FontOfPower_BT_021,
	CardIds.FoolsGold_DEEP_022,
	CardIds.FoolsGoldTavernBrawl,
	CardIds.ForTheAlliance_StandAsOneTavernBrawlToken,
	CardIds.ForTheHorde_PowerOfTheHordeTavernBrawlToken,
	CardIds.Framester,
	CardIds.FreshScent_YOD_005,
	CardIds.FrightenedFlunky,
	CardIds.FrightenedFlunkyCore,
	CardIds.FromTheScrapheap,
	CardIds.FrostShardsTavernBrawl,
	CardIds.FrostStrike,
	CardIds.FrostStrikeCore,
	CardIds.FrozenClone_CORE_ICC_082,
	CardIds.FrozenClone_ICC_082,
	CardIds.FrozenTouch_FrozenTouchToken,
	CardIds.FrozenTouch,
	CardIds.FullBlownEvil,
	CardIds.GalakrondsGuile,
	CardIds.GalakrondsWit,
	CardIds.GarroshsGift_CORE_GIFT_07,
	CardIds.GarroshsGift_GIFT_07,
	CardIds.GetawayKodo,
	CardIds.GhostWriter,
	CardIds.GiftOfTheOldGodsTavernBrawlToken,
	CardIds.GildedGargoyle_LOOT_534,
	CardIds.GoldenKobold,
	CardIds.GoldenScarab,
	CardIds.Gorgonzormu_VAC_955,
	CardIds.GorillabotA3,
	CardIds.GorillabotA3Core,
	CardIds.GraceOfTheHighfather,
	CardIds.GralTheShark,
	CardIds.GrandLackeyErkh,
	CardIds.GraveDefiler,
	CardIds.GreaseMonkey,
	CardIds.GreedyPartner_WW_901,
	CardIds.Griftah,
	CardIds.GrimestreetInformant_WON_331,
	CardIds.GrimestreetInformant,
	CardIds.Guidance_YOP_024,
	CardIds.GuitarSoloist,
	CardIds.GuldansGift_CORE_GIFT_11,
	CardIds.GuldansGift_GIFT_11,
	CardIds.HagathaTheWitch_BewitchHeroic,
	CardIds.HakkarTheSoulflayer_CorruptedBloodToken,
	CardIds.HalazziTheLynx,
	CardIds.Hallucination,
	CardIds.HarbingerOfWinterCore_RLK_511,
	CardIds.Harpoon,
	CardIds.HarthStonebrew_CORE_GIFT_01,
	CardIds.HarthStonebrew_GIFT_01,
	CardIds.HeadcrackLegacy,
	CardIds.HeadcrackVanilla,
	CardIds.HealthDrink_HealthDrinkToken_VAC_951t,
	CardIds.HealthDrink_VAC_951,
	CardIds.HeistbaronTogwaggle_DAL_417,
	CardIds.Hematurge_CORE_RLK_066,
	CardIds.Hematurge_RLK_066,
	CardIds.Hematurge_RLK_Prologue_066,
	CardIds.HemetFoamMarksman_TOY_355,
	CardIds.HenchClanBurglar_DAL_416,
	CardIds.HenchClanBurglarCore,
	CardIds.HiddenObjects_TOY_037,
	CardIds.HiHoSilverwing_WW_344,
	CardIds.HikingTrail_VAC_517,
	CardIds.Hipster,
	CardIds.HoardingDragon_LOOT_144,
	CardIds.HolySpringwater_WW_395,
	CardIds.HornOfAncients,
	CardIds.Howdyfin_WW_333,
	CardIds.HuntersPack,
	CardIds.Hydrologist,
	CardIds.IdentityTheft,
	CardIds.IgnisTheEternalFlame,
	CardIds.IKnowAGuy_WON_350,
	CardIds.IKnowAGuy,
	CardIds.IllidansGift_CORE_GIFT_08,
	CardIds.IllidansGift_GIFT_08,
	CardIds.IllidariStudies_YOP_001,
	CardIds.IllidariStudiesCore,
	CardIds.ImpCredibleTrousers_ImpCredibleTrousersTavernBrawlEnchantment,
	CardIds.ImpCredibleTrousersTavernBrawl,
	CardIds.ImportPet_ImportPet,
	CardIds.ImportPet,
	CardIds.ImproveMorale,
	CardIds.IncredibleValue_TOY_046,
	CardIds.IncriminatingPsychic,
	CardIds.InfernalStrikeTavernBrawl,
	CardIds.InfestedGoblin,
	CardIds.InfestedWatcher_YOG_523,
	CardIds.InfinitizeTheMaxitude_InfinitizeTheMaxitudeEnchantment,
	CardIds.InfinitizeTheMaxitude,
	CardIds.InFormation,
	CardIds.InstructorFireheart_HotStreakEnchantment,
	CardIds.InstructorFireheart,
	CardIds.InvasiveShadeleaf_WW_393,
	CardIds.IvoryKnight_WON_045,
	CardIds.IvoryKnight,
	CardIds.IvoryRook_WON_116,
	CardIds.Jackpot,
	CardIds.JadeDisplay_TOY_803,
	CardIds.JainasGift_CORE_GIFT_02,
	CardIds.JainasGift_GIFT_02,
	CardIds.JarDealer,
	CardIds.JerryRigCarpenter,
	CardIds.JeweledMacaw,
	CardIds.JeweledMacawCore,
	CardIds.JeweledScarab,
	CardIds.JourneyBelow_OG_072,
	CardIds.JungleGiants,
	CardIds.KabalChemist,
	CardIds.KabalCourier_WON_130,
	CardIds.KabalCourier,
	CardIds.KajamiteCreation,
	CardIds.Kalecgos_CORE_DAL_609,
	CardIds.Kalecgos_DAL_609,
	CardIds.Kalecgos_DAL_609,
	CardIds.Kalecgos_Story_07_Kalecgos,
	CardIds.KangorDancingKing,
	CardIds.Kazakus_CFM_621,
	CardIds.Kazakus_GreaterPotionToken,
	CardIds.Kazakus_LesserPotionToken,
	CardIds.Kazakus_SuperiorPotionToken,
	CardIds.KazakusGolemShaper,
	CardIds.KeywardenIvory,
	CardIds.Kidnap_KidnappersSackToken,
	CardIds.KingMukla_CORE_EX1_014,
	CardIds.KingMuklaLegacy,
	CardIds.KingMuklaVanilla,
	CardIds.Kingsbane_LOOT_542,
	CardIds.KingTogwaggle,
	CardIds.KiriChosenOfElune,
	CardIds.KiriChosenOfEluneCore,
	CardIds.KoboldMiner_AzeriteChunkToken_WW_001t9,
	CardIds.KoboldMiner_AzeriteGemToken_WW_001t14,
	CardIds.KoboldMiner_FoolsAzeriteToken_WW_001t3,
	CardIds.KoboldMiner_PouchOfCoinsToken_WW_001t18,
	CardIds.KoboldMiner_TheAzeriteScorpionToken_WW_001t23,
	CardIds.KoboldMiner_WW_001,
	CardIds.KoboldTaskmaster,
	CardIds.LadyDeathwhisper_RLK_713,
	CardIds.LadyLiadrin_CORE_BT_334,
	CardIds.LadyLiadrin,
	CardIds.LakkariSacrifice,
	CardIds.LargeWaxyGiftTavernBrawl,
	CardIds.LegendaryLoot_LegendaryLootTavernBrawlEnchantment,
	CardIds.LegendaryLootTavernBrawl,
	CardIds.LesserRubySpellstone,
	CardIds.LicensedAdventurer,
	CardIds.LifebindersBloom,
	CardIds.LifebindersGift,
	CardIds.LifesavingAura_VAC_922,
	CardIds.LightforgedBlessing_DAL_568,
	CardIds.LightningReflexes_LightningReflexesEnchantment,
	CardIds.LightningReflexes,
	CardIds.LineCook_VAC_337,
	CardIds.LivewireLance,
	CardIds.LoanShark,
	CardIds.LockAndLoad_AT_061,
	CardIds.LockAndLoad_CORE_AT_061,
	CardIds.LockAndLoad_WON_023,
	CardIds.Locuuuusts_ONY_005tb3,
	CardIds.Locuuuusts_ULDA_036,
	CardIds.LocuuuustsTavernBrawl,
	CardIds.LokenJailerOfYoggSaron,
	CardIds.LorewalkerCho,
	CardIds.LorewalkerChoLegacy,
	CardIds.LostInThePark_FeralFriendsyToken, // Guff the Tough
	CardIds.LotusAgents_WON_332,
	CardIds.LotusAgents,
	CardIds.LyraTheSunshard_CORE_UNG_963,
	CardIds.LyraTheSunshard_UNG_963,
	CardIds.MadameLazul_CORE_DAL_729,
	CardIds.MadameLazul,
	CardIds.WorkForMadameLazul_WorkForMadameLazulEnchantTavernBrawlEnchantment,
	CardIds.MadeOfCoins,
	CardIds.Magicfin,
	CardIds.MagicTrick,
	CardIds.MailboxDancer,
	CardIds.MalfurionsGift_CORE_GIFT_10,
	CardIds.MalfurionsGift_GIFT_10,
	CardIds.MaltedMagma_MaltedMagmaToken_VAC_323t,
	CardIds.MaltedMagma_VAC_323,
	CardIds.MalygosAspectOfMagic,
	CardIds.MalygosTheSpellweaverCore,
	CardIds.ManaBind,
	CardIds.ManaCyclone,
	CardIds.Mankrik,
	CardIds.MarkedShot,
	CardIds.MarkedShotCore,
	CardIds.Marshspawn_BT_115,
	CardIds.MaruutStonebinder_DEEP_037,
	CardIds.MechagnomeGuide_MechagnomeGuideToken,
	CardIds.MechagnomeGuide,
	CardIds.MechanicalYeti,
	CardIds.MechBearCat,
	CardIds.MeetingStone,
	CardIds.Melomania_MelomaniaEnchantment,
	CardIds.MeltedMaker,
	CardIds.MenacingNimbus,
	CardIds.MenacingNimbusCore,
	CardIds.MerchSeller,
	CardIds.MetalDetector_VAC_330,
	CardIds.Metrognome,
	CardIds.MimironTheMastermind,
	CardIds.MindEater,
	CardIds.MindrenderIllucia,
	CardIds.MindVisionLegacy,
	CardIds.MindVisionVanilla,
	CardIds.MiracleSalesman_WW_331,
	CardIds.MismatchedFossils_DEEP_001,
	CardIds.MisterMukla_ETC_836,
	CardIds.MixedPotion_MixedConcoctionToken_RLK_570tt3,
	CardIds.Mixologist_VAC_523,
	CardIds.Mixtape,
	CardIds.MoargDrillfist_WW_442,
	CardIds.MoltenRune_MoltenRuneToken,
	CardIds.MoltenRune,
	CardIds.MoonbeastTavernBrawlToken,
	CardIds.MuckbornServant,
	CardIds.MuklaTyrantOfTheVale,
	CardIds.MurlocGrowfin_MIS_307,
	CardIds.MurlocHolmes_REV_022,
	CardIds.MurlocHolmes_REV_770,
	CardIds.MurozondThiefOfTime_WON_066,
	CardIds.MuseumCurator_WON_056,
	CardIds.MuseumCurator,
	CardIds.MysteryEgg_MysteryEggToken_TOY_351t,
	CardIds.MysteryEgg_TOY_351,
	CardIds.MysteryWinner,
	CardIds.MysticalMirage_ULDA_035,
	CardIds.NarainSoothfancy_VAC_420,
	CardIds.NaturalTalent_VAC_329,
	CardIds.NatureStudies_SCH_333,
	CardIds.NecroticMortician_CORE_RLK_116,
	CardIds.NecroticMortician,
	CardIds.Nefarian_BRM_030,
	CardIds.NellieTheGreatThresher_NelliesPirateShipToken,
	CardIds.Neptulon_GVG_042,
	CardIds.NerubianVizier,
	CardIds.NetherspiteHistorian,
	CardIds.Netherwalker,
	CardIds.NightshadeTea_NightshadeTeaToken_VAC_404t1,
	CardIds.NightshadeTea_VAC_404,
	CardIds.NineLives,
	CardIds.OasisOutlaws_WW_404,
	CardIds.OhManager_VAC_460,
	CardIds.OmegaAssembly,
	CardIds.OnyxMagescribe,
	CardIds.OpenTheDoorwaysTavernBrawl,
	CardIds.OpenTheWaygate,
	CardIds.OptimizedPolarityTavernBrawl,
	CardIds.Outlander_OutlandersPowerTavernBrawlEnchantment,
	CardIds.OutlanderTavernBrawl,
	CardIds.PackKodo,
	CardIds.PalmReading,
	CardIds.PandarenImporter,
	CardIds.Paparazzi,
	CardIds.PeacefulPiper,
	CardIds.PebblyPage_WON_090,
	CardIds.Peon_BAR_022,
	CardIds.PettyTheft_VAC_335,
	CardIds.PharaohCat,
	CardIds.PhotographerFizzle_FizzlesSnapshotToken,
	CardIds.PilferLegacy,
	CardIds.PipThePotent_WW_394,
	CardIds.PiranhaPoacher,
	CardIds.Plagiarizarrr,
	CardIds.PlantedEvidence,
	CardIds.PopgarThePutrid_WW_091,
	CardIds.PotionBelt,
	CardIds.PotionmasterPutricide,
	CardIds.PotionOfIllusion,
	CardIds.PowerChordSynchronize,
	CardIds.PowerOfCreation,
	CardIds.PozzikAudioEngineer,
	CardIds.Prestidigitation_DALA_BOSS_03p,
	CardIds.Prestidigitation_Prestidigitation,
	CardIds.PrimalfinLookout_UNG_937,
	CardIds.PrimordialGlyph_CORE_UNG_941,
	CardIds.PrimordialGlyph,
	CardIds.PrimordialStudies_SCH_270,
	CardIds.PrismaticElemental,
	CardIds.PsychicConjurerCore,
	CardIds.PsychicConjurerLegacy,
	CardIds.PuppetTheatre_MIS_919,
	CardIds.Pyros_PyrosToken_UNG_027t2,
	CardIds.Pyros,
	CardIds.Pyrotechnician,
	CardIds.QueenAzshara_TSC_641,
	CardIds.RaidNegotiator,
	CardIds.RaidTheDocks_SecureTheSuppliesToken,
	CardIds.RaiseDead_SCH_514,
	CardIds.RamCommander,
	CardIds.RamkahenWildtamer,
	CardIds.RangerGilly_VAC_413,
	CardIds.RapidFire_DAL_373,
	CardIds.RatSensei_WON_013,
	CardIds.RatsOfExtraordinarySize,
	CardIds.Ravencaller,
	CardIds.RavenIdol_Awakened,
	CardIds.RavenIdol_BreakFree,
	CardIds.RavenIdol,
	CardIds.RayOfFrost_DAL_577,
	CardIds.RazorpetalLasher,
	CardIds.RazorpetalVolley,
	CardIds.ReapWhatYouSow_WW_352,
	CardIds.Reconnaissance,
	CardIds.RecyclebotToken,
	CardIds.RedcrestRocker,
	CardIds.ReinforcedPlating_WW_334,
	CardIds.RemixedDispenseOBot_ChillingDispenseOBotToken,
	CardIds.RemixedDispenseOBot_MerchDispenseOBotToken,
	CardIds.RemixedDispenseOBot_MoneyDispenseOBotToken,
	CardIds.RemixedDispenseOBot_MysteryDispenseOBotToken,
	CardIds.RemixedTuningFork_BackupTuningForkToken,
	CardIds.Renew_BT_252,
	CardIds.RenoLoneRanger_NatureBullet_WW_0700p5,
	CardIds.RenounceDarkness,
	CardIds.Repackage_RepackagedBoxToken_TOY_879t,
	CardIds.ResizingPouch,
	CardIds.ResortValet_VAC_432,
	CardIds.ReturnPolicy_MIS_102,
	CardIds.Rewind_ETC_532,
	CardIds.RexxarsGift_CORE_GIFT_03,
	CardIds.RexxarsGift_GIFT_03,
	CardIds.Rheastrasza_PurifiedDragonNestToken_WW_824t,
	CardIds.Rhonin,
	CardIds.RingOfBlackIce_RingOfBlackIceTavernBrawlEnchantment_PVPDR_AV_Passive28e1,
	CardIds.RingOfBlackIce_RingOfBlackIceTavernBrawlEnchantment_PVPDR_AV_Passive28e2,
	CardIds.RingOfBlackIceTavernBrawl,
	CardIds.RingOfPhaseshifting_RingOfPhaseshiftingTavernBrawlEnchantment,
	CardIds.RiseToTheOccasion_AvengeTheFallenToken, // Lightborn Cariel
	CardIds.RisingWinds,
	CardIds.RockMasterVoone_ETC_121,
	CardIds.RuleModifier_ApproachingNightmareToken_TTN_002t14,
	CardIds.RuleModifier_DrivenToGreedToken_TTN_002t20,
	CardIds.RuleModifier_DrivenToGreedToken_TTN_002t20,
	CardIds.RuleModifier_SeeingDoubleToken_TTN_002t22,
	CardIds.RuleModifier_ShiftingFateToken_TTN_002t50,
	CardIds.RuleModifier_ShiftingFuturesToken_TTN_002t36,
	CardIds.RunedOrb_BAR_541,
	CardIds.RunefueledGolem,
	CardIds.RunesOfDarkness_YOG_511,
	CardIds.RunicAdornment,
	CardIds.RunicHelm_RunicHelmTavernBrawlEnchantment,
	CardIds.RunicHelmTavernBrawl,
	CardIds.RuniTimeExplorer_ValdrakkenToken_WON_053t5,
	CardIds.RuniTimeExplorer_WON_053,
	CardIds.SandwaspQueen,
	CardIds.Sathrovarr,
	CardIds.SavageSecretsTavernBrawl,
	CardIds.SaxophoneSoloist,
	CardIds.ScarabKeychain_TOY_006,
	CardIds.Schooling,
	CardIds.SchoolTeacher,
	CardIds.ScourgeIllusionist,
	CardIds.ScourgeTamer,
	CardIds.ScourgingTavernBrawl,
	CardIds.Scrapsmith,
	CardIds.SeabreezeChalice_SeabreezeChaliceToken_VAC_520t,
	CardIds.SeabreezeChalice_VAC_520,
	CardIds.Seance,
	CardIds.SecondWishTavernBrawl,
	CardIds.SecureTheDeck,
	CardIds.SeekGuidance_IlluminateTheVoidToken, // Xyrella, the Sanctified
	CardIds.SelectiveBreeder_LEG_CS3_015,
	CardIds.SelectiveBreederCore,
	CardIds.SendInTheScout_Si7ScoutTavernBrawl,
	CardIds.SerpentWig_TSC_215,
	CardIds.ServiceBell,
	CardIds.SethekkVeilweaver,
	CardIds.Shadowcasting101_Shadowcasting101TavernBrawlEnchantment_PVPDR_AV_Passive04e1,
	CardIds.Shadowcasting101TavernBrawl,
	CardIds.ShadowCouncil_BT_306,
	CardIds.ShadowjewelerHanar,
	CardIds.ShadowjewelerHanarCore,
	CardIds.ShadowVisions,
	CardIds.ShakuTheCollector,
	CardIds.ShatteredReflections_DEEP_025,
	CardIds.ShellGame_WW_416,
	CardIds.ShiftingShade,
	CardIds.Shimmerfly,
	CardIds.ShockHopper_YOG_524,
	CardIds.Simulacrum_CORE_ICC_823,
	CardIds.Simulacrum_ICC_823,
	CardIds.Sindragosa_FrozenChampionToken,
	CardIds.SinfulSousChef,
	CardIds.SinisterDeal,
	CardIds.SirakessCultist,
	CardIds.SisterSvalna_VisionOfDarknessToken,
	CardIds.SisterSvalna,
	CardIds.SkeletalDragon,
	CardIds.SkeletonCrew_WW_322,
	CardIds.SketchyStranger,
	CardIds.SkyRaider,
	CardIds.Sleetbreaker,
	CardIds.SleetSkater_SleetSkaterToken_TOY_375t,
	CardIds.SleetSkater_TOY_375,
	CardIds.SludgeOnWheels_WW_043,
	CardIds.SludgeSlurper,
	CardIds.Smokestack_WW_378,
	CardIds.SmugSenior,
	CardIds.SnackRun,
	CardIds.SnakeEyes_RolledAFiveToken_WW_400t5,
	CardIds.SnakeEyes_RolledAFourToken_WW_400t4,
	CardIds.SnakeEyes_RolledAOneToken_WW_400t1,
	CardIds.SnakeEyes_RolledASixToken_WW_400t6,
	CardIds.SnakeEyes_RolledAThreeToken_WW_400t3,
	CardIds.SnakeEyes_RolledATwoToken_WW_400t2,
	CardIds.SnakeEyes_WW_400,
	CardIds.SnakeOilSeller_WW_332,
	CardIds.SneakyDelinquent,
	CardIds.SonyaShadowdancer,
	CardIds.SonyaWaterdancer_TOY_515,
	CardIds.SoothsayersCaravan,
	CardIds.SootSpewer_WON_033,
	CardIds.SootSpewer,
	CardIds.SorcerersGambit_ReachThePortalRoomToken, // Arcanist Dawngrasp
	CardIds.SorcerersGambit,
	CardIds.SoulburnerVaria_YOG_520,
	CardIds.SouleatersScythe_BoundSoulToken,
	CardIds.SparkDrill_BOT_102,
	CardIds.Spellcoiler,
	CardIds.Spellslinger_AT_007,
	CardIds.Spellslinger_WON_344,
	CardIds.SpiritOfTheBadlands_MirageEnchantment_WW_337e,
	CardIds.SpiritOfTheBadlands_MirageToken_WW_337t,
	CardIds.SpiritOfTheBadlands_WW_337,
	CardIds.Springpaw_CORE_TRL_348,
	CardIds.Springpaw_TRL_348,
	CardIds.Spyglass_GILA_811,
	CardIds.SpyglassTavernBrawl,
	CardIds.StaffOfAmmunae_ULDA_041,
	CardIds.StandardizedPack_MIS_705,
	CardIds.StarlightWhelp,
	CardIds.Starseeker_ULDA_Elise_HP3,
	CardIds.StarseekersTools,
	CardIds.StarseekersToolsTavernBrawl,
	CardIds.Starshooter_WW_813,
	CardIds.SteamSurger,
	CardIds.StewardOfScrolls_SCH_245,
	CardIds.StickUp_WW_411,
	CardIds.StitchedTracker_CORE_ICC_415,
	CardIds.StitchedTracker_ICC_415,
	CardIds.StonehillDefender,
	CardIds.StudentOfTheStars,
	CardIds.SubmergedSpacerock,
	CardIds.SummerFlowerchild,
	CardIds.SunkenSweeper,
	CardIds.SuspiciousAlchemist_AMysteryEnchantment, // The one that really counts
	CardIds.SuspiciousAlchemist,
	CardIds.SuspiciousPeddler,
	CardIds.SuspiciousPirate,
	CardIds.SuspiciousUsher,
	CardIds.SwampDragonEgg,
	CardIds.SwarmOfLightbugs_WW_052,
	CardIds.Swashburglar,
	CardIds.SwashburglarCore,
	CardIds.SweetenedSnowflurry_SweetenedSnowflurryToken_TOY_307t,
	CardIds.SweetenedSnowflurry_TOY_307,
	CardIds.Synthesize,
	CardIds.TabletopRoleplayer_TOY_915,
	CardIds.TamsinRoame_BAR_918,
	CardIds.TanglefurMystic,
	CardIds.TasteOfChaos,
	CardIds.TearReality,
	CardIds.TenGallonHat_WW_811,
	CardIds.TentacleGrip_YOG_526,
	CardIds.TentacleTender_YOG_517,
	CardIds.TheBadlandsBandits_WW_345,
	CardIds.TheCandlesquestion_TheCandlesquestion_DALA_714a,
	CardIds.TheCandlesquestion_TheCandlesquestion_DALA_714b,
	CardIds.TheCandlesquestion,
	CardIds.TheCavernsBelow,
	CardIds.TheCountess_LegendaryInvitationToken,
	CardIds.TheCountess,
	CardIds.TheDemonSeed_CompleteTheRitualToken,
	CardIds.TheForestsAid_DAL_256,
	CardIds.TheHandOfRafaam,
	CardIds.TheHarvesterOfEnvy,
	CardIds.TheLastKaleidosaur,
	CardIds.TheLichKing_DeathGripToken,
	CardIds.TheLichKing_ICC_314,
	CardIds.TheLobotomizer,
	CardIds.TheMarshQueen_QueenCarnassaToken,
	CardIds.TheMarshQueen,
	CardIds.ThePrimus,
	CardIds.TheRyecleaver_VAC_525,
	CardIds.TheSunwell,
	CardIds.ThistleTea,
	CardIds.ThistleTeaSet_TOY_514,
	CardIds.ThoughtstealLegacy,
	CardIds.ThoughtstealVanilla,
	CardIds.ThrallsGift_CORE_GIFT_06,
	CardIds.ThrallsGift_GIFT_06,
	CardIds.TidepoolPupil_VAC_304,
	CardIds.TidePools_VAC_522,
	CardIds.TidestoneOfGolganneth,
	CardIds.TigressPlushy_TigressPlushyToken_TOY_811t,
	CardIds.TigressPlushy_TOY_811,
	CardIds.TimelineAccelerator_WON_139,
	CardIds.TimeLostProtodrake,
	CardIds.TinkertownTechnician,
	CardIds.TinyThimbleTavernBrawl,
	CardIds.TombPillager_CORE_LOE_012,
	CardIds.TombPillager_LOE_012,
	CardIds.TombPillager_WON_340,
	CardIds.TomeOfIntellectLegacy,
	CardIds.ToothOfNefarian,
	CardIds.Toshley,
	CardIds.ToyCaptainTarim_TOY_813,
	CardIds.ToyCaptainTarim_ToyCaptainTarimToken_TOY_813t,
	CardIds.ToysnatchingGeist_MIS_006,
	CardIds.ToysnatchingGeist_ToysnatchingGeistToken_MIS_006t,
	CardIds.TradePrinceGallywix_GVG_028,
	CardIds.TrainingSession_NX2_029,
	CardIds.TrainingSession_TrainingSessionAchieveEnchantment,
	CardIds.TrainingSession_TrainingSessionEnchantment,
	CardIds.TramHeist_WW_053,
	CardIds.TramMechanic_WW_044,
	CardIds.TransferStudent_TransferStudentToken_SCH_199t19,
	CardIds.TransferStudent_TransferStudentToken_SCH_199t6,
	CardIds.TravelAgent_VAC_438,
	CardIds.TwinSlice_BT_175,
	CardIds.TwistedPack_MIS_708,
	CardIds.TwistTheCoffers_CacheOfCashToken,
	CardIds.UldumTreasureCache,
	CardIds.UldumTreasureCacheTavernBrawl,
	CardIds.UmbralGeist,
	CardIds.UmbralSkulker,
	CardIds.UnderbellyAngler,
	CardIds.UndercityHuckster_OG_330,
	CardIds.UndercityHuckster_WON_317,
	CardIds.UnholyEmbraceTavernBrawl,
	CardIds.UnholyGiftTavernBrawl,
	CardIds.UniteTheMurlocs_MegafinToken,
	CardIds.UniteTheMurlocs,
	CardIds.UnleashTheBeast_DAL_378,
	CardIds.UnstablePortal_GVG_003,
	CardIds.UthersGift_CORE_GIFT_05,
	CardIds.UthersGift_GIFT_05,
	CardIds.ValeerasGift_CORE_GIFT_09,
	CardIds.ValeerasGift_GIFT_09,
	CardIds.VanessaVancleef_CORE_CS3_005,
	CardIds.VanessaVancleefLegacy,
	CardIds.VastWisdom,
	CardIds.VelarokWindblade_VelarokTheDeceiverToken_WW_364t,
	CardIds.VenomousScorpid,
	CardIds.VileApothecary,
	CardIds.VileConcoctionTavernBrawl,
	CardIds.VioletHaze,
	CardIds.VioletSpellwing,
	CardIds.VoidScripture_YOG_507,
	CardIds.VulperaScoundrel,
	CardIds.VulperaScoundrelCore,
	CardIds.Wandmaker,
	CardIds.WandThief_SCH_350,
	CardIds.Wanted,
	CardIds.WarCache,
	CardIds.WarCacheLegacy,
	CardIds.WarMasterVoone,
	CardIds.WatcherOfTheSun_WatcherOfTheSunToken,
	CardIds.WatcherOfTheSun,
	CardIds.WeaponizedPiñata,
	CardIds.Webspinner_CORE_FP1_011,
	CardIds.Webspinner_CORE_FP1_011,
	CardIds.Webspinner_FP1_011,
	CardIds.Webspinner_FP1_011,
	CardIds.WellEquippedTavernBrawl_PVPDR_Brann_HP2,
	CardIds.WhackAGnoll_MIS_700,
	CardIds.WhelpWrangler_WW_827,
	CardIds.WhispersOfEvil,
	CardIds.WildernessPack_MIS_104,
	CardIds.WildGrowthCore,
	CardIds.WildGrowthLegacy,
	CardIds.WildGrowthVanilla,
	CardIds.WindowShopper_TOY_652,
	CardIds.WindowShopper_WindowShopperToken_TOY_652t,
	CardIds.WishingWell_WW_415,
	CardIds.WitchsApprentice,
	CardIds.WitchwoodApple,
	CardIds.WitchwoodAppleCore,
	CardIds.WorkForTogwaggle_WorkForTogwaggleEnchantTavernBrawlEnchantment,
	CardIds.WorgenRoadie_InstrumentCaseToken,
	CardIds.WorldPillarFragmentToken_DEEP_999t3,
	CardIds.WorthyExpedition,
	CardIds.WretchedExile,
	CardIds.XarilPoisonedMind,
	CardIds.YoggSaronMasterOfFate_HandOfFateToken,
	CardIds.YoggSaronUnleashed_TentacleSwarmToken_YOG_516t3,
	CardIds.YseraLegacy,
	CardIds.YseraTheDreamer_LEG_CS3_033,
	CardIds.YseraTheDreamerCore,
	CardIds.YseraVanilla,
	CardIds.Zaqul_Story_11_Zaqul,
	CardIds.Zaqul_TSC_959,
	CardIds.ZephrysTheGreat_ULD_003,
	CardIds.ZolaTheGorgon,
	CardIds.ZolaTheGorgonCore,
];
