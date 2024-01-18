import { COIN_IDS, CardIds } from '@firestone-hs/reference-data';

export const giftCreators = [
	// For some reason the coin is flagged as created by the coin...
	...COIN_IDS,
	// CardIds.PhotographerFizzle,
	// CardIds.SirFinleySeaGuide, // Otherwise it flags all cards drawn as "create by Sir Finley"
	// CardIds.SymphonyOfSins, // Otherwise the info leaks when the opponent draws the card
	// CardIds.MarvelousMyceliumTavernBrawlToken, // Because of an info leak
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
	CardIds.AmitusThePeacekeeper_ReinforcedToken,
	CardIds.AmphibiousElixir_WW_080,
	CardIds.ApexisSmuggler,
	CardIds.ApocalypseTavernBrawlToken,
	CardIds.ApothecaryHelbrim,
	CardIds.ArcaneBreath,
	CardIds.ArcaneBrilliance,
	CardIds.ArcaneFluxTavernBrawl,
	CardIds.ArcaneFlux_ArcaneFluxTavernBrawlEnchantment,
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
	CardIds.ArchVillainRafaam_DAL_422,
	CardIds.Arcsplitter,
	CardIds.Arfus_CORE_ICC_854,
	CardIds.Arfus_ICC_854,
	CardIds.ArgusTheEmeraldStar_CrystalCarvingToken,
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
	CardIds.BloodrockCoShovel_WW_412,
	CardIds.BloodsailFlybooter,
	CardIds.BolnerHammerbeak, // In case a repeated battlecry draws / creates something
	CardIds.BookOfWonders,
	CardIds.BoomSquad_YOD_023,
	CardIds.Bottomfeeder,
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
	CardIds.CarrionStudies,
	CardIds.Castle,
	CardIds.CastleTavernBrawl,
	CardIds.CelestialProjectionist,
	CardIds.ChaosStormTavernBrawl,
	CardIds.ChaosStorm_ChaosStormTavernBrawlEnchantment,
	CardIds.ChromieTimehopper_EscapeFromDurnholdeToken_WON_041t3,
	CardIds.ChromieTimehopper_OpeningTheDarkPortalToken_WON_041t,
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
	CardIds.CorsairCache,
	CardIds.CreationProtocol_CreationProtocolToken,
	CardIds.CreationProtocol,
	CardIds.Cryopreservation_WW_009,
	CardIds.CrystallineOracle,
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
	CardIds.DemonicDynamics,
	CardIds.DemonicStudies,
	CardIds.DemonizerTavernBrawlToken,
	CardIds.Dendrologist,
	CardIds.DesperateMeasures_DAL_141,
	CardIds.DetectiveMurlocHolmes,
	CardIds.DetectiveMurlocHolmesTavernBrawl,
	CardIds.DevouringSwarm,
	CardIds.DevoutBlessingsTavernBrawlToken,
	CardIds.DiligentNotetaker,
	CardIds.DinoTrackingTavernBrawl,
	CardIds.DiscJockey,
	CardIds.DiscoveryOfMagic,
	CardIds.DispossessedSoul,
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
	CardIds.DroneDeconstructor,
	CardIds.DropletOfInsanityTavernBrawlToken,
	CardIds.DrygulchJailor,
	CardIds.DryscaleDeputy_DryscaleDeputyEnchantment_WW_383e,
	CardIds.DryscaleDeputy_WW_383,
	CardIds.Duplicate,
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
	CardIds.EnergyShaper,
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
	CardIds.GetawayKodo,
	CardIds.GhostWriter,
	CardIds.GiftOfTheOldGodsTavernBrawlToken,
	CardIds.GildedGargoyle_LOOT_534,
	CardIds.GoldenKobold,
	CardIds.GoldenScarab,
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
	CardIds.HagathaTheWitch_BewitchHeroic,
	CardIds.HakkarTheSoulflayer_CorruptedBloodToken,
	CardIds.HalazziTheLynx,
	CardIds.Hallucination,
	CardIds.HarbingerOfWinterCore_RLK_511,
	CardIds.Harpoon,
	CardIds.HeadcrackLegacy,
	CardIds.HeadcrackVanilla,
	CardIds.HeistbaronTogwaggle_DAL_417,
	CardIds.Hematurge_RLK_066,
	CardIds.Hematurge_RLK_Prologue_066,
	CardIds.HenchClanBurglar_DAL_416,
	CardIds.HenchClanBurglarCore,
	CardIds.HiHoSilverwing_WW_344,
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
	CardIds.IllidariStudies_YOP_001,
	CardIds.IllidariStudiesCore,
	CardIds.ImpCredibleTrousers_ImpCredibleTrousersTavernBrawlEnchantment,
	CardIds.ImpCredibleTrousersTavernBrawl,
	CardIds.ImportPet_ImportPet,
	CardIds.ImportPet,
	CardIds.ImproveMorale,
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
	CardIds.LadyLiadrin,
	CardIds.LakkariSacrifice,
	CardIds.LargeWaxyGiftTavernBrawl,
	CardIds.LegendaryLootTavernBrawl,
	CardIds.LegendaryLoot_LegendaryLootTavernBrawlEnchantment,
	CardIds.LesserRubySpellstone,
	CardIds.LicensedAdventurer,
	CardIds.LifebindersBloom,
	CardIds.LifebindersGift,
	CardIds.LightforgedBlessing_DAL_568,
	CardIds.LightningReflexes_LightningReflexesEnchantment,
	CardIds.LightningReflexes,
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
	CardIds.MadameLazul,
	CardIds.Magicfin,
	CardIds.MagicTrick,
	CardIds.MailboxDancer,
	CardIds.MalygosAspectOfMagic,
	CardIds.MalygosTheSpellweaverCore,
	CardIds.ManaBind,
	CardIds.ManaCyclone,
	CardIds.Mankrik,
	CardIds.MarkedShot,
	CardIds.MarkedShotCore,
	CardIds.Marshspawn_BT_115,
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
	CardIds.Metrognome,
	CardIds.MimironTheMastermind,
	CardIds.MindEater,
	CardIds.MindrenderIllucia,
	CardIds.MindVisionLegacy,
	CardIds.MindVisionVanilla,
	CardIds.MiracleSalesman_WW_331,
	CardIds.MisterMukla_ETC_836,
	CardIds.MixedPotion_MixedConcoctionToken_RLK_570tt3,
	CardIds.Mixtape,
	CardIds.MoargDrillfist_WW_442,
	CardIds.MoltenRune_MoltenRuneToken,
	CardIds.MoltenRune,
	CardIds.MoonbeastTavernBrawlToken,
	CardIds.MuckbornServant,
	CardIds.MuklaTyrantOfTheVale,
	CardIds.MurlocHolmes_REV_022,
	CardIds.MurlocHolmes_REV_770,
	CardIds.MurozondThiefOfTime_WON_066,
	CardIds.MuseumCurator_WON_056,
	CardIds.MuseumCurator,
	CardIds.MysteryWinner,
	CardIds.MysticalMirage_ULDA_035,
	CardIds.NatureStudies_SCH_333,
	CardIds.RenoLoneRanger_NatureBullet_WW_0700p5,
	CardIds.NecroticMortician,
	CardIds.Nefarian_BRM_030,
	CardIds.NellieTheGreatThresher_NelliesPirateShipToken,
	CardIds.Neptulon_GVG_042,
	CardIds.NerubianVizier,
	CardIds.NetherspiteHistorian,
	CardIds.Netherwalker,
	CardIds.NineLives,
	CardIds.OasisOutlaws_WW_404,
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
	CardIds.PrimordialGlyph,
	CardIds.PrimordialStudies_SCH_270,
	CardIds.PrismaticElemental,
	CardIds.PsychicConjurerCore,
	CardIds.PsychicConjurerLegacy,
	CardIds.Pyros,
	CardIds.Pyros_PyrosToken_UNG_027t2,
	CardIds.Pyrotechnician,
	CardIds.QueenAzshara_TSC_641,
	CardIds.RaidNegotiator,
	CardIds.RaidTheDocks_SecureTheSuppliesToken,
	CardIds.RaiseDead_SCH_514,
	CardIds.RamCommander,
	CardIds.RamkahenWildtamer,
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
	CardIds.RenounceDarkness,
	CardIds.ResizingPouch,
	CardIds.Rewind_ETC_532,
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
	CardIds.SavageSecretsTavernBrawl,
	CardIds.SaxophoneSoloist,
	CardIds.Schooling,
	CardIds.SchoolTeacher,
	CardIds.ScourgeIllusionist,
	CardIds.ScourgeTamer,
	CardIds.ScourgingTavernBrawl,
	CardIds.Scrapsmith,
	CardIds.Seance,
	CardIds.SecondWishTavernBrawl,
	CardIds.SecureTheDeck,
	CardIds.SeekGuidance_IlluminateTheVoidToken, // Xyrella, the Sanctified
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
	CardIds.Synthesize,
	CardIds.TamsinRoame_BAR_918,
	CardIds.TanglefurMystic,
	CardIds.TasteOfChaos,
	CardIds.TearReality,
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
	CardIds.TheSunwell,
	CardIds.ThistleTea,
	CardIds.ThoughtstealLegacy,
	CardIds.ThoughtstealVanilla,
	CardIds.TidestoneOfGolganneth,
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
	CardIds.TrainingSession_NX2_029,
	CardIds.TrainingSession_TrainingSessionAchieveEnchantment,
	CardIds.TrainingSession_TrainingSessionEnchantment,
	CardIds.TramHeist_WW_053,
	CardIds.TramMechanic_WW_044,
	CardIds.TransferStudent_TransferStudentToken_SCH_199t19,
	CardIds.TransferStudent_TransferStudentToken_SCH_199t6,
	CardIds.TwinSlice_BT_175,
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
	CardIds.Webspinner_FP1_011,
	CardIds.WellEquippedTavernBrawl_PVPDR_Brann_HP2,
	CardIds.WhelpWrangler_WW_827,
	CardIds.WhispersOfEvil,
	CardIds.WildGrowthCore,
	CardIds.WildGrowthLegacy,
	CardIds.WildGrowthVanilla,
	CardIds.WishingWell_WW_415,
	CardIds.WitchsApprentice,
	CardIds.WitchwoodApple,
	CardIds.WitchwoodAppleCore,
	CardIds.WorgenRoadie_InstrumentCaseToken,
	CardIds.WorldPillarFragmentToken_DEEP_999t3,
	CardIds.WorthyExpedition,
	CardIds.WretchedExile,
	CardIds.XarilPoisonedMind,
	CardIds.YoggSaronMasterOfFate_HandOfFateToken,
	CardIds.YoggSaronUnleashed_TentacleSwarmToken_YOG_516t3,
	CardIds.YseraLegacy,
	CardIds.YseraTheDreamerCore,
	CardIds.YseraVanilla,
	CardIds.Zaqul_Story_11_Zaqul,
	CardIds.Zaqul_TSC_959,
	CardIds.ZephrysTheGreat_ULD_003,
	CardIds.ZolaTheGorgon,
	CardIds.ZolaTheGorgonCore,
	CardIds.StonehillDefender,
	CardIds.MismatchedFossils_DEEP_001,
	CardIds.ShatteredReflections_DEEP_025,
	CardIds.FoolsGold_DEEP_022,
	CardIds.FoolsGoldTavernBrawl,
	CardIds.MaruutStonebinder_DEEP_037,
];
