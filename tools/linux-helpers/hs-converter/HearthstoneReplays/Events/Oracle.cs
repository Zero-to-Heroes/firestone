using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;
using static HearthstoneReplays.Events.CardIds;
using HearthstoneReplays.Parser.ReplayData.Meta;
using System.Linq;
using Action = HearthstoneReplays.Parser.ReplayData.GameActions.Action;
using Newtonsoft.Json.Linq;
using HearthstoneReplays.Events.Cards;
using HearthstoneReplays.Parser.ReplayData.Meta.Options;

namespace HearthstoneReplays.Events
{
    public class Oracle
    {
        private static List<string> PLAGUES = new List<string>()
        {
            CardIds.DistressedKvaldir_UnholyPlagueToken,
            CardIds.DistressedKvaldir_FrostPlagueToken,
            CardIds.DistressedKvaldir_BloodPlagueToken,
        };

        public static string GetCreatorFromTags(GameState gameState, FullEntity entity, Node node)
        {
            var creatorCardId = Oracle.GetCreatorCardIdFromTag(gameState, entity.GetTag(GameTag.CREATOR), entity);
            if (creatorCardId == null)
            {
                creatorCardId = Oracle.GetCreatorCardIdFromTag(gameState, entity.GetTag(GameTag.DISPLAYED_CREATOR), entity);
            }
            return creatorCardId;
        }
        public static string GetCreatorFromTags(GameState gameState, ShowEntity entity, Node node)
        {
            var creatorCardId = Oracle.GetCreatorCardIdFromTag(gameState, entity.GetTag(GameTag.CREATOR), entity);
            if (creatorCardId == null)
            {
                creatorCardId = Oracle.GetCreatorCardIdFromTag(gameState, entity.GetTag(GameTag.DISPLAYED_CREATOR), entity);
            }
            return creatorCardId;
        }

        public static Tuple<string, int> FindCardCreator(GameState GameState, FullEntity entity, Node node, bool getLastInfluencedBy = true, StateFacade stateFacade = null)
        {
            // If the card is already present in the deck, and was not created explicitely, there is no creator
            if (!getLastInfluencedBy
                && entity.GetTag(GameTag.CREATOR) == -1
                && entity.GetTag(GameTag.DISPLAYED_CREATOR) == -1
                && entity.GetTag(GameTag.CREATOR_DBID) == -1
                && entity.GetTag(GameTag.ZONE) == (int)Zone.DECK)
            {
                return null;
            }

            // Use DISPLAYED_CREATOR first, as this is the info we have in the UI
            var creatorTuple = Oracle.FindCardCreatorCardId(GameState, entity.GetTag(GameTag.DISPLAYED_CREATOR), node);
            if (creatorTuple == null)
            {
                creatorTuple = Oracle.FindCardCreatorCardId(GameState, entity.GetTag(GameTag.CREATOR), node);
            }
            if (creatorTuple?.Item1 == CardIds.DarkGiftToken_EDR_102t)
            {
                var futureEntity = stateFacade?.GsState.GameState.CurrentEntities.GetValueOrDefault(entity.Id);
                if (futureEntity != null)
                {
                    var realGiftCreatorEntityId = futureEntity.TagsHistory.LastOrDefault(t => t.Name == (int)GameTag.TAG_SCRIPT_DATA_ENT_1 && t.Value > 0)?.Value ?? 0;
                    var realGiftCreator = stateFacade.GsState.GameState.CurrentEntities.GetValueOrDefault(realGiftCreatorEntityId);
                    if (realGiftCreator != null)
                    {
                        creatorTuple = new Tuple<string, int>(realGiftCreator.CardId, realGiftCreatorEntityId);
                    }
                }
            }
            return creatorTuple;
        }

        public static Tuple<string, int> FindCardCreatorCardId(GameState GameState, ShowEntity entity, Node node)
        {
            var creatorCardId = Oracle.FindCardCreatorCardId(GameState, entity.GetTag(GameTag.CREATOR), node);
            if (creatorCardId == null)
            {
                creatorCardId = Oracle.FindCardCreatorCardId(GameState, entity.GetTag(GameTag.DISPLAYED_CREATOR), node);
            }
            return creatorCardId;
        }

        //public static int FindCardCreatorEntityId(GameState GameState, FullEntity entity, Node node, bool getLastInfluencedBy = true)
        //{
        //    // If the card is already present in the deck, and was not created explicitely, there is no creator
        //    if (!getLastInfluencedBy
        //        && entity.GetTag(GameTag.CREATOR) == -1
        //        && entity.GetTag(GameTag.DISPLAYED_CREATOR) == -1
        //        && entity.GetTag(GameTag.CREATOR_DBID) == -1
        //        && entity.GetTag(GameTag.ZONE) == (int)Zone.DECK)
        //    {
        //        return -1;
        //    }

        //    var creatorFromTags = entity.GetTag(GameTag.CREATOR) != -1 ? entity.GetTag(GameTag.CREATOR) : entity.GetTag(GameTag.DISPLAYED_CREATOR);
        //    if (creatorFromTags == -1)
        //    {

        //    }
        //    return creatorFromTags;
        //}

        //public static int FindCardCreatorEntityId(GameState GameState, ShowEntity entity, Node node)
        //{
        //    return entity.GetTag(GameTag.CREATOR) != -1 ? entity.GetTag(GameTag.CREATOR) : entity.GetTag(GameTag.DISPLAYED_CREATOR);
        //}

        public static Tuple<string, int> FindCardCreatorCardId(GameState GameState, int creatorTag, Node node)
        {
            if (creatorTag != -1 && GameState.CurrentEntities.ContainsKey(creatorTag))
            {
                var creator = GameState.CurrentEntities[creatorTag];
                return new Tuple<string, int>(creator?.CardId, creator?.Entity ?? -1);
            }
            var parentEntity = FindParentEntity(GameState, node);
            return parentEntity;
        }

        public static Tuple<string, int> FindParentEntity(GameState GameState, Node node)
        {
            if (node.Parent.Type == typeof(Parser.ReplayData.GameActions.Action))
            {
                var act = node.Parent.Object as Parser.ReplayData.GameActions.Action;
                if (GameState.CurrentEntities.ContainsKey(act.Entity))
                {
                    var creator = GameState.CurrentEntities[act.Entity];
                    // Spoecial case for Draem Portals, since for some reasons a Dream Portal the nests the next 
                    // action (which can lead to nested dream portal blocks)
                    if (creator?.CardId == YseraUnleashed_DreamPortalToken)
                    {
                        if (node.Object.GetType() == typeof(ShowEntity))
                        {
                            var handledEntity = (node.Object as ShowEntity);
                            if (handledEntity.GetTag(GameTag.ZONE) == (int)Zone.HAND)
                            {
                                return null;
                            }
                        }
                    }

                    return new Tuple<string, int>(creator?.CardId, creator?.Entity ?? -1);
                }
            }
            return null;
        }

        private static string GetCreatorCardIdFromTag(GameState gameState, int creatorTag, FullEntity entity)
        {
            if (creatorTag != -1 && gameState.CurrentEntities.ContainsKey(creatorTag))
            {
                var creator = gameState.CurrentEntities[creatorTag];
                return creator?.CardId;
            }
            return null;
        }

        private static string GetCreatorCardIdFromTag(GameState GameState, int creatorTag, ShowEntity entity)
        {
            if (creatorTag != -1 && GameState.CurrentEntities.ContainsKey(creatorTag))
            {
                var creator = GameState.CurrentEntities[creatorTag];
                return creator?.CardId;
            }
            return null;
        }


        public static List<Tag> GuessTags(
            GameState gameState,
            string creatorCardId,
            int creatorEntityId,
            Node node,
            string inputCardId = null,
            StateFacade stateFacade = null,
            int? createdEntityId = null)
        {
            switch (creatorCardId)
            {
                case DeepSpaceCurator_GDB_311:
                    return DeepSpaceCurator.GuessTags(gameState, creatorCardId, creatorEntityId, node, stateFacade);
                default:
                    return null;
            }
        }

