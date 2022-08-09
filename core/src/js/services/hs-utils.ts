import { BoosterType, CardClass, CardIds, COIN_IDS, GameType } from '@firestone-hs/reference-data';
import { PackResult } from '@firestone-hs/user-packs';
import { CardsFacadeService } from '@services/cards-facade.service';
import { isBattlegrounds } from './battlegrounds/bgs-utils';
import { LocalizationFacadeService } from './localization-facade.service';

// Don't specify anything by default, so that the "cache refresh" properly refreshes the data
// (it is query-specific).
// Only use a string in dev mode, otherwise rely on cache purge
// Actually, it looks relying on the CF cache doesn't work too well for the cards (while it
// works well in the browser, you sometimes get old data when getting it in the app). So the
// string will be used in Firestone only
export const CARDS_VERSION = '';

export const classes = [
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

export const formatClass = (playerClass: string, i18n: { translateString: (string) => string }): string => {
	return i18n.translateString(`global.class.${playerClass?.toLowerCase()}`);
};

export const colorForClass = (playerClass: string): string => {
	switch (playerClass) {
		case 'demonhunter':
			return '#8ECD64';
		case 'druid':
			return '#965F45';
		case 'hunter':
			return '#0A5945';
		case 'mage':
			return '#24A4C7';
		case 'paladin':
			return '#E3A81F';
		case 'priest':
			return '#8C98A7';
		case 'rogue':
			return '#5E6069';
		case 'shaman':
			return '#542A8A';
		case 'warrior':
			return '#CB3222';
		case 'warlock':
			return '#8A2A6A';
	}
};

export const battlecryGlobalEffectCards = [
	CardIds.AldorAttendant,
	CardIds.AldorTruthseeker,
	CardIds.ArchbishopBenedictus,
	CardIds.CommandTheElements_StormcallerBrukanToken,
	CardIds.DarkInquisitorXanesh,
	CardIds.DarkPharaohTekahn,
	CardIds.DefendTheDwarvenDistrict_TavishMasterMarksmanToken,
	CardIds.DemonslayerKurtrusToken,
	CardIds.FrizzKindleroost,
	CardIds.FrostLichJaina,
	CardIds.GraniteForgeborn,
	CardIds.HemetJungleHunter,
	CardIds.InfiniteMurloc,
	CardIds.LadyInWhite,
	CardIds.LadyPrestor_SW_078,
	CardIds.LordaeronAttendantToken,
	CardIds.LorekeeperPolkelt,
	CardIds.LothraxionTheRedeemed,
	CardIds.NeeruFireblade_BAR_919,
	CardIds.PrinceKeleseth,
	CardIds.RadiantLightspawn,
	CardIds.RiseToTheOccasion_LightbornCarielToken,
	CardIds.ShandoWildclaw, // TODO: only show the effect if the "beast in your deck +1/+1 option, is chosen"
	CardIds.SkulkingGeist,
	CardIds.Snapdragon,
	CardIds.SorcerersGambit_ArcanistDawngraspToken,
	CardIds.TopiorTheShrubbagazzor,
	CardIds.TheDemonSeed_BlightbornTamsinToken,
	CardIds.TheStonewright,
	CardIds.WildheartGuff,
	CardIds.WyrmrestPurifier,
];

export const globalEffectCards = [
	...battlecryGlobalEffectCards,
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
	CardIds.PrinceRenathal,
	CardIds.ReductomaraToken,
	CardIds.RelicOfDimensions,
	CardIds.RelicOfExtinction,
	CardIds.RelicOfPhantasms,
	CardIds.RenounceDarkness,
	CardIds.RaidTheDocks_SecureTheSuppliesToken, // Cap'n Rokara
	CardIds.SurvivalOfTheFittest_SCH_609,
	CardIds.TheCavernsBelow_CrystalCoreToken,
	CardIds.TheDemonSeed_CompleteTheRitualToken, // BLightborn Tamsin
	CardIds.UpgradedPackMule,
	CardIds.Wildfire,
];

export const globalEffectTriggers = [
	{
		// There are actually several effects that are triggered (one for hand, deck and board)
		// We use only the deck one, as it's the one that is most likely to always be there
		// We could also create a brand new event on the parser side, but I'd rather first
		// see how other minions/effects will be handled in the future
		effectPrefab: 'DMF_GrandTotemAmikwe_Battlecry_DeckBoosh_Super.prefab',
		cardId: CardIds.GrandTotemEysor,
	},
	{
		effectPrefab: 'AVFX_VannderSpike_Trigger_DeckAE_Super',
		cardId: CardIds.VanndarStormpike_AV_223,
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
	CardIds.DeckOfWonders_ScrollOfWonderToken,
	CardIds.EncumberedPackMule,
	CardIds.FaldoreiStrider_SpiderAmbush,
	CardIds.DreadlichTamsin_FelRiftToken,
	CardIds.FlyBy_KadoomBotToken,
	CardIds.HakkarTheSoulflayer_CorruptedBloodToken,
	CardIds.IronJuggernaut_BurrowingMineToken,
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

export const forcedHiddenCardCreators = [
	CardIds.Chameleos,
	CardIds.CoilfangConstrictor,
	CardIds.IdentityTheft,
	CardIds.MadameLazul,
	CardIds.MaskOfMimicry,
	CardIds.MaskOfMimicryTavernBrawl,
	CardIds.MindVisionLegacy,
	CardIds.MindVisionVanilla,
	// So that even "revealed when drawn" cards are not revelaed when plundered by Hooktusk
	CardIds.PirateAdmiralHooktusk_TakeTheirGoldToken,
	CardIds.PirateAdmiralHooktusk_TakeTheirShipToken,
	CardIds.PirateAdmiralHooktusk_TakeTheirSuppliesToken,
	CardIds.PsychicConjurerCore,
	CardIds.PsychicConjurerLegacy,
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

export const publicCardGiftCreators = [
	CardIds.AbyssalWave,
	CardIds.AmalgamOfTheDeep,
	CardIds.ApocalypseTavernBrawlToken,
	CardIds.ArcaneBrilliance,
	CardIds.ArchmageArugal,
	CardIds.BagOfCoins_LOOTA_836,
	CardIds.BagOfCoins_Story_11_BagofCoinsPuzzle,
	CardIds.BagOfCoinsTavernBrawl,
	CardIds.BattleVicar,
	CardIds.Questionquestionquestion_BlackSoulstoneTavernBrawl,
	CardIds.BlessingOfTheAncients_DAL_351,
	CardIds.BloodsailFlybooter,
	CardIds.Bottomfeeder,
	CardIds.BronzeHerald,
	CardIds.BuildASnowman,
	CardIds.BuildASnowman_BuildASnowbruteToken,
	CardIds.BuildASnowman_BuildASnowgreToken,
	CardIds.ClawMachine,
	CardIds.CloakOfEmeraldDreamsTavernBrawl,
	CardIds.CloakOfEmeraldDreams_CloakOfEmeraldDreamsTavernBrawlEnchantment,
	CardIds.CommanderSivara_TSC_087,
	CardIds.CommanderSivara_Story_11_Sivara,
	CardIds.CommandTheElements_StormcallerBrukanToken,
	CardIds.CommandTheElements_TameTheFlamesToken, // Stormcaller Brukan
	CardIds.CorsairCache,
	CardIds.DefendTheDwarvenDistrict_KnockEmDownToken, // For Tavish
	CardIds.DevouringSwarm,
	CardIds.DispossessedSoul,
	CardIds.DraggedBelow,
	CardIds.DragonbaneShot,
	CardIds.DragonBreeder,
	CardIds.Duplicate,
	CardIds.EncumberedPackMule,
	CardIds.ExplorersHat,
	CardIds.FelsoulJailerCore,
	CardIds.FinalShowdown_CloseThePortalToken, // Demonslayer Kurtrus
	CardIds.FindTheImposter_SpyOMaticToken,
	CardIds.FindTheImposter_MarkedATraitorToken, // Spymaster Scabbs
	CardIds.FirstFlame,
	CardIds.FrozenTouch,
	CardIds.FullBlownEvil,
	CardIds.Guidance_YOP_024,
	CardIds.TheHarvesterOfEnvy,
	CardIds.IdentityTheft,
	CardIds.Jackpot,
	CardIds.JerryRigCarpenter,
	CardIds.JourneyBelow_OG_072,
	CardIds.Kazakus_CFM_621,
	CardIds.KazakusGolemShaper,
	CardIds.KoboldTaskmaster,
	CardIds.LoanShark,
	CardIds.LorewalkerCho,
	CardIds.LorewalkerChoLegacy,
	CardIds.LostInThePark_FeralFriendsyToken, // Guff the Tough
	CardIds.MailboxDancer,
	CardIds.Mankrik,
	CardIds.MarkedShot,
	CardIds.MarkedShotCore,
	// CardIds.NellieTheGreatThresher_NelliesPirateShipToken,
	CardIds.PackKodo,
	CardIds.Peon_BAR_022,
	CardIds.PlantedEvidence,
	CardIds.PsychicConjurerCore,
	CardIds.PsychicConjurerLegacy,
	CardIds.QueenAzshara_TSC_641,
	CardIds.HornOfAncients,
	CardIds.RaidNegotiator,
	CardIds.RaidTheDocks_SecureTheSuppliesToken,
	CardIds.RamCommander,
	CardIds.Reconnaissance,
	CardIds.RiseToTheOccasion_AvengeTheFallenToken, // Lightborn Cariel
	CardIds.RunicHelmTavernBrawl,
	CardIds.SchoolTeacher,
	CardIds.Scrapsmith,
	CardIds.SecureTheDeck,
	CardIds.SeekGuidance_IlluminateTheVoidToken, // Xyrella, the Sanctified
	CardIds.SelectiveBreederCore,
	CardIds.SirakessCultist,
	CardIds.Sleetbreaker,
	CardIds.SoothsayersCaravan,
	CardIds.SorcerersGambit,
	CardIds.SorcerersGambit_ReachThePortalRoomToken, // Arcanist Dawngrasp
	CardIds.SparkDrill_BOT_102,
	CardIds.Spellcoiler,
	CardIds.SuspiciousAlchemist_AMysteryEnchantment, // The one that really counts
	CardIds.SuspiciousAlchemist,
	CardIds.SuspiciousPirate,
	CardIds.SuspiciousUsher,
	CardIds.Swashburglar,
	CardIds.SwashburglarCore,
	CardIds.TamsinRoame_BAR_918,
	// For some reason the coin is flagged as created by the coin...
	...COIN_IDS,
	CardIds.TheLobotomizer,
	CardIds.ThistleTea,
	CardIds.ToothOfNefarian,
	CardIds.VanessaVancleefCore,
	CardIds.VenomousScorpid,
	CardIds.VioletSpellwing,
	CardIds.WandThief_SCH_350,
	CardIds.YseraTheDreamerCore,
	CardIds.Zaqul_TSC_959,
	CardIds.Zaqul_Story_11_Zaqul,
	CardIds.ZolaTheGorgon,
	CardIds.ZolaTheGorgonCore,
];

export const publicCardCreators = [
	...cardsConsideredPublic,
	...publicCardGiftCreators,
	CardIds.AkaliTheRhino,
	CardIds.AllianceBannerman,
	CardIds.AncientMysteries,
	CardIds.Ancharrr,
	CardIds.ArcaneFletcher,
	CardIds.Arcanologist,
	CardIds.ArcanologistCore,
	CardIds.AxeBerserker,
	CardIds.BalindaStonehearth,
	CardIds.BarakKodobane_BAR_551,
	CardIds.Bogshaper,
	CardIds.BookOfSpecters,
	CardIds.BrightEyedScout,
	CardIds.BwonsamdiTheDead,
	CardIds.CagematchCustodian,
	CardIds.CallPet_GVG_017,
	CardIds.CallPet_BOM_08_CallPet_004s,
	CardIds.CallToAdventure,
	CardIds.CaptainsParrotLegacy,
	CardIds.CaptainsParrotVanilla,
	CardIds.CaptureColdtoothMine,
	CardIds.CaptureColdtoothMine_MoreSupplies,
	CardIds.CaptureColdtoothMine_MoreResources,
	CardIds.CavernShinyfinder,
	CardIds.ConquerorsBanner,
	CardIds.CountessAshmore,
	CardIds.Crystology,
	CardIds.CursedCastaway,
	CardIds.DeadRinger,
	CardIds.DeepwaterEvoker,
	CardIds.DivingGryphon,
	CardIds.DoorOfShadows,
	CardIds.DunBaldarBunker,
	CardIds.ElementalAllies,
	CardIds.ElementaryReaction, // falls in both cases
	CardIds.ElvenMinstrel,
	CardIds.ExcavationSpecialist_TSC_911,
	CardIds.ExcavationSpecialist_Story_11_ExcavationPuzzle,
	CardIds.FarSightLegacy,
	CardIds.FarSightVanilla,
	CardIds.Felgorger,
	CardIds.FelLordBetrug_DAL_607, // don't know if you're talking about the card in hand or the minion summoned
	CardIds.ForgeOfSouls,
	CardIds.FreeAdmission,
	CardIds.FrostweaveDungeoneer,
	CardIds.FungalFortunes,
	CardIds.GalakrondTheNightmare,
	CardIds.GalakrondTheNightmare_GalakrondTheApocalypseToken,
	CardIds.GalakrondTheNightmare_GalakrondAzerothsEndToken,
	CardIds.GalakrondTheUnbreakable,
	CardIds.GalakrondTheUnbreakable_GalakrondTheApocalypseToken,
	CardIds.GalakrondTheUnbreakable_GalakrondAzerothsEndToken,
	CardIds.GuessTheWeight,
	CardIds.GhuunTheBloodGod,
	CardIds.GnomishExperimenter, // the chicken is created, but if the card drawn is not a minion, it should be an eye
	CardIds.GorlocRavager,
	CardIds.GrandEmpressShekzara,
	CardIds.HarborScamp,
	CardIds.HeraldOfLokholar,
	CardIds.HornOfWrathion,
	CardIds.HowlingCommander,
	CardIds.Hullbreaker,
	CardIds.IceFishing,
	CardIds.IceTrap,
	CardIds.BeaststalkerTavish_ImprovedIceTrapToken,
	CardIds.Insight_InsightToken,
	CardIds.InvestmentOpportunity,
	CardIds.JepettoJoybuzz,
	CardIds.JuicyPsychmelon,
	CardIds.KingsElekk,
	CardIds.KnightOfAnointment,
	CardIds.KronxDragonhoof,
	CardIds.LunarVisions,
	CardIds.MoonlitGuidance_DED_002, // falls in both cases
	CardIds.MoonlitGuidance_Story_11_MoonlitGuidance, // falls in both cases
	CardIds.MastersCall,
	CardIds.MurlocTastyfin,
	CardIds.NecriumApothecary,
	CardIds.NorthwatchCommander,
	CardIds.Parrrley_DED_005, // the parrrley generated by parrrley is a gift, though
	CardIds.Parrrley_Story_11_ParrrleyPuzzle, // the parrrley generated by parrrley is a gift, though
	CardIds.PredatoryInstincts,
	CardIds.PrimalDungeoneer,
	CardIds.PrimordialProtector_BAR_042,
	CardIds.PrismaticLens,
	CardIds.RadarDetector_TSC_079,
	CardIds.RadarDetector_Story_11_RadarDetector,
	CardIds.RaidingParty,
	CardIds.RaidTheDocks,
	CardIds.RavenFamiliar_LOOT_170,
	CardIds.RingmasterWhatley,
	CardIds.RollTheBones,
	CardIds.SalhetsPride,
	CardIds.Sandbinder,
	CardIds.ScavengersIngenuity,
	CardIds.SeafloorGateway_TSC_055,
	CardIds.SeafloorGateway_Story_11_SeafloorGatewayPuzzle,
	CardIds.SecretPassage_SecretEntranceEnchantment,
	CardIds.SeekGuidance,
	CardIds.SeekGuidance_DiscoverTheVoidShardToken,
	CardIds.SenseDemonsLegacy,
	CardIds.SenseDemonsVanilla_VAN_EX1_317,
	CardIds.ShroudOfConcealment,
	CardIds.SketchyInformation,
	CardIds.SmallTimeRecruits,
	CardIds.SorcerersGambit_StallForTimeToken,
	CardIds.SouthseaScoundrel_BAR_081, // the copy for the opponent is the original card, the copy for the player is created
	CardIds.SouthseaScoundrel_Story_11_SouthseaPuzzle, // the copy for the opponent is the original card, the copy for the player is created
	CardIds.SpiritGuide,
	CardIds.SpiritOfTheFrog,
	CardIds.StageDive,
	CardIds.StageDive_StageDive,
	CardIds.Starscryer,
	CardIds.StonehearthVindicator,
	CardIds.StormChaser,
	CardIds.Stowaway,
	CardIds.Subject9,
	CardIds.SupremeArchaeology_TomeOfOrigination,
	CardIds.Switcheroo,
	CardIds.Swindle,
	CardIds.TaelanFordringCore,
	CardIds.TentacledMenace,
	CardIds.TheCurator,
	CardIds.ThriveInTheShadowsCore,
	CardIds.TolvirWarden,
	CardIds.TownCrier_GIL_580,
	CardIds.TrenchSurveyor_TSC_642,
	CardIds.TrenchSurveyor_Story_11_TrenchSurveyorPuzzle,
	CardIds.Ursatron,
	CardIds.UtgardeGrapplesniper,
	CardIds.VarianKingOfStormwind,
	CardIds.VarianWrynn_AT_072,
	CardIds.VengefulSpirit_BAR_328,
	CardIds.VitalitySurge,
	CardIds.WarsongWrangler,
	CardIds.WidowbloomSeedsman,
	CardIds.WitchwoodPiper,
	CardIds.WondrousWand,
	CardIds.Wrathion_CFM_806,
];

export const CARDS_THAT_IMPROVE_WHEN_TRADED = [
	CardIds.AmuletOfUndying,
	CardIds.BlacksmithingHammer,
	CardIds.WickedShipment,
];

export const supportedAdditionalData = [
	CardIds.Ignite,
	CardIds.Bottomfeeder,
	CardIds.SirakessCultist_AbyssalCurseToken,
	...CARDS_THAT_IMPROVE_WHEN_TRADED,
];

export const getGalakrondCardFor = (className: string, invokeCount: number): string => {
	switch (className) {
		case 'priest':
			if (invokeCount >= 4) {
				return CardIds.GalakrondTheUnspeakable_GalakrondAzerothsEndToken;
			} else if (invokeCount >= 2) {
				return CardIds.GalakrondTheUnspeakable_GalakrondTheApocalypseToken;
			}
			return CardIds.GalakrondTheUnspeakable;
		case 'rogue':
			if (invokeCount >= 4) {
				return CardIds.GalakrondTheNightmare_GalakrondAzerothsEndToken;
			} else if (invokeCount >= 2) {
				return CardIds.GalakrondTheNightmare_GalakrondTheApocalypseToken;
			}
			return CardIds.GalakrondTheNightmare;
		case 'shaman':
			if (invokeCount >= 4) {
				return CardIds.GalakrondTheTempest_GalakrondAzerothsEndToken;
			} else if (invokeCount >= 2) {
				return CardIds.GalakrondTheTempest_GalakrondTheApocalypseToken;
			}
			return CardIds.GalakrondTheTempest;
		case 'warlock':
			if (invokeCount >= 4) {
				return CardIds.GalakrondTheWretched_GalakrondAzerothsEndToken;
			} else if (invokeCount >= 2) {
				return CardIds.GalakrondTheWretched_GalakrondTheApocalypseToken;
			}
			return CardIds.GalakrondTheWretched;
		case 'warrior':
			if (invokeCount >= 4) {
				return CardIds.GalakrondTheUnbreakable_GalakrondAzerothsEndToken;
			} else if (invokeCount >= 2) {
				return CardIds.GalakrondTheUnbreakable_GalakrondTheApocalypseToken;
			}
			return CardIds.GalakrondTheUnbreakable;
	}
	return CardIds.GalakrondTheNightmare;
};

export const defaultStartingHp = (gameType: GameType, heroCardId: string): number => {
	if (isBattlegrounds(gameType)) {
		switch (heroCardId) {
			case CardIds.PatchwerkBattlegrounds:
				return 55;
			default:
				return 40;
		}
	}
	return 30;
};

export const dustFor = (rarity: string): number => {
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

export const dustForPremium = (rarity: string): number => {
	return 4 * dustFor(rarity?.toLowerCase());
};

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

export const dustToCraftForPremium = (rarity: string): number => {
	return 4 * dustToCraftFor(rarity?.toLowerCase());
};

export const boosterIdToSetId = (boosterId: BoosterType): string => {
	switch (boosterId) {
		case BoosterType.CLASSIC:
		case BoosterType.GOLDEN_CLASSIC_PACK:
			return 'expert1';
		case BoosterType.GOBLINS_VS_GNOMES:
			return 'gvg';
		case BoosterType.THE_GRAND_TOURNAMENT:
			return 'tgt';
		case BoosterType.OLD_GODS:
		case BoosterType.FIRST_PURCHASE_OLD:
			return 'og';
		case BoosterType.MEAN_STREETS:
			return 'gangs';
		case BoosterType.UNGORO:
			return 'ungoro';
		case BoosterType.FROZEN_THRONE:
			return 'icecrown';
		case BoosterType.KOBOLDS_AND_CATACOMBS:
			return 'lootapalooza';
		case BoosterType.WITCHWOOD:
			return 'gilneas';
		case BoosterType.THE_BOOMSDAY_PROJECT:
			return 'boomsday';
		case BoosterType.RASTAKHANS_RUMBLE:
			return 'troll';
		case BoosterType.DALARAN:
			return 'dalaran';
		case BoosterType.ULDUM:
			return 'uldum';
		case BoosterType.DRAGONS:
			return 'dragons';
		case BoosterType.BLACK_TEMPLE:
			return 'black_temple';
		case BoosterType.SCHOLOMANCE:
		case BoosterType.GOLDEN_SCHOLOMANCE:
			return 'scholomance';
		case BoosterType.DARKMOON_FAIRE:
		case BoosterType.GOLDEN_DARKMOON_FAIRE:
			return 'darkmoon_faire';
		case BoosterType.THE_BARRENS:
		case BoosterType.GOLDEN_THE_BARRENS:
			return 'the_barrens';
		case BoosterType.STORMWIND:
		case BoosterType.GOLDEN_STORMWIND:
			return 'stormwind';
		case BoosterType.LETTUCE:
			return 'lettuce';
		case BoosterType.ALTERAC_VALLEY:
			return 'alterac_valley';
		case BoosterType.THE_SUNKEN_CITY:
		case BoosterType.GOLDEN_THE_SUNKEN_CITY:
			return 'the_sunken_city';
		case BoosterType.REVENDRETH:
		case BoosterType.GOLDEN_REVENDRETH:
			return 'revendreth';
		case BoosterType.STANDARD_HUNTER:
		case BoosterType.STANDARD_DRUID:
		case BoosterType.STANDARD_MAGE:
		case BoosterType.STANDARD_PALADIN:
		case BoosterType.STANDARD_WARRIOR:
		case BoosterType.STANDARD_PRIEST:
		case BoosterType.STANDARD_ROGUE:
		case BoosterType.STANDARD_SHAMAN:
		case BoosterType.STANDARD_WARLOCK:
		case BoosterType.STANDARD_DEMONHUNTER:
		case BoosterType.STANDARD_BUNDLE:
		case BoosterType.GOLDEN_STANDARD_BUNDLE:
		case BoosterType.MAMMOTH_BUNDLE:
		case BoosterType.YEAR_OF_DRAGON:
		case BoosterType.YEAR_OF_PHOENIX:
		case BoosterType.WILD_PACK:
		case BoosterType.SIGNUP_INCENTIVE:
		case BoosterType.FIRST_PURCHASE:
		default:
			// console.warn('unsupported booster type', boosterId);
			return null;
	}
};

export const getDefaultBoosterIdForSetId = (setId: string): BoosterType => {
	switch (setId) {
		case 'expert1':
			return BoosterType.CLASSIC;
		case 'gvg':
			return BoosterType.GOBLINS_VS_GNOMES;
		case 'tgt':
			return BoosterType.THE_GRAND_TOURNAMENT;
		case 'og':
			return BoosterType.OLD_GODS;
		case 'gangs':
			return BoosterType.MEAN_STREETS;
		case 'ungoro':
			return BoosterType.UNGORO;
		case 'icecrown':
			return BoosterType.FROZEN_THRONE;
		case 'lootapalooza':
			return BoosterType.KOBOLDS_AND_CATACOMBS;
		case 'gilneas':
			return BoosterType.WITCHWOOD;
		case 'boomsday':
			return BoosterType.THE_BOOMSDAY_PROJECT;
		case 'troll':
			return BoosterType.RASTAKHANS_RUMBLE;
		case 'dalaran':
			return BoosterType.DALARAN;
		case 'uldum':
			return BoosterType.ULDUM;
		case 'dragons':
			return BoosterType.DRAGONS;
		case 'black_temple':
			return BoosterType.BLACK_TEMPLE;
		case 'scholomance':
			return BoosterType.SCHOLOMANCE;
		case 'darkmoon_faire':
		case 'darkmoon_races':
			return BoosterType.DARKMOON_FAIRE;
		case 'the_barrens':
		case 'wailing_caverns':
			return BoosterType.THE_BARRENS;
		case 'stormwind':
		case 'deadmines':
			return BoosterType.STORMWIND;
		case 'alterac_valley':
		case 'onyxias_lair':
			return BoosterType.ALTERAC_VALLEY;
		case 'the_sunken_city':
		case 'throne_of_tides':
			return BoosterType.THE_SUNKEN_CITY;
		default:
			console.warn('no default booster type for set id', setId);
			return null;
	}
};

export const boosterIdToBoosterName = (boosterId: BoosterType, i18n: LocalizationFacadeService): string => {
	let normalizedBoosterId = boosterId;
	switch (boosterId) {
		case BoosterType.FIRST_PURCHASE_OLD:
			normalizedBoosterId = BoosterType.OLD_GODS;
	}
	return i18n.translateString(`global.pack.${BoosterType[normalizedBoosterId]?.toLowerCase()?.replace(/_/g, '-')}`);
};

export const getPackDustValue = (pack: PackResult): number => {
	return pack.boosterId === BoosterType.LETTUCE
		? pack.cards.map((card) => card.currencyAmount ?? 0).reduce((a, b) => a + b, 0)
		: pack.cards
				.map((card) =>
					card.cardType === 'GOLDEN' ? dustForPremium(card.cardRarity) : dustFor(card.cardRarity),
				)
				.reduce((a, b) => a + b, 0);
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
];

export const getDefaultHeroDbfIdForClass = (playerClass: string): number => {
	switch (playerClass?.toLowerCase()) {
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
	inputClass?: string,
	deckClass?: CardClass,
): number => {
	const cardFromHeroDbfId = cards.getCardFromDbfId(heroDbfId);
	// Don't normalize the dual-class heroes
	switch (cardFromHeroDbfId.id) {
		case CardIds.SirFinleyTavernBrawl_PVPDR_Hero_Finley:
		case CardIds.EliseStarseekerTavernBrawl_PVPDR_Hero_Elise:
		case CardIds.RenoJacksonTavernBrawl_PVPDR_Hero_Reno:
		case CardIds.BrannBronzebeardTavernBrawl_PVPDR_Hero_Brann:
			return heroDbfId;
		// Sometimes a neutral hero is provided even though the deck has class cards
		case CardIds.VanndarStormpikeTavernBrawl:
			switch (deckClass) {
				case CardClass.DEMONHUNTER:
					return cards.getCard(CardIds.IllidanStormrageHeroSkins).dbfId;
				case CardClass.HUNTER:
					return cards.getCard(CardIds.RexxarHeroSkins).dbfId;
				case CardClass.PALADIN:
					return cards.getCard(CardIds.UtherLightbringerHeroSkins).dbfId;
				case CardClass.PRIEST:
					return cards.getCard(CardIds.AnduinWrynnHeroSkins).dbfId;
				case CardClass.ROGUE:
					return cards.getCard(CardIds.ValeeraSanguinarHeroSkins).dbfId;
			}
			break;
		case CardIds.DrektharTavernBrawl:
			switch (deckClass) {
				case CardClass.DRUID:
					return cards.getCard(CardIds.MalfurionStormrageHeroSkins).dbfId;
				case CardClass.MAGE:
					return cards.getCard(CardIds.JainaProudmooreHeroSkins).dbfId;
				case CardClass.SHAMAN:
					return cards.getCard(CardIds.ThrallHeroSkins).dbfId;
				case CardClass.WARLOCK:
					return cards.getCard(CardIds.GuldanHeroSkins).dbfId;
				case CardClass.WARRIOR:
					return cards.getCard(CardIds.GarroshHellscreamHeroSkins).dbfId;
			}
			break;
	}

	const playerClass: string = inputClass ?? cards.getCardFromDbfId(heroDbfId)?.playerClass;
	if (!playerClass) {
		return heroDbfId;
	}

	switch (CardClass[playerClass?.toUpperCase()]) {
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