        public static string PredictCardId(
            GameState gameState,
            string creatorCardId,
            int creatorEntityId,
            Node node,
            string inputCardId = null,
            StateFacade stateFacade = null,
            int? createdEntityId = null,
            SubSpell subSpellInEffect = null
        )
        {
            var debug = creatorCardId == PrimalSabretooth_TLC_247;
            if (inputCardId != null && inputCardId.Length > 0)
            {
                return inputCardId;
            }
            // Don't know how to support the Libram of Wisdom / Explorer's Hat use case without this
            // Maybe handling the sub_spell blocks could work, but it feels really weird (it's animation stuff inside
            // gamestate logs), and needs a full rework of the XML, which probably will be a lot of work
            var isFunkyDeathrattleEffect = false;
            if (node.Parent != null && node.Parent.Type == typeof(Parser.ReplayData.GameActions.Action))
            {
                var action = node.Parent.Object as Parser.ReplayData.GameActions.Action;
                if (action.Type == (int)BlockType.TRIGGER && action.TriggerKeyword == (int)GameTag.DEATHRATTLE && action.EffectIndex == -1)
                {
                    isFunkyDeathrattleEffect = true;
                }
            }

            var creatorEntity = gameState.CurrentEntities.GetValueOrDefault(creatorEntityId);
            if (!isFunkyDeathrattleEffect)
            {
                switch (creatorCardId)
                {
                    // Doesn't work that way. The card created in deck should be the wish, but we don't know about the card in hand
                    //case FirstWishTavernBrawl: return SecondWishTavernBrawl;
                    //case MarvelousMyceliumTavernBrawlToken: return MarvelousMyceliumTavernBrawlToken;
                    //case SecondWishTavernBrawl: return ThirdWishTavernBrawl;
                    case AbyssalWave: return SirakessCultist_AbyssalCurseToken;
                    case Acornbearer: return Acornbearer_SquirrelToken;
                    case AdorableInfestation: return AdorableInfestation_MarsuulCubToken;
                    case AirRaid_YOD_012: return AirRaid_YOD_012ts;
                    case Akama_BT_713: return Akama_AkamaPrimeToken;
                    case AmateurPuppeteer_TOY_828: return AmateurPuppeteer_AmateurPuppeteerToken_TOY_828t;
                    case AncientShade: return AncientShade_AncientCurseToken;
                    case AngryMob: return CrazedMob;
                    case ArcaneWyrm: return ArcaneBolt;
                    case ArchmageAntonidas: return FireballCore_CORE_CS2_029;
                    case ArchmageAntonidas_CORE_EX1_559: return FireballCore_CORE_CS2_029;
                    case ArchmageAntonidasLegacy: return FireballCore_CORE_CS2_029;
                    case ArchmageAntonidasVanilla: return FireballCore_CORE_CS2_029;
                    case ArchsporeMsshifn: return ArchsporeMsshifn_MsshifnPrimeToken;
                    case Arcsplitter: return ArcaneBolt;
                    case AstalorBloodsworn_AstalorTheProtectorToken: return AstalorBloodsworn_AstalorTheFlamebringerToken;
                    case AstalorBloodsworn: return AstalorBloodsworn_AstalorTheProtectorToken;
                    case AstralTiger: return AstralTiger;
                    case AstromancerSolarian: return AstromancerSolarian_SolarianPrimeToken;
                    case AwakeningTremors: return AwakeningTremors_BurstingJormungarToken;
                    case AwakenTheMakers: return AwakenTheMakers_AmaraWardenOfHopeToken;
                    case AzsharanDefector: return AzsharanDefector_SunkenDefectorToken;
                    case AzsharanGardens: return AzsharanGardens_SunkenGardensToken;
                    case AzsharanMooncatcher_TSC_644: return AzsharanMooncatcher_SunkenMooncatcherToken;
                    case AzsharanRitual: return AzsharanRitual_SunkenRitualToken;
                    case AzsharanSaber: return AzsharanSaber_SunkenSaberToken;
                    case AzsharanScavenger: return AzsharanScavenger_SunkenScavengerToken;
                    case AzsharanScroll: return AzsharanScroll_SunkenScrollToken;
                    case AzsharanSentinel: return AzsharanSentinel_SunkenSentinelToken;
                    case AzsharanSweeper_TSC_776: return AzsharanSweeper_SunkenSweeperToken;
                    case AzsharanTrident: return AzsharanTrident_SunkenTridentToken;
                    case AzsharanVessel: return AzsharanVessel_SunkenVesselToken;
                    case BadLuckAlbatross: return BadLuckAlbatross_AlbatrossToken;
                    case BagOfCoins_LOOTA_836: return TheCoinCore;
                    case BagOfCoinsTavernBrawl: return TheCoinCore;
                    case BananaBuffoon: return BananaBuffoon_BananasToken;
                    case BananaVendor: return BananaVendor_BananasToken;
                    case BarrelOfMonkeys_BarrelOfMonkeysToken_ETC_207t: return BarrelOfMonkeys_BarrelOfMonkeysToken_ETC_207t2;
                    case BarrelOfMonkeys: return BarrelOfMonkeys_BarrelOfMonkeysToken_ETC_207t;
                    case BaubleOfBeetles_ULDA_307: return BaubleOfBeetles_ULDA_307ts;
                    case BeneathTheGrounds: return BeneathTheGrounds_NerubianAmbushToken;
                    case BeOurGuestTavernBrawl: return TheCountess_LegendaryInvitationToken;
                    //case BlackSoulstone: return BlackSoulstone;
                    case BlackwingExperiment_CATA_464: return BlackwingExperiment_DragonBreathToken_CATA_464t;
                    case BlessingOfTheAncients_DAL_351: return BlessingOfTheAncients_DAL_351ts;
                    case BloodsailFlybooter: return BloodsailFlybooter_SkyPirateToken;
                    case BoneBaron_CORE_ICC_065: return GrimNecromancer_SkeletonToken;
                    case BoneBaron_ICC_065: return GrimNecromancer_SkeletonToken;
                    case BookOfWonders: return DeckOfWonders_ScrollOfWonderToken;
                    case BootyBayBookie: return TheCoinCore;
                    case Bottomfeeder: return Bottomfeeder;
                    case BoomWrench_TOY_604: return BoomWrench_BoomWrenchToken_TOY_604t;
                    case BountyWrangler_WW_363: return TheCoinCore;
                    case BringOnRecruitsTavernBrawl: return SilverHandRecruitLegacyToken;
                    case BroodQueen_SC_003: return BroodQueen_LarvaToken_SC_003t;
                    case BronzeHerald: return BronzeHerald_BronzeDragonToken;
                    case BuildASnowman_BuildASnowbruteToken: return BuildASnowman_BuildASnowgreToken;
                    case BuildASnowman: return BuildASnowman_BuildASnowbruteToken;
                    case BumperCar: return BumperCar_DarkmoonRiderToken;
                    case BunchOfBananas_BunchOfBananasToken_ETC_201t: return BunchOfBananas_BunchOfBananasToken_ETC_201t2;
                    case BunchOfBananas: return BunchOfBananas_BunchOfBananasToken_ETC_201t;
                    case BurglyBully: return TheCoinCore;
                    case CarelessCrafter_TOY_382: return CarelessCrafter_BandageToken_TOY_382t;
                    case CashCow_WORK_019: return TheCoinCore;
                    case CarryOnGrub_VAC_935: return CarryOnGrub_CarryOnSuitcaseToken_VAC_935t;
                    case ChainsOfDread_AV_316hp: return DreadlichTamsin_FelRiftToken;
                    case ChiaDrake_TOY_801: return ChiaDrake_ChiaDrakeToken_TOY_801t;
                    case ClayMatriarch_TOY_380: return ClayMatriarch_ClayMatriarchToken_TOY_380t;
                    case ClockworkGoblin_DAL_060: return SeaforiumBomber_BombToken;
                    case CoinPouch_SackOfCoinsTavernBrawl: return CoinPouch_HeftySackOfCoinsTavernBrawl;
                    case CoinPouch: return SackOfCoins;
                    case CoinPouchTavernBrawl: return CoinPouch_SackOfCoinsTavernBrawl;
                    case CommandTheElements_TameTheFlamesToken: return CommandTheElements_StormcallerBrukanToken;
                    case ConfectionCyclone: return ConfectionCyclone_SugarElementalToken;
                    case ConjureManaBiscuit: return ConjureManaBiscuit_ManaBiscuitToken;
                    case ConjurersCalling_DAL_177: return ConjurersCalling_DAL_177ts;
                    case ConsiderThePast_ConsiderThePastEnchantment_TOT_341e: return ConsiderThePast;
                    case CoppertailSnoop_CoppertailSnoopEnchantment: return TheCoinCore;
                    case CoppertailSnoop: return TheCoinCore;
                    case CreepyCurio_HauntedCurioTavernBrawl: return CreepyCurio_CursedCurioTavernBrawl;
                    case CreepyCurio: return HauntedCurio;
                    case CreepyCurioTavernBrawl: return CreepyCurio_HauntedCurioTavernBrawl;
                    case CthunTheShattered_BodyOfCthunToken: return CthunTheShattered;
                    case CthunTheShattered_EyeOfCthunToken: return CthunTheShattered;
                    case CthunTheShattered_HeartOfCthunToken: return CthunTheShattered;
                    case CthunTheShattered_MawOfCthunToken: return CthunTheShattered;
                    case CurseOfAgony: return CurseOfAgony_AgonyToken;
                    case CurseOfRafaam: return CurseOfRafaam_CursedToken;
                    case Cutpurse: return TheCoinCore;
                    case DartThrow_WW_006: return TheCoinCore;
                    case DeadlyFork: return DeadlyFork_SharpFork;
                    case DeathbringerSaurfangCore_RLK_082: return DeathbringerSaurfangCore_RLK_082;
                    case DeckOfWonders: return DeckOfWonders_ScrollOfWonderToken;
                    case DefendTheDwarvenDistrict_KnockEmDownToken: return DefendTheDwarvenDistrict_TavishMasterMarksmanToken;
                    case DesperateMeasures_DAL_141: return DesperateMeasures_DAL_141ts;
                    case DigForTreasure_TOY_510: return TheCoinCore;
                    case DirehornHatchling: return DirehornHatchling_DirehornMatriarchToken;
                    case Doomcaller: return Cthun_OG_279;
                    case DraggedBelow: return SirakessCultist_AbyssalCurseToken;
                    case DragonbaneShot: return DragonbaneShot;
                    case DrawOffensivePlayTavernBrawlEnchantment: return OffensivePlayTavernBrawl;
                    case DreadlichTamsin_AV_316: return DreadlichTamsin_FelRiftToken;
                    case DrivenToGreed_ChaoticUnspentCoinEnchantment_TTN_002t20e: return TheCoinCore;
                    case RuleModifier_DrivenToGreedToken_TTN_002t20: return TheCoinCore;
                    case DrygulchJailor: return SilverHandRecruitLegacyToken;
                    case EliseStarseeker_CORE_LOE_079: return UnearthedRaptor_MapToTheGoldenMonkeyToken;
                    case EliseStarseeker_LOE_079: return UnearthedRaptor_MapToTheGoldenMonkeyToken;
                    case EliseTheTrailblazer: return EliseTheTrailblazer_UngoroPackToken;
                    case EliteTaurenChampion_MoltenPickOfRockToken: return EliteTaurenChampion_MoltenPickOfRockToken;
                    case EliteTaurenChampion: return EliteTaurenChampion_MoltenPickOfRockToken;
                    case EncumberedPackMule: return EncumberedPackMule;
                    case EscapeTheUnderfel_TLC_446: return EscapeTheUnderfel_UnderfelRiftToken_TLC_446t;
                    case EverburningPhoenix_EverburningEnchantment_FIR_919e: return EverburningPhoenix_FIR_919;
                    case DopEmergencyEnchant2Enchantment_DOP_002e: return EverburningPhoenix_FIR_919;
                    case Roach_SC_012: return Roach_SC_012;
                    case ExcavatedEvil: return ExcavatedEvil;
                    case ExploreUngoro: return ExploreUngoro_ChooseYourPathToken;
                    case ExplorersHat: return ExplorersHat;
                    case ExplorersHat_ExplorersHatEnchantment: return ExplorersHat;
                    case ExplorersHat_WON_022: return ExplorersHat_WON_022;
                    case ExtraArms: return ExtraArms_MoreArmsToken;
                    case EyeOfChaos_YOG_515: return ChaoticTendril_YOG_514;
                    case FactoryAssemblybot_TOY_601: return FactoryAssemblybot_FactoryAssemblybotToken_TOY_601t;
                    case FaldoreiStrider: return FaldoreiStrider_SpiderAmbush;
                    case FeralGibberer: return FeralGibberer;
                    case FinalShowdown_CloseThePortalToken: return DemonslayerKurtrusToken;
                    case FindTheImposter_MarkedATraitorToken: return FindTheImposter_SpymasterScabbsToken;
                    case FireFly: return FireFly_FlameElementalToken;
                    case FireFly_CORE_UNG_809: return FireFly_FlameElementalToken;
                    case FirePlumesHeart: return FirePlumesHeart_SulfurasToken;
                    case FirstFlame: return FirstFlame_SecondFlameToken;
                    case FirstFlame_CORE_SW_108: return FirstFlame_SecondFlameToken;
                    case FishyFlyer: return FishyFlyer_SpectralFlyerToken;
                    case FlameGeyser: return FireFly_FlameElementalToken;
                    case FlameGeyserCore: return FireFly_FlameElementalToken;
                    case FinalPortalToArgus_FleeingTerrorguardToken_TIME_020t5t: return Broxigar_TIME_020;
                    case FlickeringLightbot_MIS_918: return FlickeringLightbot_FlickeringLightbotToken_MIS_918t;
                    case FloppyHydra_TOY_897: return FloppyHydra_TOY_897;
                    case ForgottenTorch: return ForgottenTorch_RoaringTorchToken;
                    case Framester: return Framester_FramedToken;
                    case FreshScent_YOD_005: return FreshScent_YOD_005ts;
                    case FrostShardsTavernBrawl: return FrostShards_IceShardTavernBrawl;
                    case FrozenTouch_FrozenTouchToken: return FrozenTouch;
                    case FrozenTouch: return FrozenTouch_FrozenTouchToken;
                    case FullBlownEvil: return FullBlownEvil;
                    case GhastlyConjurer_CORE_ICC_069: return MirrorImageLegacy_CS2_027;
                    case GhastlyConjurer_ICC_069: return MirrorImageLegacy_CS2_027;
                    case GiftOfTheHeartTavernBrawlToken: return WildGrowth_ExcessManaLegacyToken;
                    case GildedGargoyle_LOOT_534: return TheCoinCore;
                    case GladeEcologist_TLC_820: return PurifyingVines_TLC_813;
                    case GorishiWasp_TLC_630: return GorishiWasp_GorishiStingerToken_TLC_630t;
                    case GreedyPartner_WW_901: return TheCoinCore;
                    case HakkarTheSoulflayer_CorruptedBloodToken: return HakkarTheSoulflayer_CorruptedBloodToken;
                    case HakkarTheSoulflayer: return HakkarTheSoulflayer_CorruptedBloodToken;
                    case HalazziTheLynx: return Springpaw_LynxToken;
                    case HandleWithBear_WORK_024: return HandleWithBear_CarefulBearToken_WORK_024t;
                    case Harpoon: return ArcaneShot;
                    case HauntedCurio: return CursedCurio;
                    case HeadcrackLegacy: return HeadcrackLegacy;
                    case HeadcrackVanilla: return HeadcrackVanilla;
                    case HighborneMentor_TIME_704: return HighborneMentor_HighbornePupilToken_TIME_704t;
                    case HighPriestessJeklik_CORE_TRL_252: return HighPriestessJeklik_CORE_TRL_252;
                    case HighPriestessJeklik_TRL_252: return HighPriestessJeklik_TRL_252;
                    case HoardingDragon_LOOT_144: return TheCoinCore;
                    case HolySpringwater_WW_395: return HolySpringwater_BottledSpringwaterToken_WW_395t;
                    case IdoOfTheThreshfleet_TLC_241: return IdoOfTheThreshfleet_CallTheThreshfleetToken_TLC_241t;
                    case IgneousElemental: return FireFly_FlameElementalToken;
                    case Ignite: return Ignite;
                    case Impbalming: return Impbalming_WorthlessImpToken;
                    case ImpCredibleTrousers_ImpCredibleTrousersTavernBrawlEnchantment: return DreadlichTamsin_FelRiftToken;
                    case ImpCredibleTrousersTavernBrawl: return DreadlichTamsin_FelRiftToken;
                    case InfernalStrikeTavernBrawl: return TwinSlice_SecondSliceToken;
                    case Infestation_TLC_902: return GorishiWasp_GorishiStingerToken_TLC_630t;
                    case InfestedGoblin: return WrappedGolem_ScarabToken;
                    case InfestedWatcher_YOG_523: return ChaoticTendril_YOG_514;
                    case InfinitizeTheMaxitude_InfinitizeTheMaxitudeEnchantment: return InfinitizeTheMaxitude;
                    case InvasiveShadeleaf_WW_393: return InvasiveShadeleaf_BottledShadeleafToken_WW_393t;
                    case IronJuggernaut: return IronJuggernaut_BurrowingMineToken;
                    case JadeDisplay_TOY_803: return JadeDisplay_TOY_803;
                    case JadeIdol_JadeStash: return JadeIdol;
                    case JadeIdol: return JadeIdol;
                    case JungleGiants: return JungleGiants_BarnabusTheStomperToken;
                    case KangorDancingKing: return KangorDancingKing;
                    case KanrethadEbonlocke: return KanrethadEbonlocke_KanrethadPrimeToken;
                    case KargathBladefist_BT_123: return KargathBladefist_KargathPrimeToken;
                    case GaronaHalforcen_KingLlaneToken_TIME_875t: return GaronaHalforcen_KingLlaneToken_TIME_875t;
                    case KingMaluk_TIME_042: return KingMaluk_InfiniteBananaToken_TIME_042t;
                    case KingMaluk_InfiniteBananaToken_TIME_042t: return KingMaluk_InfiniteBananaToken_TIME_042t;
                    case KingMukla_CORE_EX1_014: return KingMukla_BananasLegacyToken;
                    case KingMuklaLegacy: return KingMukla_BananasLegacyToken;
                    case KingMuklaVanilla: return KingMukla_BananasLegacyToken;
                    case Kingsbane_LOOT_542: return Kingsbane_LOOT_542;
                    case KingTogwaggle: return KingTogwaggle_KingsRansomToken;
                    case KoboldMiner_PouchOfCoinsToken_WW_001t18: return TheCoinCore;
                    case KoboldTaskmaster: return KoboldTaskmaster_ArmorScrapToken;
                    case LadyVashj_BT_109: return LadyVashj_VashjPrimeToken;
                    case LakkariSacrifice: return LakkariSacrifice_NetherPortalToken_UNG_829t1;
                    case LicensedAdventurer: return TheCoinCore;
                    case LieInWait_TLC_513: return LieInWait_MasterDuskToken_TLC_513t;
                    case LifesavingAura_VAC_922: return Grillmaster_SunscreenToken_VAC_917t;
                    case LightforgedBlessing_DAL_568: return LightforgedBlessing_DAL_568ts;
                    case LightOfTheNewMoon_LightOfTheFullMoonToken_FIR_918t: return LightOfTheNewMoon_FIR_918;
                    case LoanShark: return TheCoinCore;
                    case Locuuuusts_ONY_005tb3: return Locuuuusts_GiantLocustToken_ONY_005tb3t2;
                    case Locuuuusts_ULDA_036: return GiantLocust_Locuuuusts;
                    case LocuuuustsTavernBrawl: return Locuuuusts_LocuuuustsTavernBrawl;
                    case LostInThePark_FeralFriendsyToken: return LostInThePark_GuffTheToughToken;
                    case MadeOfCoins: return TheCoinCore;
                    case MagneticMinesTavernBrawl: return SeaforiumBomber_BombToken;
                    case MailboxDancer: return TheCoinCore;
                    case Malorne: return Malorne;
                    case Mankrik: return Mankrik_OlgraMankriksWifeToken;
                    case Marrowslicer: return SchoolSpirits_SoulFragmentToken;
                    case MetalDetector_VAC_330: return TheCoinCore;
                    case MidaPureLight_ONY_028: return MidaPureLight_FragmentOfMidaToken;
                    case MilitiaHorn: return VeteransMilitiaHorn;
                    case MiracleSalesman_WW_331: return MiracleSalesman_SnakeOilToken_WW_331t;
                    case MisterMukla_ETC_836: return KingMukla_BananasLegacyToken;
                    case MonkeyBusiness_WORK_020: return KingMukla_BananasLegacyToken;
                    case RemixedDispenseOBot_MoneyDispenseOBotToken: return TheCoinCore;
                    case MuklaTyrantOfTheVale: return KingMukla_BananasLegacyToken;
                    case MuradinHighKing_TIME_209: return MuradinHighKing_HighKingsHammerToken_TIME_209t;
                    case MurgurMurgurgle: return MurgurMurgurgle_MurgurglePrimeToken;
                    case MurlocGrowfin_MIS_307: return MurlocGrowfin_MurlocGrowfinToken_MIS_307t1;
                    case MysteryEgg_TOY_351: return MysteryEgg_MysteryEggToken_TOY_351t;
                    case MysticalMirage_ULDA_035: return MysticalMirage_ULDA_035ts;
                    case NarainSoothfancy_VAC_420: return NarainSoothfancy_FortuneToken_VAC_420t;
                    case NostalgicClown_TOY_341: return NostalgicClown_NostalgicClownToken_TOY_341t;
                    case NostalgicGnome_TOY_312: return NostalgicGnome_NostalgicGnomeToken_TOY_312t;
                    case NostalgicInitiate_TOY_340: return NostalgicInitiate_NostalgicInitiateToken_TOY_340t1;
                    case OhManager_VAC_460: return TheCoinCore;
                    case OldMilitiaHorn_MilitiaHornTavernBrawl: return OldMilitiaHorn_VeteransMilitiaHornTavernBrawl;
                    case OldMilitiaHorn: return MilitiaHorn;
                    case OldMilitiaHornTavernBrawl: return OldMilitiaHorn_MilitiaHornTavernBrawl;
                    case OpenTheWaygate: return OpenTheWaygate_TimeWarpToken;
                    case Overgrowth: return WildGrowth_ExcessManaLegacyToken;
                    case Parrrley_DED_005: return Parrrley_DED_005;
                    case PhotographerFizzle: return PhotographerFizzle_FizzlesSnapshotToken;
                    case PiranhaPoacher: return PiranhaSwarmer;
                    case TwistPlagueOfMurlocs: return TwistPlagueOfMurlocs_SurpriseMurlocsToken;
                    case PopgarThePutrid_WW_091: return TramMechanic_BarrelOfSludgeToken_WW_044t;
                    case PortalKeeper: return PortalKeeper_FelhoundPortalToken;
                    case PortalOverfiend: return PortalKeeper_FelhoundPortalToken;
                    case PozzikAudioEngineer: return PozzikAudioEngineer_AudioBotToken;
                    case Pyros_PyrosToken_UNG_027t2: return Pyros_PyrosToken_UNG_027t4;
                    case Pyros: return Pyros_PyrosToken_UNG_027t2;
                    case Queldelar_ForgingQueldelarToken_LOOTA_842t: return QueldelarTavernBrawl;
                    case Queldelar_ForgingQueldelarToken_ONY_005tc7t: return Queldelar_ForgingQueldelarToken_ONY_005tc7t;
                    case RaidTheDocks_SecureTheSuppliesToken: return RaidTheDocks_CapnRokaraToken;
                    case RamCommander: return RamCommander_BattleRamToken;
                    case RangerGilly_VAC_413: return RangerGilly_IslandCrocoliskToken_VAC_413t;
                    case RapidFire_DAL_373: return RapidFire_DAL_373ts;
                    case RaptorHatchling: return RaptorHatchling_RaptorPatriarchToken;
                    case RatSensei_WON_013: return new[] { RatSensei_MonkTurtleToken_WON_013t, RatSensei_MonkTurtleToken_WON_013t2, RatSensei_MonkTurtleToken_WON_013t3, RatSensei_MonkTurtleToken_WON_013t4, }.OrderBy(n => Guid.NewGuid()).ToArray()[0];
                    case RatsOfExtraordinarySize: return RodentNest_RatToken;
                    case RayOfFrost_DAL_577: return RayOfFrost_DAL_577ts;
                    case RazorpetalLasher: return RazorpetalVolley_RazorpetalToken;
                    case RazorpetalVolley: return RazorpetalVolley_RazorpetalToken;
                    case ReanimateTheTerror_TLC_433: return ReanimateTheTerror_TyraxBoneTerrorToken_TLC_433t;
                    case RehgarEarthfury_CORE_CATA_004: return LightningBoltCore;
                    case ReliquaryOfSouls: return ReliquaryOfSouls_ReliquaryPrimeToken;
                    case ReachEquilibrium_CleanseTheShadowToken_TLC_817t: return ReachEquilibrium_SoletosLifesBreathToken_TLC_817t3;
                    case ReachEquilibrium_CorruptTheLightToken_TLC_817t2: return ReachEquilibrium_SoletosDeathsTouchToken_TLC_817t4;
                    case ReachEquilibrium_SoletosLifesBreathToken_TLC_817t3: return ReachEquilibrium_SoletosCyclesRebirthToken_TLC_817t5;
                    case ReachEquilibrium_SoletosDeathsTouchToken_TLC_817t4: return ReachEquilibrium_SoletosCyclesRebirthToken_TLC_817t5;
                    case RemoteControlledGolem_SW_097: return RemoteControlledGolem_GolemPartsToken;
                    case Rhonin: return ArcaneMissilesLegacy;
                    case RinTheFirstDisciple_TheFinalSealToken: return RinTheFirstDisciple_AzariTheDevourerToken;
                    case RinTheFirstDisciple_TheFirstSealToken: return RinTheFirstDisciple_TheSecondSealToken;
                    case RinTheFirstDisciple_TheFourthSealToken: return RinTheFirstDisciple_TheFinalSealToken;
                    case RinTheFirstDisciple_TheSecondSealToken: return RinTheFirstDisciple_TheThirdSealToken;
                    case RinTheFirstDisciple: return RinTheFirstDisciple_TheFirstSealToken;
                    case RiseToTheOccasion_AvengeTheFallenToken: return RiseToTheOccasion_LightbornCarielToken;
                    case RisingWinds: return Eagle_RisingWinds;
                    case RitualOfPower_CATA_561: return RitualOfPower_BreezlingToken_CATA_561t;
                    case Rockskipper_TLC_427: return KoboldMiner_RockToken_WW_001t;
                    case RuleModifier_ApproachingNightmareToken_TTN_002t14: return YoggSaronHopesEnd_OG_134;
                    case RuleModifier_ShiftingFateToken_TTN_002t50: return GearShift;
                    case RuleModifier_ShiftingFuturesToken_TTN_002t36: return ShifterZerus_OG_123;
                    case RunawayGyrocopter: return RunawayGyrocopter;
                    case SackOfCoins: return HeftySackOfCoins;
                    case SandArtElemental_TOY_513: return SandArtElemental_SandArtElementalToken_TOY_513t;
                    case SandboxScoundrel_TOY_521: return SandboxScoundrel_SandboxScoundrelToken_TOY_521t1;
                    case SandwaspQueen: return SandwaspQueen_SandwaspToken;
                    case SaxophoneSoloist: return SaxophoneSoloist;
                    case Schooling: return PiranhaSwarmer_PiranhaSwarmerToken_TSC_638t;
                    case SchoolSpirits_SCH_307: return SchoolSpirits_SoulFragmentToken;
                    case SchoolTeacher: return SchoolTeacher_NagalingToken;
                    case Scrapsmith: return Scrapsmith_ScrappyGruntToken;
                    case SeaforiumBomber: return SeaforiumBomber_BombToken;
                    case SecureTheDeck: return ClawLegacy;
                    case SeedsOfDestruction: return DreadlichTamsin_FelRiftToken;
                    case SeekGuidance_IlluminateTheVoidToken: return SeekGuidance_XyrellaTheSanctifiedToken;
                    case SeekGuidance_XyrellaTheSanctifiedToken: return XyrellaTheSanctified_PurifiedShard;
                    case SerpentWig_TSC_215: return SerpentWig_TSC_215;
                    case ShadowOfDeath_ULD_286: return ShadowOfDeath_ShadowToken;
                    case Shudderblock_TOY_501: return Shudderblock_ShudderblockToken_TOY_501t;
                    case SinfulSousChef: return SilverHandRecruitLegacyToken;
                    case SirakessCultist: return SirakessCultist_AbyssalCurseToken;
                    case SisterSvalna: return SisterSvalna_VisionOfDarknessToken;
                    case Sleetbreaker: return Windchill_AV_266;
                    case SleetSkater_TOY_375: return SleetSkater_SleetSkaterToken_TOY_375t;
                    case SludgeOnWheels_WW_043: return TramMechanic_BarrelOfSludgeToken_WW_044t;
                    case SmugSenior: return SmugSenior_SpectralSeniorToken;
                    case SnuggleTeddy_MIS_300: return SnuggleTeddy_SnuggleTeddyToken_MIS_300t;
                    case Sn1pSn4p: return Sn1pSn4p;
                    case SneakyDelinquent: return SneakyDelinquent_SpectralDelinquentToken;
                    case SoldierOfFortune: return TheCoinCore;
                    case SonOfHodir: return SonOfHodir_FrostTyrantToken;
                    case SorcerersGambit_ReachThePortalRoomToken: return SorcerersGambit_ArcanistDawngraspToken;
                    case SoulShear_SCH_701: return SchoolSpirits_SoulFragmentToken;
                    case SparkDrill_BOT_102: return SparkDrill_SparkToken;
                    case SparkEngine: return SparkDrill_SparkToken;
                    case SpawningPool_SC_000: return Zergling_SC_010;
                    case SpiritGatherer_EDR_871: return WispToken_EDR_851t;
                    case SpiritJailer_SCH_700: return SchoolSpirits_SoulFragmentToken;
                    case SpiritOfTheBadlands_WW_337: return SpiritOfTheBadlands_MirageToken_WW_337t;
                    case SpiritOfTheMountain_TLC_229: return SpiritOfTheMountain_AshalonRidgeGuardianToken_TLC_229t14;
                    case Springpaw_CORE_TRL_348: return Springpaw_LynxToken;
                    case Springpaw_TRL_348: return Springpaw_LynxToken;
                    case StaffOfAmmunae_ULDA_041: return StaffOfAmmunae_ULDA_041ts;
                    case Starseeker_ULDA_Elise_HP3: return MoonfireLegacy;
                    case Starshooter_WW_813: return ArcaneShotLegacy_DS1_185;
                    case SteamSurger: return FlameGeyser;
                    case StickybombSaboteur_CATA_186: return StickybombSaboteur_SabotageToken_CATA_186t;
                    case SunscaleRaptor: return SunscaleRaptor;
                    case SurlyMob_AngryMobTavernBrawl: return SurlyMob_CrazedMobTavernBrawl;
                    case SurlyMob: return AngryMob;
                    case SurlyMobTavernBrawl: return SurlyMob_AngryMobTavernBrawl;
                    case SwarmOfLightbugs_WW_052: return SwarmOfLightbugs_BottledLightbugsToken_WW_052t2;
                    case TabletopRoleplayer_TOY_915: return TabletopRoleplayer_TabletopRoleplayerToken_TOY_915t;
                    case TalanjiOfTheGraves_TIME_619: return TalanjiOfTheGraves_BwonsamdiToken_TIME_619t;
                    case Talgath_GDB_472: return BackstabCore;
                    case TentacleGrip_YOG_526: return ChaoticTendril_YOG_514;
                    case TentacleTender_YOG_517: return ChaoticTendril_YOG_514;
                    case TheCandle: return TheCandle;
                    case TheCandlesquestion_TheCandlesquestion_DALA_714a: return TheCandlesquestion_TheCandlesquestion_DALA_714b;
                    case TheCandlesquestion_TheCandlesquestion_DALA_714b: return TheCandlesquestion_TheCandlesquestion_DALA_714c;
                    case TheCandlesquestion: return TheCandlesquestion_TheCandlesquestion_DALA_714a;
                    case TheCavernsBelow: return TheCavernsBelow_CrystalCoreToken;
                    case TheCountess: return TheCountess_LegendaryInvitationToken;
                    case TheDarkness_LOOT_526: return TheDarkness_DarknessCandleToken;
                    case TheDemonSeed_CompleteTheRitualToken: return TheDemonSeed_BlightbornTamsinToken;
                    case TheForestsAid_DAL_256: return TheForestsAid_DAL_256ts;
                    case TheForbiddenSequence_TLC_460: return TheForbiddenSequence_TheOriginStoneToken_TLC_460t;
                    case TheHandOfRafaam: return CurseOfRafaam_CursedToken;
                    case TheLastKaleidosaur: return TheLastKaleidosaur_GalvadonToken;
                    case TheMarshQueen_QueenCarnassaToken: return TheMarshQueen_CarnassasBroodToken;
                    case TheMarshQueen: return TheMarshQueen_QueenCarnassaToken;
                    case TheRyecleaver_VAC_525: return TheRyecleaver_SliceOfBreadToken_VAC_525t1;
                    case ThrowGlaive: return ThrowGlaive; // TO CHECK
                    case Thunderquake_TIME_215: return StaticShock_TIME_218;
                    case TigressPlushy_TOY_811: return TigressPlushy_TigressPlushyToken_TOY_811t;
                    case TimeAdmralHooktail_TimelessChestToken_TIME_713t: return TheCoinCore;
                    case TimelooperToki_LoopingTimeEnchantment_TIME_861e1: return TimelooperToki_TIME_861;
                    case TimeSkipper_TIME_054: return TheCoinCore;
                    case TinyThimbleTavernBrawl: return TinyThimble_RegularSizeThimbleTavernBrawl;
                    case TombPillager_CORE_LOE_012: return TheCoinCore;
                    case TombPillager_LOE_012: return TheCoinCore;
                    case TombPillager_WON_340: return TheCoinCore;
                    case Torch_CATA_585: return Torch_CATA_585;
                    case ToyCaptainTarim_TOY_813: return ToyCaptainTarim_ToyCaptainTarimToken_TOY_813t;
                    case TradePrinceGallywix_GVG_028: return TradePrinceGallywix_GallywixsCoinToken;
                    case TramMechanic_WW_044: return TramMechanic_BarrelOfSludgeToken_WW_044t;
                    case TwinSlice_BT_175: return TwinSlice_SecondSliceToken;
                    case TwistTheCoffers_CacheOfCashToken: return TheCoinCore;
                    case UmbralSkulker: return TheCoinCore;
                    case UnearthedRaptor_MapToTheGoldenMonkeyToken: return UnearthedRaptor_GoldenMonkeyToken;
                    case UniteTheMurlocs: return UniteTheMurlocs_MegafinToken;
                    case UnleashTheBeast_DAL_378: return UnleashTheBeast_DAL_378ts;
                    case UnleashTheColossus_TLC_631: return UnleashTheColossus_GorishiColossusToken_TLC_631t;
                    case UrzulHorror: return UrzulHorror_LostSoulToken;
                    case VictoriousVrykul: return VictoriousVrykul_VictoriousValkyrToken;
                    case VioletSpellwing: return ArcaneMissilesLegacy;
                    case VioletSpellwing_CORE_DRG_107: return ArcaneMissilesLegacy;
                    case VolleyMaul_VAC_921: return Grillmaster_SunscreenToken_VAC_917t;
                    case Wanted: return Coin;
                    case Waxadred: return Waxadred_WaxadredsCandleToken;
                    case WeaselTunneler: return WeaselTunneler;
                    case WhelpWrangler_WW_827: return TakeToTheSkies_HappyWhelpToken_WW_816t;
                    case WhiteEyes: return WhiteEyes_TheStormGuardianToken;
                    case WildGrowthCore: return WildGrowth_ExcessManaLegacyToken;
                    case WildGrowthLegacy: return WildGrowth_ExcessManaLegacyToken;
                    case WildGrowthVanilla: return WildGrowth_ExcessManaLegacyToken;
                    case WitchwoodApple: return WitchwoodApple_TreantToken;
                    case WitchwoodAppleCore: return WitchwoodApple_TreantToken;
                    case WorkForTogwaggle_WorkForTogwaggleEnchantTavernBrawlEnchantment: return TheCoinCore;
                    case Wrenchcalibur: return SeaforiumBomber_BombToken;
                    case YoggSaronUnleashed_TentacleSwarmToken_YOG_516t3: return ChaoticTendril_YOG_514;
                    case YseraUnleashed: return YseraUnleashed_DreamPortalToken;
                    case Zaqul_TSC_959: return SirakessCultist_AbyssalCurseToken;
                    case ZixorApexPredator: return ZixorApexPredator_ZixorPrimeToken;
                    case FaldoreiStrider_CORE_LOOT_026: return FaldoreiStrider_SpiderAmbush;
                    case SeabreezeChalice_VAC_520: return SeabreezeChalice_SeabreezeChaliceToken_VAC_520t;
                    case SeabreezeChalice_SeabreezeChaliceToken_VAC_520t: return SeabreezeChalice_SeabreezeChaliceToken_VAC_520t2;
                    case DivineBrew_VAC_916: return DivineBrew_DivineBrewToken_VAC_916t2;
                    case DivineBrew_DivineBrewToken_VAC_916t2: return DivineBrew_DivineBrewToken_VAC_916t3;
                    case NightshadeTea_VAC_404: return NightshadeTea_NightshadeTeaToken_VAC_404t1;
                    case NightshadeTea_NightshadeTeaToken_VAC_404t1: return NightshadeTea_NightshadeTeaToken_VAC_404t2;
                    case MaltedMagma_VAC_323: return MaltedMagma_MaltedMagmaToken_VAC_323t;
                    case MaltedMagma_MaltedMagmaToken_VAC_323t: return MaltedMagma_MaltedMagmaToken_VAC_323t2;
                    case CupOMuscle_VAC_338: return CupOMuscle_CupOMuscleToken_VAC_338t;
                    case CupOMuscle_CupOMuscleToken_VAC_338t: return CupOMuscle_CupOMuscleToken_VAC_338t2;
                    case HealthDrink_VAC_951: return HealthDrink_HealthDrinkToken_VAC_951t;
                    case HealthDrink_HealthDrinkToken_VAC_951t: return HealthDrink_HealthDrinkToken_VAC_951t2;
                    case AdaptiveAmalgam_VAC_958: return AdaptiveAmalgam_VAC_958;
                    case Corpsicle_CorpsicleEnchantment_VAC_427e: return Corpsicle_VAC_427;
                    case EternalFirebolt_EternalFireboltEnchantment_END_025e: return EternalFirebolt_END_025;
                    case LineCook_VAC_337: return LineCook_VAC_337;

                    // Action targets
                    case BalefulBanker:
                    case CelestialProjectionist:
                    case DireFrenzy_CORE_GIL_828:
                    case DireFrenzy_GIL_828:
                    case DollmasterDorian:
                    case DragonBreeder:
                    case GangUp:
                    case HolyWater:
                    case LabRecruiter:
                    case ManicSoulcaster:
                    case MarkOfTheSpikeshell:
                    case PowerChordSynchronize:
                    case Recycle:
                    case Sathrovarr:
                    case Seance:
                    case Shadowcaster:
                    case Splintergraft:
                    case TogwagglesScheme:
                    case ZolaTheGorgon:
                    case ZolaTheGorgonCore:
                    case PuppetTheatre_MIS_919:
                    case CardIds.Convert:
                    case Convert_WON_342:
                        if (node.Parent.Type == typeof(Action))
                        {
                            var act = node.Parent.Object as Action;
                            var target = gameState.CurrentEntities.GetValueOrDefault(act.Target);
                            if (target != null)
                            {
                                return target.CardId;
                            }
                        }
                        return null;

                    case BobTheBartender_BG31_BOB:
                        if (subSpellInEffect?.Prefab == "ReuseFX_Generic_SpawnToHand_GoldCoins_Super")
                        {
                            return TheCoinCore;
                        }
                        else if (subSpellInEffect?.Parent?.Prefab == "ReuseFX_Sneaky_Missile_Smoke_Sap_Super_WithIdle")
                        {
                            var targetEntityId = subSpellInEffect.Parent.Targets[0];
                            var target = gameState.CurrentEntities.GetValueOrDefault(targetEntityId);
                            if (target != null)
                            {
                                return target.CardId;
                            }
                        }
                        return null;

                    // Multiple known cards
                    case XortothBreakerOfStars_GDB_118:
                        return AddMultipleKnownCards(gameState, node, new List<string>()
                            {
                                XortothBreakerOfStars_StarOfConclusionToken_GDB_118t2,
                                XortothBreakerOfStars_StarOfOriginationToken_GDB_118t,
                            });
                    case StellarBalance_EDR_874:
                        return AddMultipleKnownCards(gameState, node, new List<string>()
                            {
                                MoonfireLegacy,
                                StarfireLegacy,
                            });
                    //case YrelBeaconOfHope_GDB_141:
                    //    return AddMultipleKnownCards(gameState, node, new List<string>()
                    //        {
                    //            LibramOfHope,
                    //            LibramOfWisdom_BT_025,
                    //            LibramOfJustice_BT_011,
                    //        });
                    case TheReplicatorInator_MIS_025:
                        return AddMultipleKnownCards(gameState, node, new List<string>()
                            {
                                TheReplicatorInator_TheReplicatorInatorMiniToken_MIS_025t,
                                TheReplicatorInator_TheReplicatorInatorToken_MIS_025t1,
                            });
                    case YseraTheDreamerCore:
                    case YseraTheDreamer_LEG_CS3_033:
                        return AddMultipleKnownCards(gameState, node, new List<string>()
                            {
                                NightmareLegacy,
                                DreamLegacy,
                                LaughingSisterLegacy,
                                YseraAwakensLegacy,
                                EmeraldDrakeLegacy,
                            });
                    case PatchworkPals_TOY_353:
                        return AddMultipleKnownCards(gameState, node, new List<string>()
                            {
                                HufferLegacy,
                                MishaLegacy,
                                LeokkLegacy,
                            });
                    case RivendareWarrider:
                        return AddMultipleKnownCards(gameState, node, new List<string>()
                            {
                                    RivendareWarrider_BlaumeuxFamineriderToken,
                                    RivendareWarrider_KorthazzDeathriderToken,
                                    RivendareWarrider_ZeliekConquestriderToken
                            });
                    case FindTheImposter_SpymasterScabbsToken:
                        return AddMultipleKnownCards(gameState, node, new List<string>()
                            {
                                    FindTheImposter_SpyOMaticToken,
                                    FindTheImposter_FizzflashDistractorToken,
                                    FindTheImposter_HiddenGyrobladeToken,
                                    UndercoverMoleToken,
                                    FindTheImposter_NoggenFogGeneratorToken,
                            });
                    case MoonbeastTavernBrawlToken:
                    case KiriChosenOfElune:
                    case KiriChosenOfEluneCore:
                        return AddMultipleKnownCards(gameState, node, new List<string>()
                            {
                                    LunarEclipse,
                                    SolarEclipse,
                            });


                    case Triangulate_GDB_451:
                        return Triangulate.PredctCardId(gameState, creatorCardId, creatorEntityId, node, stateFacade);
                    case CardIds.RunicAdornment:
                        return Cards.RunicAdornment.PredctCardId(gameState, creatorCardId, creatorEntityId, node, stateFacade);
                    case CardIds.RazaTheResealed_TOY_383:
                        return Cards.RazaTheResealed.PredctCardId(gameState, creatorCardId, creatorEntityId, node, stateFacade);
                    case CardIds.Mimicry_EDR_522:
                        return Cards.Mimicry.PredctCardId(gameState, createdEntityId ?? -1, creatorEntityId, node, stateFacade);
                    case CardIds.DemonicProject:
                        return Cards.DemonicProject.PredctCardId(gameState, createdEntityId ?? -1, creatorEntityId, node, stateFacade);
                    case AugmentedElekk:
                        // The parent action is Augmented Elekk trigger, which is not the one we're interested in
                        // Its parent is the one that created the new entity
                        if (node.Parent.Parent.Type == typeof(Parser.ReplayData.GameActions.Action))
                        {
                            var act = node.Parent.Parent.Object as Parser.ReplayData.GameActions.Action;
                            // It should be the last ShowEntity of the action children
                            // Otherwise, the last FullEntity
                            for (int i = act.Data.Count - 1; i >= 0; i--)
                            {
                                if (act.Data[i].GetType() == typeof(ShowEntity))
                                {
                                    var showEntity = act.Data[i] as ShowEntity;
                                    return showEntity.CardId;
                                }
                                if (act.Data[i].GetType() == typeof(FullEntity))
                                {
                                    var fullEntity = act.Data[i] as FullEntity;
                                    return fullEntity.CardId;
                                }
                            }
                            // And if nothing matches, then we don't predict anything
                            return null;
                        }
                        return null;

                    case ExpiredMerchant:
                        if (node.Parent.Type == typeof(Action))
                        {
                            var act = node.Parent.Object as Action;
                            var actionEntity = gameState.CurrentEntities.GetValueOrDefault(act.Entity);
                            return actionEntity?.CardIdsToCreate?.FirstOrDefault();
                        }
                        return null;

                    case FightOverMe:
                        if (node.Parent.Type == typeof(Parser.ReplayData.GameActions.Action))
                        {
                            var act = node.Parent.Object as Parser.ReplayData.GameActions.Action;
                            var actionEntity = gameState.CurrentEntities.GetValueOrDefault(act.Entity);
                            if (actionEntity != null)
                            {
                                if (actionEntity.KnownEntityIds.Count == 0)
                                {
                                    // This is a hack, because the DEATHS block is processed after the entities are added to
                                    // hand
                                    var fightingEntities = act.Data
                                        .Where(d => d is TagChange)
                                        .Select(d => d as TagChange)
                                        // Not sure what this is
                                        .Where(d => d.Name == 1715)
                                        // This works because the check is done asynchronously, so the DEATHS block should have been processed at this point
                                        // Actually, it doesn't work, as the deaths are processed too long after
                                        //.Where(d => GameState.CurrentEntities.GetValueOrDefault(d.Entity)?.InGraveyard() ?? false)
                                        .Select(d => d.Entity)
                                        .Select(d => gameState.CurrentEntities.GetValueOrDefault(d, default(FullEntity)))
                                        .Where(d => d != null)
                                        .Where(d => d.IsInGraveyard())
                                        .ToList();
                                    actionEntity.KnownEntityIds = fightingEntities
                                        .Select(d => d.Entity)
                                        .ToList();
                                }
                                if (actionEntity?.KnownEntityIds?.Count > 0)
                                {
                                    var nextEntity = actionEntity.KnownEntityIds[0];
                                    actionEntity.KnownEntityIds.RemoveAt(0);
                                    return gameState.CurrentEntities.GetValueOrDefault(nextEntity)?.CardId;
                                }
                            }
                        }
                        return null;

                    case X21Repairbot:
                        if (node.Parent.Type == typeof(Parser.ReplayData.GameActions.Action))
                        {
                            var act = node.Parent.Object as Parser.ReplayData.GameActions.Action;
                            if (creatorEntity != null)
                            {
                                if (creatorEntity.KnownEntityIds.Count == 0)
                                {
                                    creatorEntity.KnownEntityIds = act.Data
                                        .Where(d => d is ShowEntity)
                                        .Select(d => d as ShowEntity)
                                        .Where(d => d.GetTag(GameTag.CREATOR) == creatorEntityId)
                                        .Select(d => d.Entity)
                                        .ToList();
                                }
                                if (creatorEntity.KnownEntityIds.Count > 0)
                                {
                                    var nextEntityId = creatorEntity.KnownEntityIds[0];
                                    creatorEntity.KnownEntityIds.RemoveAt(0);
                                    return gameState.CurrentEntities.GetValueOrDefault(nextEntityId)?.CardId;
                                }
                            }
                        }
                        return null;

                    case SpiritOfTheDead:
                        if (node.Parent.Type == typeof(Parser.ReplayData.GameActions.Action))
                        {
                            var act = node.Parent.Object as Parser.ReplayData.GameActions.Action;
                            foreach (var data in act.Data)
                            {
                                if (data.GetType() == typeof(MetaData))
                                {
                                    var info = (data as MetaData).MetaInfo[0];
                                    var targetId = info.Entity;
                                    if (gameState.CurrentEntities.ContainsKey(targetId))
                                    {
                                        return gameState.CurrentEntities[targetId].CardId;
                                    }
                                }
                            }
                        }
                        return null;

                    case ManaBind:
                    case AzeriteVein_WW_422:
                    case FrozenClone_CORE_ICC_082:
                    case FrozenClone_ICC_082:
                        if (node.Parent.Type == typeof(Action) && node.Parent.Parent?.Type == typeof(Action))
                        {
                            var act = node.Parent.Parent.Object as Action;
                            var existingEntity = gameState.CurrentEntities.GetValueOrDefault(act.Entity);
                            return existingEntity?.CardId;
                        }
                        return null;

                    case Duplicate:
                    case CheatDeathCore:
                    case CheatDeath:
                        if (node.Parent.Type == typeof(Parser.ReplayData.GameActions.Action))
                        {
                            var act = node.Parent.Object as Parser.ReplayData.GameActions.Action;
                            if (act.Type == (int)BlockType.TRIGGER)
                            {
                                var metaData = act.Data
                                    .Where(data => data is MetaData)
                                    .Select(data => data as MetaData)
                                    .Where(data => data.Meta == (int)MetaDataType.HISTORY_TARGET)
                                    .Where(data => data.MetaInfo != null)
                                    .Where(data => data.MetaInfo.Count > 0)
                                    .FirstOrDefault();
                                if (metaData != null)
                                {
                                    var entityId = metaData.MetaInfo[0].Entity;
                                    var existingEntity = gameState.CurrentEntities.GetValueOrDefault(entityId);
                                    return existingEntity?.CardId;
                                }
                            }
                        }
                        return null;

                    case PotionOfIllusion:
                        if (node.Parent.Type == typeof(Parser.ReplayData.GameActions.Action))
                        {
                            var act = node.Parent.Object as Parser.ReplayData.GameActions.Action;
                            var existingEntity = gameState.CurrentEntities.GetValueOrDefault(act.Entity);
                            if (existingEntity == null)
                            {
                                return null;
                            }

                            var controllerId = existingEntity.GetController();

                            if (gameState.EntityIdsOnBoardWhenPlayingPotionOfIllusion != null)
                            {
                                var boardLeftToHandleForPlayer = gameState.EntityIdsOnBoardWhenPlayingPotionOfIllusion[controllerId];
                                if (boardLeftToHandleForPlayer.Count > 0)
                                {
                                    var entityToCopy = boardLeftToHandleForPlayer[0];
                                    gameState.EntityIdsOnBoardWhenPlayingPotionOfIllusion[controllerId].RemoveAt(0);
                                    return entityToCopy.CardId;
                                }
                            }
                        }
                        return null;


                    case SuspiciousAlchemist_AMysteryEnchantment:
                        var enchantmentEntity = gameState.CurrentEntities.GetValueOrDefault(creatorEntityId);
                        if (enchantmentEntity == null)
                        {
                            return null;
                        }

                        var attachedToEntityId = enchantmentEntity.GetTag(GameTag.ATTACHED);
                        var sourceEntity = gameState.CurrentEntities.GetValueOrDefault(attachedToEntityId);
                        if (sourceEntity?.KnownEntityIds?.Count > 0)
                        {
                            var nextEntity = sourceEntity.KnownEntityIds[0];
                            sourceEntity.KnownEntityIds.RemoveAt(0);
                            return gameState.CurrentEntities.GetValueOrDefault(nextEntity)?.CardId;
                        }
                        return null;

                    case CactusConstruct_WW_818:
                        if (node.Parent.Type == typeof(Action))
                        {
                            var act = node.Parent.Object as Action;
                            // Look at the GameState logs for the info since the minion has already been summoned there
                            var gsData = stateFacade?.GsState?.CurrentGame?.FilterGameData(typeof(Action))?.Select(d => d as Action)?.ToList();
                            if (gsData?.Count > 0)
                            {
                                gsData.Reverse();
                                var cactusAction = gsData.First();
                                var entities = cactusAction.Data
                                    .Where(d => d is ShowEntity)
                                    .Select(d => d as ShowEntity)
                                    .Where(d => d.GetZone() == (int)Zone.PLAY && d.GetCardType() != (int)CardType.ENCHANTMENT)
                                    .ToList();
                                return entities.LastOrDefault()?.CardId;
                            }
                        }
                        return null;
                }

                // Handle echo
                // This doesn't work for echo cards that create other cards (eg Abduction Ray)
                //if (creatorEntity?.GetTag(GameTag.ECHO) == 1 || creatorEntity?.GetTag(GameTag.NON_KEYWORD_ECHO) == 1)
                //{
                //    return creatorCardId;
                //}
            }

            if (node.Parent != null && node.Parent.Type == typeof(Action))
            {
                var action = node.Parent.Object as Action;

                if (action.Type == (int)BlockType.TRIGGER)
                {
                    var actionEntity = gameState.CurrentEntities.ContainsKey(action.Entity)
                            ? gameState.CurrentEntities[action.Entity]
                            : null;

                    if (actionEntity.CardId == SonyaWaterdancer_TOY_515)
                    {
                        if (node.Parent.Parent?.Type == typeof(Action))
                        {
                            var initialAction = node.Parent.Parent.Object as Action;
                            return gameState.CurrentEntities.GetValueOrDefault(initialAction.Entity)?.CardId;
                        }
                    }
                    if (actionEntity?.CardId == SonyaShadowdancer)
                    {
                        var entityId = action.Data
                            .Where(d => d is MetaData)
                            .Select(d => d as MetaData)
                            .SelectMany(d => d.MetaInfo)
                            .Select(i => i.Id)
                            .FirstOrDefault();
                        var entity = gameState.CurrentEntities.GetValueOrDefault(entityId);
                        return entity?.CardId;
                    }
                    else if (actionEntity?.CardId == PrimalSabretooth_TLC_247)
                    {
                        var entityId = actionEntity.GetTag(GameTag.CARD_TARGET);
                        var entity = gameState.CurrentEntities.GetValueOrDefault(entityId);
                        return entity?.CardId;
                    }
                    else if (actionEntity?.CardId == RatSensei_WON_013)
                    {
                        return new[] {
                            RatSensei_MonkTurtleToken_WON_013t,
                            RatSensei_MonkTurtleToken_WON_013t2,
                            RatSensei_MonkTurtleToken_WON_013t3,
                            RatSensei_MonkTurtleToken_WON_013t4,
                        }.OrderBy(n => Guid.NewGuid()).ToArray()[0];
                    }
                    else if (actionEntity?.CardId == Kidnap_KidnappersSackToken)
                    {
                        var sackEntityId = actionEntity.Entity;
                        // Card created by this Kidnap and that's a minion and that's not the sack?
                        var attachedEnchantment = gameState.CurrentEntities.Values
                            .Where(e => e.GetTag(GameTag.ATTACHED) == sackEntityId)
                            .FirstOrDefault();
                        var entityIdInSack = attachedEnchantment?.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_1);
                        var entityInSack = gameState.CurrentEntities.GetValueOrDefault(entityIdInSack ?? -1);
                        return entityInSack?.CardId;

                    }
                    else if (actionEntity?.CardId == TwistReality_ChaoticShuffleCopyEnchantment_TTN_002t21e)
                    {
                        var entity = node.Type == typeof(FullEntity) ? node.Object as FullEntity : null;
                        if (entity != null)
                        {
                            var copiedEntityId = entity.SubSpellInEffect.Source;
                            var copiedEntity = gameState.CurrentEntities.GetValueOrDefault(copiedEntityId);
                            return copiedEntity?.CardId;
                        }
                    }
                    else if (actionEntity?.CardId == ElixirOfVigor_ElixirOfVigorPlayerTavernBrawlEnchantment
                        || actionEntity?.CardId == ElixirOfVigor_ElixirOfVigorPlayerEnchantment)
                    {
                        var entity = node.Type == typeof(FullEntity) ? node.Object as FullEntity : null;
                        if (entity != null)
                        {
                            // Go up until we find a PLAY action
                            var playActionNode = node;
                            while (playActionNode != null)
                            {
                                playActionNode = playActionNode.Parent;
                                if (playActionNode.Type != typeof(Action))
                                {
                                    continue;
                                }
                                Action playAction = playActionNode.Object as Action;
                                if (playAction.Type != (int)BlockType.PLAY)
                                {
                                    continue;
                                }
                                var playedEntityId = playAction.Entity;
                                var playedEntity = gameState.CurrentEntities.GetValueOrDefault(playedEntityId);
                                return playedEntity?.CardId;
                            }
                        }
                    }
                    else if (actionEntity?.CardId == Helya_PlightOfTheDeadEnchantment && createdEntityId != null && createdEntityId.HasValue)
                    {
                        var actions = gameState.ParserState.CurrentGame.FilterGameData(typeof(Action))
                            .Select(d => d as Action)
                            .Where(d => d.Type == (int)BlockType.TRIGGER)
                            // Chained draws use the same action entity id
                            //.Where(d => d.Entity != actionEntity.Entity)
                            .ToList();
                        // Most recent action is first
                        actions.Reverse();
                        var debugActions = actions.ToList();
                        //var plagueActions = BuildLastPlagueActions(actions, gameState);
                        // This will give us all the Plague Actions ever. However, we will only take the first N items based
                        // on the Plight of the Dead action indices
                        var allPlagueActions = actions.Where(a => IsPlagueAction(a, gameState)).ToList();
                        // It's important to NOT reverse it again at the end, as otherwise we can't use the index for the standard Plague actions
                        // At this point, we have ALL the plague creation actions, in reverse order.
                        // We only have the Plight of the Dead actions for the last N plagues that have been created
                        // So in fact we need to isolate the Plague actions that are linked to the chain of plagues currently in progress
                        // so we can start using indices from 0
                        // We can use the "internalParent" entity to know this. All chained plague actions are nested
                        // So then we HAVE TO reverse :)
                        var baseInternalParent = GetTopInternalParentEntityId(allPlagueActions[0]);
                        var plagueActions = allPlagueActions.Where(a => !a.Processed && GetTopInternalParentEntityId(a) == baseInternalParent).Reverse().ToList();
                        //var debugPlagueActions = allPlagueActions.Where(a => GetTopInternalParentEntityId(a) == baseInternalParent).Reverse().ToList();
                        //var plightOfTheDeadActions = actions.TakeWhile(a => IsPlightOfTheDeadAction(a, gameState)).Reverse().ToList();
                        //var currentPlightOfTheDeadAction = plightOfTheDeadActions.Find(a => ContainsFullEntityCreation(a, createdEntityId.Value));
                        //var currentPlagueIndex = plightOfTheDeadActions.IndexOf(currentPlightOfTheDeadAction);
                        var plagueAction = plagueActions[0];
                        plagueAction.Processed = true;
                        var plagueActionEntity = gameState.CurrentEntities.GetValueOrDefault(plagueAction?.Entity ?? -1);
                        var result = plagueActionEntity?.CardId;
                        return result;
                    }
                    // FateSplitter was implemented in POWER, but at least now (2025-01-06), it is in TRIGGER
                    else if (actionEntity.CardId == VanessaVancleef_CORE_CS3_005
                        || actionEntity.CardId == VanessaVancleefLegacy
                        || actionEntity.CardId == FateSplitter)
                    {
                        var vanessaControllerId = gameState.CurrentEntities.GetValueOrDefault(actionEntity.Entity)?.GetController();
                        var playerIds = gameState.CardsPlayedByPlayerEntityIdByTurn.Keys;
                        foreach (var playerId in playerIds)
                        {
                            if (playerId != vanessaControllerId)
                            {
                                var cardsPlayedByOpponentByTurn = gameState.CardsPlayedByPlayerEntityIdByTurn[playerId];
                                if (cardsPlayedByOpponentByTurn == null || cardsPlayedByOpponentByTurn.Count == 0)
                                {
                                    return null;
                                }
                                var cardsPlayedByOpponent = cardsPlayedByOpponentByTurn.SelectMany(entry => entry.Value).ToList();
                                if (cardsPlayedByOpponent == null || cardsPlayedByOpponent.Count == 0)
                                {
                                    return null;
                                }
                                var lastCardPlayedByOpponentEntityId = cardsPlayedByOpponent.Last();
                                var lastCardPlayedByOpponent = gameState.CurrentEntities.GetValueOrDefault(lastCardPlayedByOpponentEntityId);
                                return lastCardPlayedByOpponent?.CardId;
                            }
                        }
                    }

                    // Tamsin Roana
                    if (actionEntity != null && actionEntity.CardId == TamsinRoame_BAR_918)
                    {
                        // Now get the parent PLAY action
                        if (node.Parent.Parent != null && node.Parent.Parent.Type == typeof(Parser.ReplayData.GameActions.Action))
                        {
                            var playAction = node.Parent.Parent.Object as Parser.ReplayData.GameActions.Action;
                            if (playAction.Type == (int)BlockType.PLAY)
                            {
                                // Normally at this stage the game state entity has already been updated
                                var playedEntity = gameState.CurrentEntities.ContainsKey(playAction.Entity)
                                    ? gameState.CurrentEntities[playAction.Entity]
                                    : null;
                                return playedEntity?.CardId;
                            }
                        }
                    }

                    // Keymaster Alabaster
                    if (actionEntity != null && gameState.LastCardDrawnEntityId > 0 && actionEntity.CardId == KeymasterAlabaster)
                    {
                        var lastDrawnEntity = gameState.CurrentEntities.ContainsKey(gameState.LastCardDrawnEntityId)
                            ? gameState.CurrentEntities[gameState.LastCardDrawnEntityId]
                            : null;
                        return lastDrawnEntity?.CardId;
                    }

                    // Plagiarize
                    if (action.TriggerKeyword == (int)GameTag.SECRET && actionEntity != null && actionEntity.KnownEntityIds.Count > 0
                        && (actionEntity.CardId == PlagiarizeCore || actionEntity.CardId == Plagiarize))
                    {
                        var plagiarizeController = actionEntity.GetEffectiveController();
                        var entitiesPlayedByActivePlayer = actionEntity.KnownEntityIds
                            .Select(entityId => gameState.CurrentEntities.GetValueOrDefault(entityId))
                            .Where(card => card != null && card.GetEffectiveController() != -1 && card.GetEffectiveController() != plagiarizeController)
                            .ToList();
                        if (entitiesPlayedByActivePlayer.Count == 0)
                        {
                            return null;
                        }
                        var nextCardToCreatePlagia = entitiesPlayedByActivePlayer[0].CardId;
                        actionEntity.KnownEntityIds.Remove(entitiesPlayedByActivePlayer[0].Entity);
                        return nextCardToCreatePlagia;
                    }

                    // Diligent Notetaker
                    if (action.TriggerKeyword == (int)GameTag.SPELLBURST && actionEntity != null && gameState.LastCardPlayedEntityId > 0 && actionEntity.CardId == DiligentNotetaker)
                    {
                        var lastPlayedEntity = gameState.CurrentEntities.ContainsKey(gameState.LastCardPlayedEntityId)
                            ? gameState.CurrentEntities[gameState.LastCardPlayedEntityId]
                            : null;
                        return lastPlayedEntity?.CardId;
                    }

                    // Felsoul Jailer
                    if ((actionEntity.CardId == FelsoulJailer || actionEntity.CardId == FelsoulJailerLegacy) && actionEntity.CardIdsToCreate.Count > 0)
                    {
                        var result = actionEntity.CardIdsToCreate[0];
                        actionEntity.CardIdsToCreate.RemoveAt(0);
                        return result;
                    }

                    // Nellie
                    if (actionEntity != null && actionEntity.CardId == NellieTheGreatThresher_NelliesPirateShipToken && action.TriggerKeyword == (int)GameTag.DEATHRATTLE)
                    {
                        var pirateShipEntity = gameState.CurrentEntities.GetValueOrDefault(creatorEntityId);
                        var nellieEntity = gameState.CurrentEntities.GetValueOrDefault(pirateShipEntity?.GetTag(GameTag.CREATOR) ?? -1);
                        if (pirateShipEntity?.KnownEntityIds.Count == 0)
                        {
                            var crewmates = gameState.CurrentEntities.Values
                                .Where(entity => entity.GetTag(GameTag.CREATOR) == nellieEntity?.Entity)
                                .Where(entity => entity.CardId != NellieTheGreatThresher_NelliesPirateShipToken)
                                .ToList();
                            var crewmatesEntityIds = crewmates.Select(entity => entity.Entity).ToList();
                            pirateShipEntity.KnownEntityIds = crewmatesEntityIds;
                        }
                        if (pirateShipEntity?.KnownEntityIds.Count > 0)
                        {
                            var entities = pirateShipEntity.KnownEntityIds.Select(entityId => gameState.CurrentEntities.GetValueOrDefault(entityId)).ToList();
                            var nextCard = entities[0]?.CardId;
                            pirateShipEntity.KnownEntityIds.RemoveAt(0);
                            return nextCard;
                        }
                        return null;
                    }

                    // Ice Trap
                    if (actionEntity != null
                        && (actionEntity.CardId == IceTrap
                            || actionEntity.CardId == IceTrap_CORE_AV_226
                            || actionEntity.CardId == BeaststalkerTavish_ImprovedIceTrapToken)
                        && action.TriggerKeyword == (int)GameTag.SECRET)
                    {
                        var candidateEntityIds = action.Data
                            .Where(d => d is MetaData)
                            .Select(d => d as MetaData)
                            .Where(m => m.Meta == (int)MetaDataType.TARGET)
                            .SelectMany(m => m.MetaInfo)
                            .Select(info => info.Entity)
                            .ToList();
                        if (candidateEntityIds.Count != 1)
                        {
                            Logger.Log("WARN: could not determine with full accuracy Ice Trap's target", candidateEntityIds.Count);
                        }
                        if (candidateEntityIds.Count == 0)
                        {
                            return null;
                        }
                        return gameState.CurrentEntities.ContainsKey(candidateEntityIds[0])
                            ? gameState.CurrentEntities[candidateEntityIds[0]]?.CardId
                            : null;
                    }

                    // Getaway Kodo
                    if (actionEntity != null && actionEntity.CardId == GetawayKodo && action.TriggerKeyword == (int)GameTag.SECRET)
                    {
                        var candidateEntityIds = action.Data
                            .Where(d => d is MetaData)
                            .Select(d => d as MetaData)
                            .Where(m => m.Meta == (int)MetaDataType.HISTORY_TARGET)
                            .SelectMany(m => m.MetaInfo)
                            .Select(info => info.Entity)
                            .ToList();
                        if (candidateEntityIds.Count != 1)
                        {
                            Logger.Log("WARN: could not determine with full accuracy Getaway Kodo's target", candidateEntityIds.Count);
                        }
                        if (candidateEntityIds.Count == 0)
                        {
                            return null;
                        }
                        return gameState.CurrentEntities.ContainsKey(candidateEntityIds[0])
                            ? gameState.CurrentEntities[candidateEntityIds[0]]?.CardId
                            : null;
                    }

                    // Flesh Behemoth
                    if (actionEntity != null
                        && (actionEntity.CardId == IceTrap || actionEntity.CardId == FleshBehemoth_RLK_830)
                        && action.TriggerKeyword == (int)GameTag.DEATHRATTLE)
                    {
                        var candidateEntityIds = stateFacade.GsState.GameState.CurrentEntities.Values
                            .Where(d => d is FullEntity)
                            .Select(d => d as FullEntity)
                            .Where(e => e.GetTag(GameTag.CREATOR) == actionEntity.Entity)
                            .Where(e => e.IsInPlay())
                            .Where(e => e.IsMinionLike())
                            .Select(e => e.Entity)
                            .ToList();
                        if (candidateEntityIds.Count != 1)
                        {
                            Logger.Log("WARN: could not determine with full accuracy Flesh Behemoth's target", candidateEntityIds.Count);
                        }
                        if (candidateEntityIds.Count == 0)
                        {
                            return null;
                        }
                        return stateFacade.GsState.GameState.CurrentEntities.ContainsKey(candidateEntityIds[0])
                            ? stateFacade.GsState.GameState.CurrentEntities[candidateEntityIds[0]]?.CardId
                            : null;
                    }
                }

                if (action.Type == (int)BlockType.POWER)
                {
                    var actionEntity = gameState.CurrentEntities.GetValueOrDefault(action.Entity);
                    if (actionEntity == null)
                    {
                        return null;
                    }

                    if (actionEntity.CardId == TheExodar_GDB_120)
                    {
                        var tagChangeEntities = action.Data
                            .Where(d => d is TagChange)
                            .Select(d => d as TagChange)
                            .Where(t => t.Name == (int)GameTag.PARENT_CARD && t.Value == 0)
                            .Select(t => gameState.CurrentEntities.GetValueOrDefault(t.Entity))
                            .Where(e => e.IsStarshipPiece())
                            .Select(e => e.CardId)
                            .ToList();
                        if (tagChangeEntities.Count == 0)
                        {
                            return null;
                        }
                        if (actionEntity.CardIdsToCreate.Count == 0)
                        {
                            actionEntity.CardIdsToCreate = tagChangeEntities;
                        }
                        if (actionEntity.CardIdsToCreate.Count > 0)
                        {
                            var cardId = actionEntity.CardIdsToCreate[0];
                            actionEntity.CardIdsToCreate.RemoveAt(0);
                            return cardId;
                        }

                    }

                    if (actionEntity.CardId == SymphonyOfSins)
                    {
                        // The original card is updated right before this one is updated. Not really robust, 
                        // but there are no clear links between the new card and the one being replaced
                        var previousChange = action.Data
                            .Where(d => d is TagChange)
                            .Select(d => d as TagChange)
                            .Where(t => t.Name == (int)GameTag.ZONE && t.Value == (int)Zone.SETASIDE)
                            .LastOrDefault();
                        return gameState.CurrentEntities.GetValueOrDefault(previousChange?.Entity ?? -1)?.CardId;
                    }

                    if (actionEntity.CardId == ShatteredReflections_DEEP_025)
                    {
                        var candidate = action.Data
                            .Where(d => d is FullEntity)
                            .Select(d => d as FullEntity)
                            .Where(e => e.CardId != null)
                            .FirstOrDefault();
                        return candidate?.CardId;
                    }

                    if (actionEntity.CardId == Griftah)
                    {
                        var candidates = action.Data
                            .Where(d => d is FullEntity)
                            .Select(d => d as FullEntity)
                            .Select(d => d.Entity)
                            .Select(d => gameState.CurrentEntities.GetValueOrDefault(d))
                            // Don't know what this tag means, but it's set for cards picked when playing Griftah
                            .Where(e => e != null && e.Tags.FirstOrDefault(t => t.Name == 2509)?.Value != 1)
                            .ToList();
                        var candidateCardIds = candidates.Select(e => e.CardId);
                        foreach (var cardId in candidateCardIds)
                        {
                            var totalCardIds = candidateCardIds.Where(c => c == cardId).Count();
                            // The card received by the opponent has not been revealed
                            if (totalCardIds == 1)
                            {
                                return cardId;
                            }
                        }
                        return null;
                    }

                    if (actionEntity.CardId == PowerOfCreation)
                    {
                        // At this point, the summoned cards have not yet been revealed, so we look for the GS logs for insight
                        if (stateFacade != null)
                        {
                            return stateFacade.GsState.GameState.CurrentEntities.Values
                                .Where(d => d.GetTag(GameTag.CREATOR) == actionEntity.Entity)
                                .Where(d => d.IsInPlay())
                                .FirstOrDefault()
                                ?.CardId;
                        }
                        return null;
                    }

                    if (actionEntity.CardId == DevouringSwarm)
                    {
                        if (actionEntity.CardIdsToCreate.Count == 0)
                        {
                            var controller = actionEntity.GetController();
                            var deathBlock = action.Data
                                .Where(data => data is Action)
                                .Select(data => data as Action)
                                .Where(a => a.Type == (int)BlockType.DEATHS)
                                .FirstOrDefault();
                            if (deathBlock != null)
                            {
                                var deadEntities = deathBlock.Data
                                    .Where(data => data is TagChange)
                                    .Select(data => data as TagChange)
                                    .Where(tag => tag.Name == (int)GameTag.ZONE && tag.Value == (int)Zone.GRAVEYARD)
                                    .Select(tag => gameState.CurrentEntities.GetValueOrDefault(tag.Entity))
                                    .Where(entity => entity?.GetController() == controller);
                                actionEntity.CardIdsToCreate = deadEntities.Select(entity => entity.CardId).ToList();
                            }
                        }
                        if (actionEntity.CardIdsToCreate.Count > 0)
                        {
                            var cardId = actionEntity.CardIdsToCreate[0];
                            actionEntity.CardIdsToCreate.RemoveAt(0);
                            return cardId;
                        }
                    }
                    // Second card for Archivist Elysiana
                    else if (actionEntity.CardId == ArchivistElysiana)
                    {
                        // Now let's find the ID of the card that was created right before
                        var lastTagChange = action.Data
                            .Where(data => data is TagChange)
                            .Select(data => data as TagChange)
                            .Where(tag => tag.Name == (int)GameTag.ZONE && tag.Value == (int)Zone.DECK)
                            .LastOrDefault();
                        if (lastTagChange != null)
                        {
                            var lastEntityId = lastTagChange.Entity;
                            return gameState.CurrentEntities.GetValueOrDefault(lastEntityId)?.CardId;
                        }
                    }
                    // Second card for Kazakusan
                    else if (actionEntity.CardId == Kazakusan_ONY_005)
                    {
                        // Now let's find the ID of the card that was created right before
                        var lastTagChange = action.Data
                            .Where(data => data is TagChange)
                            .Select(data => data as TagChange)
                            .Where(tag => tag.Name == (int)GameTag.ZONE && tag.Value == (int)Zone.DECK)
                            .LastOrDefault();
                        if (lastTagChange != null)
                        {
                            var lastEntityId = lastTagChange.Entity;
                            return gameState.CurrentEntities.GetValueOrDefault(lastEntityId)?.CardId;
                        }
                    }
                    // Southsea Scoundrel
                    else if (actionEntity.CardId == SouthseaScoundrel_BAR_081)
                    {
                        // If we are the ones who draw it, it's all good, and if it's teh opponent, 
                        // then we know it's the same one
                        var cardDrawn = action.Data
                            .Where(data => data is TagChange)
                            .Select(data => data as TagChange)
                            .Where(tag => tag.Name == (int)GameTag.ZONE && tag.Value == (int)Zone.HAND)
                            .Where(tag => gameState.CurrentEntities.ContainsKey(tag.Entity) && gameState.CurrentEntities[tag.Entity].CardId?.Count() > 0)
                            .FirstOrDefault();
                        return cardDrawn != null ? gameState.CurrentEntities.GetValueOrDefault(cardDrawn.Entity)?.CardId : null;
                    }
                    // Vanessa VanCleed
                    else if (actionEntity.CardId == VanessaVancleef_CORE_CS3_005
                        || actionEntity.CardId == VanessaVancleefLegacy
                        || actionEntity.CardId == FateSplitter)
                    {
                        var vanessaControllerId = gameState.CurrentEntities.GetValueOrDefault(actionEntity.Entity)?.GetController();
                        var playerIds = gameState.CardsPlayedByPlayerEntityIdByTurn.Keys;
                        foreach (var playerId in playerIds)
                        {
                            if (playerId != vanessaControllerId)
                            {
                                var cardsPlayedByOpponentByTurn = gameState.CardsPlayedByPlayerEntityIdByTurn[playerId];
                                if (cardsPlayedByOpponentByTurn == null || cardsPlayedByOpponentByTurn.Count == 0)
                                {
                                    return null;
                                }
                                var cardsPlayedByOpponent = cardsPlayedByOpponentByTurn.SelectMany(entry => entry.Value).ToList();
                                if (cardsPlayedByOpponent == null || cardsPlayedByOpponent.Count == 0)
                                {
                                    return null;
                                }
                                var lastCardPlayedByOpponentEntityId = cardsPlayedByOpponent.Last();
                                var lastCardPlayedByOpponent = gameState.CurrentEntities.GetValueOrDefault(lastCardPlayedByOpponentEntityId);
                                return lastCardPlayedByOpponent?.CardId;
                            }
                        }
                    }
                    // Ace in the Hole
                    else if (actionEntity.CardId == AceInTheHoleTavernBrawlToken)
                    {
                        var actionControllerId = actionEntity.GetController();
                        if (actionEntity.KnownEntityIds.Count == 0)
                        {
                            var cardsPlayedByPlayerByTurn = gameState.CardsPlayedByPlayerEntityIdByTurn[actionControllerId];
                            if (cardsPlayedByPlayerByTurn == null || cardsPlayedByPlayerByTurn.Count == 0)
                            {
                                return null;
                            }

                            var lastTurn = gameState.GetGameEntity().GetTag(GameTag.TURN) - 2;
                            if (!cardsPlayedByPlayerByTurn.ContainsKey(lastTurn))
                            {
                                return null;
                            }

                            var cardsPlayedLastTurn = cardsPlayedByPlayerByTurn[lastTurn];
                            if (cardsPlayedLastTurn.Count == 0)
                            {
                                return null;
                            }

                            actionEntity.KnownEntityIds = cardsPlayedLastTurn.Select(entityId => entityId).ToList();
                        }

                        if (actionEntity.KnownEntityIds.Count > 0)
                        {
                            var entities = actionEntity.KnownEntityIds.Select(entityId => gameState.CurrentEntities.GetValueOrDefault(entityId)).ToList();
                            var nextCard = entities[0]?.CardId;
                            actionEntity.KnownEntityIds.Remove(entities[0].Entity);
                            return nextCard;
                        }
                    }
                    else if (actionEntity.CardId == PhotographerFizzle_FizzlesSnapshotToken)
                    {
                        if (actionEntity?.KnownEntityIds?.Count > 0)
                        {
                            var nextEntity = actionEntity.KnownEntityIds[0];
                            actionEntity.KnownEntityIds.RemoveAt(0);
                            return gameState.CurrentEntities.GetValueOrDefault(nextEntity)?.CardId;
                        }
                        return null;
                    }
                    // Sivara
                    else if (actionEntity.CardId == CommanderSivara_TSC_087)
                    {
                        if (actionEntity.PlayedWhileInHand.Count > 0)
                        {
                            var spells = actionEntity.PlayedWhileInHand
                                .Select(entityId => gameState.CurrentEntities.GetValueOrDefault(entityId))
                                .Where(entity => entity.IsSpell())
                                .ToList();
                            var firstSpellEntity = spells[0];
                            actionEntity.PlayedWhileInHand.Remove(firstSpellEntity.Entity);
                            return firstSpellEntity.CardId;
                        }
                    }
                    // TODO: move this to the more simple "action target" case?
                    else if (actionEntity.CardId == ColdStorage)
                    {
                        var targetEntityId = action.Data
                            .Where(data => data is MetaData)
                            .Select(data => data as MetaData)
                            .Where(meta => meta.Meta == (int)MetaDataType.TARGET)
                            .SelectMany(meta => meta.MetaInfo)
                            .Where(info => info != null)
                            .FirstOrDefault()
                            ?.Entity;
                        return targetEntityId != null ? gameState.CurrentEntities.GetValueOrDefault(targetEntityId.Value)?.CardId : null;
                    }
                    // Horde Operative
                    //else if (actionEntity.CardId == HordeOperative)
                    //{
                    //    var actionControllerId = actionEntity.GetController();
                    //    if (actionEntity.KnownEntityIds.Count == 0)
                    //    {
                    //        // Find all secrets currently in play
                    //        var allOpponentSecrets = gameState.CurrentEntities.Values
                    //            .Where(e => e.GetController() != actionControllerId)
                    //            .Where(e => e.GetZone() == (int)Zone.SECRET)
                    //            .Where(e => e.GetTag(GameTag.SECRET) == 1)
                    //            .OrderBy(e => e.GetTag(GameTag.ZONE_POSITION))
                    //            .ToList();
                    //        actionEntity.KnownEntityIds = allOpponentSecrets
                    //            .Select(e => e.Entity)
                    //            .ToList();
                    //    }

                    //    if (actionEntity.KnownEntityIds.Count > 0)
                    //    {
                    //        var currentSecretCardIds = gameState.CurrentEntities.Values
                    //            .Where(e => e.GetController() == actionControllerId)
                    //            .Where(e => e.GetZone() == (int)Zone.SECRET)
                    //            .Where(e => e.GetTag(GameTag.SECRET) == 1)
                    //            .OrderBy(e => e.GetTag(GameTag.ZONE_POSITION))
                    //            .Select(e => e.CardId)
                    //            .ToList();
                    //        var entities = actionEntity.KnownEntityIds
                    //            .Select(entityId => gameState.CurrentEntities.GetValueOrDefault(entityId))
                    //            .Where(e => e != null &&  !currentSecretCardIds.Contains(e.CardId))
                    //            .ToList();
                    //        var nextCard = entities[0].CardId;
                    //        actionEntity.KnownEntityIds.Remove(entities[0].Entity);
                    //        return nextCard;
                    //    }
                    //}
                    // Conqueror's Banner
                    else if (actionEntity.CardId == ConquerorsBanner && node.Type == typeof(TagChange))
                    {
                        var tagChange = node.Object as TagChange;
                        // We need to use this trick because the creator is computed once the full block is completed
                        // (see comment in CardDrawFromDeckParser)
                        var nodeElement = action.Data
                            .Where(d => d is TagChange)
                            .Select(d => d as TagChange)
                            .Where(t => t.Entity == tagChange.Entity && t.Name == tagChange.Name && t.Value == tagChange.Value)
                            .FirstOrDefault();
                        var nodeIndex = action.Data.IndexOf(nodeElement);
                        var joustAction = action.Data
                            .GetRange(0, nodeIndex)
                            .Where(d => d is Action)
                            .Select(d => d as Action)
                            .Where(a => a.Index < node.Index)
                            .Where(a => a.Type == (int)BlockType.JOUST)
                            .LastOrDefault();
                        var lastJoust = joustAction?.Data
                            .Where(d => d is MetaData)
                            .Select(d => d as MetaData)
                            .Where(d => d.Meta == (int)MetaDataType.JOUST)
                            .LastOrDefault();
                        if (lastJoust != null && gameState.CurrentEntities.ContainsKey(lastJoust.Data))
                        {
                            var pickedEntity = gameState.CurrentEntities.GetValueOrDefault(lastJoust.Data);
                            return pickedEntity?.CardId;
                        }
                    }
                    // Doesn't really work for now because of timing issues (only works in test when there are no pauses)
                    else if (actionEntity.CardId == CardIds.DeathBlossomWhomper
                        || actionEntity.CardId == CardIds.GemstoneHoarder_CATA_897)
                    {
                        var enchantment = gameState.CurrentEntities.Values
                            .Where(e => e.GetCardType() == (int)CardType.ENCHANTMENT)
                            .Where(e => e.GetTag(GameTag.ATTACHED) == actionEntity.Entity)
                            .Where(e => e.GetTag(GameTag.CREATOR) == actionEntity.Entity)
                            .LastOrDefault();
                        var referencedEntityId = enchantment?.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_1) ?? -1;
                        var linkedEntity = gameState.CurrentEntities.GetValueOrDefault(referencedEntityId);
                        if (linkedEntity != null)
                        {
                            return linkedEntity.CardId;
                        }
                    }

                    // Lady Liadrin
                    // The spells are created in random order, so we can't flag them
                }
            }

            // Libram of Wisdom
            if (node.Type == typeof(FullEntity) && (node.Object as FullEntity).SubSpellInEffect?.Prefab == "Librams_SpawnToHand_Book")
            {
                return LibramOfWisdom_BT_025;
            }

            return null;
        }

        public static string PredictSecret(
            GameState gameState,
            string creatorCardId,
            int creatorEntityId,
            Node node,
            string inputCardId = null,
            StateFacade stateFacade = null,
            int? createdEntityId = null)
        {
            if (inputCardId != null && inputCardId.Length > 0)
            {
                return inputCardId;
            }

            if (node.Parent != null && node.Parent.Type == typeof(Action))
            {
                var action = node.Parent.Object as Action;
                if (action.Type == (int)BlockType.POWER)
                {
                    var actionEntity = gameState.CurrentEntities.GetValueOrDefault(action.Entity);
                    if (actionEntity == null)
                    {
                        return null;
                    }

                    if (actionEntity.CardId == FacelessEnigma_TIME_860)
                    {
                        var actionControllerId = actionEntity.GetController();
                        if (actionEntity.KnownEntityIds.Count == 0)
                        {
                            // Find all secrets currently in play
                            var allSecrets = action.Data
                                .Where(e => e is FullEntity)
                                .Select(e => e as FullEntity)
                                .Where(e => e.GetController() == actionControllerId)
                                .Where(e => e.GetTag(GameTag.SECRET) == 1)
                                .ToList();
                            actionEntity.KnownEntityIds = allSecrets
                                .Select(e => e.Entity)
                                .ToList();
                        }

                        if (actionEntity.KnownEntityIds.Count > 0)
                        {
                            var currentSecretCardIds = gameState.CurrentEntities.Values
                                .Where(e => e.GetController() == actionControllerId)
                                .Where(e => e.GetZone() == (int)Zone.SECRET)
                                .Where(e => e.GetTag(GameTag.SECRET) == 1)
                                .OrderBy(e => e.GetTag(GameTag.ZONE_POSITION))
                                .Select(e => e.CardId)
                                .ToList();
                            var entities = actionEntity.KnownEntityIds
                                .Select(entityId => gameState.CurrentEntities.GetValueOrDefault(entityId))
                                .Where(e => e != null && !currentSecretCardIds.Contains(e.CardId))
                                .ToList();
                            // Happens when opponent plays it - we don't know their secret
                            if (entities.Count == 0)
                            {
                                return null;
                            }
                            var nextCard = entities[0].CardId;
                            actionEntity.KnownEntityIds.Remove(entities[0].Entity);
                            return nextCard;
                        }
                    }

                    if (actionEntity.CardId == HordeOperative)
                    {
                        var actionControllerId = actionEntity.GetController();
                        if (actionEntity.KnownEntityIds.Count == 0)
                        {
                            // Find all secrets currently in play
                            var allOpponentSecrets = gameState.CurrentEntities.Values
                                .Where(e => e.GetController() != actionControllerId)
                                .Where(e => e.GetZone() == (int)Zone.SECRET)
                                .Where(e => e.GetTag(GameTag.SECRET) == 1)
                                .OrderBy(e => e.GetTag(GameTag.ZONE_POSITION))
                                .ToList();
                            actionEntity.KnownEntityIds = allOpponentSecrets
                                .Select(e => e.Entity)
                                .ToList();
                        }

                        if (actionEntity.KnownEntityIds.Count > 0)
                        {
                            var currentSecretCardIds = gameState.CurrentEntities.Values
                                .Where(e => e.GetController() == actionControllerId)
                                .Where(e => e.GetZone() == (int)Zone.SECRET)
                                .Where(e => e.GetTag(GameTag.SECRET) == 1)
                                .OrderBy(e => e.GetTag(GameTag.ZONE_POSITION))
                                .Select(e => e.CardId)
                                .ToList();
                            var entities = actionEntity.KnownEntityIds
                                .Select(entityId => gameState.CurrentEntities.GetValueOrDefault(entityId))
                                .Where(e => e != null && !currentSecretCardIds.Contains(e.CardId))
                                .ToList();
                            var nextCard = entities[0].CardId;
                            actionEntity.KnownEntityIds.Remove(entities[0].Entity);
                            return nextCard;
                        }
                    }
                }
            }

            return null;
        }

        private static int GetTopInternalParentEntityId(Action action)
        {
            int baseEntity = action.Entity;
            Action parentAction = null;
            GameData current = action;
            while (current.InternalParent != null)
            {
                current = current.InternalParent;
                if (current.GetType() != typeof(Action))
                {
                    continue;
                }
                var currentAction = current as Action;
                if (currentAction.InternalParent != null && currentAction.Entity > 0)
                {
                    baseEntity = currentAction.Entity;
                }
            }
            return baseEntity;
        }

        private static string AddMultipleKnownCards(GameState gameState, Node node, List<string> cardsList)
        {
            if (node.Parent.Type == typeof(Parser.ReplayData.GameActions.Action))
            {
                var act = node.Parent.Object as Parser.ReplayData.GameActions.Action;
                var existingEntity = gameState.CurrentEntities.GetValueOrDefault(act.Entity);
                if (existingEntity == null)
                {
                    return null;
                }

                var cardsLeft = existingEntity.CardIdsToCreate;
                if (cardsLeft.Count == 0)
                {
                    cardsLeft = cardsList;
                    existingEntity.CardIdsToCreate = cardsLeft;
                }
                var cardId = cardsLeft[0];
                cardsLeft.RemoveAt(0);
                return cardId;
            }
            return null;
        }

        public static string GetBuffCardId(int creatorEntityId, string creatorCardId)
        {
            switch (creatorCardId)
            {
                case TamsinRoame_BAR_918: return TamsinRoame_GatheredShadowsEnchantment;
                default: return null;
            }

        }

        public static string GetBuffingCardCardId(int creatorEntityId, string creatorCardId)
        {
            switch (creatorCardId)
            {
                case TamsinRoame_BAR_918: return creatorCardId;
                default: return null;
            }
        }

        private static bool IsPlagueAction(Action action, GameState gameState)
        {
            int entityId = action.Entity;
            var entity = gameState.CurrentEntities.GetValueOrDefault(entityId);
            var cardId = entity?.CardId;
            return PLAGUES.Contains(cardId);
        }

        private static bool IsPlightOfTheDeadAction(Action action, GameState gameState)
        {
            int entityId = action.Entity;
            var entity = gameState.CurrentEntities.GetValueOrDefault(entityId);
            var cardId = entity?.CardId;
            return cardId == CardIds.Helya_PlightOfTheDeadEnchantment;
        }

        private static List<Action> BuildLastPlagueActions(List<Action> actions, GameState gameState)
        {
            // At this stage, the latest actions are Plight of the Dead actions
            var beforeEnchantments = actions.SkipWhile(a => IsPlightOfTheDeadAction(a, gameState));
            // Now we will find out plague actions.
            // However: they might be mixed in with other TOPDECK actions (we draw a topdeck card after
            // drawing a first plague), or they might be other TRIGGER actions that happen when one 
            // of the plagues is revealed
            // These actions should all be nested - so we stop when the parent is the root of the game
            var plagueActions = new List<Action>();
            foreach (var action in beforeEnchantments)
            {
                if (action.InternalParent == null)
                {
                    break;
                }
                if (IsPlagueAction(action, gameState))
                {
                    plagueActions.Add(action);
                }
            }
            //beforeEnchantments.TakeWhile(rootAction => IsPlagueAction(rootAction, gameState))
            //var plagueActions = 
            //    .SkipWhile(a => a.TriggerKeyword != (int)GameTag.TOPDECK)
            //    // keep all "TOPDECK" actions, even if they are not plagues, as they can be intertwined between plagues
            //    .TakeWhile(a => a.TriggerKeyword == (int)GameTag.TOPDECK)
            //    .Where(a => IsPlagueAction(a, gameState))
            //    .Reverse()
            //    .ToList();
            return plagueActions;
        }

        private static bool ContainsFullEntityCreation(Action action, int entityId)
        {
            return action.Data
                .Where(d => d is FullEntity)
                .Select(d => d as FullEntity)
                .Select(f => f.Entity)
                .Contains(entityId);
        }
    }
}
