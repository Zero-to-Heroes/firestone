using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;
using System.Linq;
using HearthstoneReplays.Parser.ReplayData.Meta;
using Newtonsoft.Json;
using Action = HearthstoneReplays.Parser.ReplayData.GameActions.Action;

namespace HearthstoneReplays.Events.Parsers
{
    public class CardBuffedInHandParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        // When adding an entity to this list, also add the corresponding buff in the map below
        private List<string> validBuffers = new List<string>()
        {
            CardIds.AegwynnTheGuardianCore,
            CardIds.AkaliTheRhino,
            CardIds.AutoArmamentsTavernBrawlToken,
            CardIds.AzeriteVein_WW_422,
            CardIds.BlackjackStunner,
            CardIds.BogSlosher,
            CardIds.BrassKnuckles,
            CardIds.CallToAdventure,
            CardIds.CattleRustler_WW_351,
            CardIds.CelestialProjectionist,
            CardIds.CheatDeath,
            CardIds.CheatDeathCore,
            CardIds.ChorusRiff,
            CardIds.ClutchmotherZavas,
            CardIds.Insight_InsightToken,
            CardIds.CorsairCache,
            CardIds.DemonBloodTavernBrawl,
            CardIds.DemonizerTavernBrawlToken,
            CardIds.DinoTrackingTavernBrawl,
            CardIds.DonHancho,
            CardIds.DoorOfShadows,
            CardIds.DoorOfShadows_DoorOfShadowsToken,
            CardIds.DragonqueenAlexstrasza,
            CardIds.DunBaldarBunker,
            CardIds.EfficientOctoBot,
            CardIds.EmperorThaurissan_BRM_028,
            CardIds.EmperorThaurissan_WON_133,
            CardIds.FarSightCore,
            CardIds.FarSightLegacy,
            CardIds.FarSightVanilla,
            CardIds.FarWatchPost,
            CardIds.FateWeaver,
            CardIds.FinalShowdown_GainMomentumToken,
            CardIds.FinalShowdown,
            CardIds.FreezingTrapCore,
            CardIds.FreezingTrapLegacy,
            CardIds.FreezingTrapVanilla,
            CardIds.GalakrondTheUnbreakable_GalakrondAzerothsEndToken,
            CardIds.GalakrondTheUnbreakable_GalakrondTheApocalypseToken,
            CardIds.GalakrondTheUnbreakable,
            CardIds.GrimestreetEnforcer,
            CardIds.GrimestreetEnforcer_WON_046,
            CardIds.GrimestreetOutfitter,
            CardIds.GrimestreetOutfitterCore,
            CardIds.GrimestreetPawnbroker,
            CardIds.GrimestreetSmuggler,
            CardIds.GrimscaleChum,
            CardIds.GrimyGadgeteer,
            CardIds.GrimyGadgeteer_WON_108,
            CardIds.GrumbleWorldshaker,
            CardIds.HarnessTheElementsTavernBrawl,
            CardIds.HiddenCache,
            CardIds.HuntersInsight,
            CardIds.HuntersInsightTavernBrawl,
            CardIds.IKnowAGuy_WON_350,
            CardIds.IKnowAGuy,
            CardIds.KoboldMiner_FoolsAzeriteToken_WW_001t3,
            CardIds.KoboldMiner_AzeriteChunkToken_WW_001t9,
            CardIds.KoboldMiner_AzeriteGemToken_WW_001t14,
            CardIds.KoboldMiner_TheAzeriteHawkToken_WW_001t24,
            CardIds.KoboldMiner_TheAzeriteScorpionToken_WW_001t23,
            CardIds.TheCountess_LegendaryInvitationToken,
            CardIds.LegendaryLootTavernBrawl,
            CardIds.LegendaryLoot_LegendaryLootTavernBrawlEnchantment,
            CardIds.ManaBind,
            CardIds.NightmareDragonkin_EDR_890,
            CardIds.OrbOfRevelation_OrbOfRevelationTavernBrawlEnchantment_PVPDR_BAR_Passive08e1,
            CardIds.OrbOfRevelationTavernBrawl,
            CardIds.PredatoryInstincts,
            CardIds.Rheastrasza_PurifiedDragonNestToken_WW_824t,
            CardIds.RingOfPhaseshifting_RingOfPhaseshiftingTavernBrawlEnchantment,
            CardIds.RingOfPhaseshiftingTavernBrawl,
            CardIds.RuniTimeExplorer_RuinsOfKoruneToken_WON_053t6,
            CardIds.SaloonBrewmaster_WW_423,
            CardIds.ScavengersIngenuity,
            CardIds.ScourgeIllusionist,
            CardIds.SesselieOfTheFaeCourt_REV_319,
            CardIds.Shadowcaster,
            CardIds.Shadowfiend,
            CardIds.ShadowstepCore,
            CardIds.ShadowstepLegacy,
            CardIds.ShadowstepVanilla,
            CardIds.ShakyZipgunner,
            CardIds.SkullOfGuldan_BT_601,
            CardIds.SkullOfGuldanTavernBrawl,
            CardIds.SmugglersCrate,
            CardIds.SmugglersRun,
            CardIds.SonyaShadowdancer,
            CardIds.SpyglassTavernBrawl,
            CardIds.StarseekersToolsTavernBrawl,
            CardIds.StealerOfSouls,
            CardIds.StolenGoods,
            CardIds.SummerFlowerchild,
            CardIds.SupremeArchaeology_TomeOfOrigination,
            CardIds.TakeToTheSkies_WW_816,
            CardIds.TearReality,
            CardIds.TheDarkPortal_BT_302,
            CardIds.TroggBeastrager,
            CardIds.UnstablePortal_GVG_003,
            CardIds.Valanyr,
            CardIds.VelarokWindblade_VelarokTheDeceiverToken_WW_364t,
            CardIds.WagglePick,
            CardIds.WaywardSage,
            CardIds.WilfredFizzlebang,
        };

        private List<string> validHoldWhenDrawnBuffers = new List<string>()
        {
            CardIds.SkullOfGuldan_BT_601,
            CardIds.SkullOfGuldanTavernBrawl,
        };

        private List<string> validSubSpellBuffers = new List<string>()
        {
            CardIds.AegwynnTheGuardianCore,
            CardIds.EfficientOctoBot,
        };

        private List<string> validTriggerBuffers = new List<string>()
        {
            CardIds.FarWatchPost,
            CardIds.DemonslayerKurtrus_LudicrousSpeedEnchantment,
            CardIds.Si7Skulker_SpyStuffEnchantment,
        };

        private Dictionary<string, List<string>> buffs = new Dictionary<string, List<string>>()
        {
            { CardIds.AegwynnTheGuardianCore, new List<string> { CardIds.AegwynnTheGuardian_GuardiansLegacyCoreEnchantment } },
            { CardIds.AkaliTheRhino, new List<string> { CardIds.AkaliTheRhino}},
            { CardIds.AncientMysteries, new List<string> { CardIds.AncientMysteries_TranslatedEnchantment}},
            { CardIds.AutoArmamentsTavernBrawlToken, new List<string> { CardIds.AutoArmaments_AutoArmedTavernBrawlEnchantment}},
            { CardIds.AzeriteVein_WW_422, new List<string> { CardIds.AzeriteGem_AzeriteGlowEnchantment_WW_001t14e}},
            { CardIds.BeaststalkerTavish_ImprovedFreezingTrapToken, new List<string> { CardIds.ImprovedFreezingTrap_FreezingEnchantment}},
            { CardIds.BlackjackStunner, new List<string> { CardIds.BlackjackStunner_StunnedEnchantment}},
            { CardIds.BogSlosher, new List<string> { CardIds.BogSlosher_SloshedEnchantment}},
            { CardIds.BrassKnuckles, new List<string> { CardIds.BrassKnuckles_SmugglingEnchantment}},
            { CardIds.CallToAdventure, new List<string> { CardIds.CallToAdventure_HeroicEnchantment }},
            { CardIds.CattleRustler_WW_351, new List<string> { CardIds.CattleRustler_RustledEnchantment_WW_351e }},
            { CardIds.CelestialProjectionist, new List<string> { CardIds.CelestialProjectionist_AstralProjectionEnchantment }},
            { CardIds.CheatDeath, new List<string> { CardIds.CheatDeath_CloseCallEnchantment}},
            { CardIds.CheatDeathCore, new List<string> { CardIds.CheatDeath_CloseCallEnchantment}},
            { CardIds.ChorusRiff, new List<string> { CardIds.ChorusRiff_ChorusEnchantment }},
            { CardIds.ClutchmotherZavas, new List<string> { CardIds.ClutchmotherZavas_RemembranceEnchantment}},
            { CardIds.CorsairCache, new List<string> { CardIds.CorsairCache_VoidSharpenedEnchantment}},
            { CardIds.DemonBloodTavernBrawl, new List<string> { CardIds.DemonBlood_DemonBloodTavernBrawlEnchantment}},
            { CardIds.DemonizerTavernBrawlToken, new List<string> { CardIds.Demonizer_DemonizedTavernBrawlEnchantment}},
            { CardIds.DinoTrackingTavernBrawl, new List<string> { CardIds.DinoTracking_DinoTrackingTavernBrawlEnchantment}},
            { CardIds.DonHancho, new List<string> { CardIds.DonHancho_SmugglingEnchantment }},
            { CardIds.DoorOfShadows, new List<string> { CardIds.DoorOfShadows_ShadowstalkingEnchantment }},
            { CardIds.DoorOfShadows_DoorOfShadowsToken, new List<string> { CardIds.DoorOfShadows_ShadowstalkingEnchantment }},
            { CardIds.DragonqueenAlexstrasza, new List<string> { CardIds.DragonqueenAlexstrasza_AQueensDiscountEnchantment }},
            { CardIds.DunBaldarBunker, new List<string> { CardIds.DunBaldarBunker_CloakedSecretsEnchantment}},
            { CardIds.EfficientOctoBot, new List<string> { CardIds.EfficientOctoBot_TrainingEnchantment}},
            { CardIds.EmperorThaurissan_BRM_028, new List<string> { CardIds.EmperorThaurissan_ImperialFavorEnchantment }},
            { CardIds.EmperorThaurissan_WON_133, new List<string> { CardIds.EmperorThaurissan_ImperialFavorEnchantment_WON_133e }},
            { CardIds.FarSightCore, new List<string> { CardIds.FarSight_FarSightLegacyEnchantment }},
            { CardIds.FarSightLegacy, new List<string> { CardIds.FarSight_FarSightLegacyEnchantment }},
            { CardIds.FarSightVanilla, new List<string> { CardIds.FarSight_FarSightLegacyEnchantment }},
            { CardIds.FarWatchPost, new List<string> { CardIds.FarWatchPost_SpottedEnchantment }},
            { CardIds.FateWeaver, new List<string> { CardIds.FateWeaver_DraconicFateEnchantment}},
            { CardIds.FinalShowdown_GainMomentumToken, new List<string> { CardIds.FasterMovesEnchantment }},
            { CardIds.FinalShowdown, new List<string> { CardIds.FasterMovesEnchantment }},
            { CardIds.FreezingTrapCore, new List<string> { CardIds.FreezingTrap_TrappedLegacyEnchantment}},
            { CardIds.FreezingTrapLegacy, new List<string> { CardIds.FreezingTrap_TrappedLegacyEnchantment}},
            { CardIds.FreezingTrapVanilla, new List<string> { CardIds.FreezingTrap_TrappedLegacyEnchantment}},
            { CardIds.GalakrondTheUnbreakable_GalakrondAzerothsEndToken, new List<string> { CardIds.GalakrondTheUnbreakable_GalakrondsStrengthEnchantment_DRG_650e3}},
            { CardIds.GalakrondTheUnbreakable_GalakrondTheApocalypseToken, new List<string> { CardIds.GalakrondTheUnbreakable_GalakrondsStrengthEnchantment_DRG_650e2}},
            { CardIds.GalakrondTheUnbreakable, new List<string> { CardIds.GalakrondTheUnbreakable_GalakrondsStrengthEnchantment_DRG_650e}},
            { CardIds.GrimestreetEnforcer, new List<string> { CardIds.GrimestreetEnforcer_SmugglingEnchantment}},
            { CardIds.GrimestreetEnforcer_WON_046, new List<string> { CardIds.GrimestreetEnforcer_SmugglingEnchantment_WON_046e}},
            { CardIds.GrimestreetOutfitter, new List<string> { CardIds.GrimestreetOutfitter_SmugglingEnchantment}},
            { CardIds.GrimestreetOutfitterCore, new List<string> { CardIds.GrimestreetOutfitter_SmugglingEnchantment}},
            { CardIds.GrimestreetPawnbroker, new List<string> { CardIds.GrimestreetPawnbroker_SmugglingEnchantment}},
            { CardIds.GrimestreetSmuggler, new List<string> { CardIds.GrimestreetSmuggler_SmugglingEnchantment}},
            { CardIds.GrimscaleChum, new List<string> { CardIds.GrimscaleChum_SmugglingEnchantment}},
            { CardIds.GrimyGadgeteer, new List<string> { CardIds.GrimyGadgeteer_SmugglingEnchantment}},
            { CardIds.GrimyGadgeteer_WON_108, new List<string> { CardIds.GrimyGadgeteer_SmugglingEnchantment_WON_108e}},
            { CardIds.GrumbleWorldshaker, new List<string> { CardIds.GrumbleWorldshaker_GrumblyTumblyEnchantment}},
            { CardIds.HarnessTheElements, new List<string> { CardIds.HarnessTheElements_HarnessTheElementsTavernBrawlEnchantment}},
            { CardIds.HiddenCache, new List<string> { CardIds.HiddenCache_SmugglingEnchantment}},
            { CardIds.HuntersInsight, new List<string> { CardIds.HuntersInsight_InsightfulEnchantment}},
            { CardIds.HuntersInsightTavernBrawl, new List<string> { CardIds.HuntersInsight_InsightfulTavernBrawlEnchantment}},
            { CardIds.IKnowAGuy_WON_350, new List<string> { CardIds.IKnowAGuy_KnowsAnotherGuyEnchantment_CFM_940e }},
            { CardIds.IKnowAGuy, new List<string> { CardIds.IKnowAGuy_KnowsAnotherGuyEnchantment_CFM_940e }},
            { CardIds.Insight_InsightToken, new List<string> { CardIds.Insight_InsightfulEnchantment }},
            { CardIds.KoboldMiner_FoolsAzeriteToken_WW_001t3, new List<string> { CardIds.AzeriteGem_AzeriteGlowEnchantment_WW_001t14e }},
            { CardIds.KoboldMiner_AzeriteChunkToken_WW_001t9, new List<string> { CardIds.AzeriteGem_AzeriteGlowEnchantment_WW_001t14e }},
            { CardIds.KoboldMiner_AzeriteGemToken_WW_001t14, new List<string> { CardIds.AzeriteGem_AzeriteGlowEnchantment_WW_001t14e }},
            { CardIds.KoboldMiner_TheAzeriteHawkToken_WW_001t24, new List<string> { CardIds.TidestoneOfGolganneth_ReducedEnchantment }},
            { CardIds.KoboldMiner_TheAzeriteScorpionToken_WW_001t23, new List<string> { CardIds.TheAzeriteScorpion_ScorpionsStingEnchantment_WW_001t23e }},
            { CardIds.TheCountess_LegendaryInvitationToken, new List<string> { CardIds.TheCountess_GuestOfHonorEnchantment }},
            { CardIds.LegendaryLootTavernBrawl, new List<string> { CardIds.LegendaryLoot_LootedTavernBrawlEnchantment }},
            { CardIds.LegendaryLoot_LegendaryLootTavernBrawlEnchantment, new List<string> { CardIds.LegendaryLoot_LootedTavernBrawlEnchantment }},
            { CardIds.MesaduneTheFractured_WW_429, new List<string> { CardIds.AzeriteVein_FracturedEnchantment_WW_422e, CardIds.AzeriteVein_FracturedEnchantment_WW_422e2 } },
            { CardIds.NightmareDragonkin_EDR_890, new List<string> { CardIds.Cost2LegacyEnchantment_GBL_002e } },
            { CardIds.OrbOfRevelationTavernBrawl, new List<string> { CardIds.OrbOfRevelation_OrbOfRevelationTavernBrawlEnchantment_PVPDR_BAR_Passive08e1}},
            { CardIds.OrbOfRevelation_OrbOfRevelationTavernBrawlEnchantment_PVPDR_BAR_Passive08e1, new List<string> { CardIds.OrbOfRevelation_OrbOfRevelationTavernBrawlEnchantment_PVPDR_BAR_Passive08e2}},
            { CardIds.PredatoryInstincts, new List<string> { CardIds.PredatoryInstincts_PredatoryInstinctsEnchantment }},
            { CardIds.RelicOfDimensions, new List<string> { CardIds.RelicOfDimensions_DimensionalEnchantment }},
            { CardIds.Rheastrasza_PurifiedDragonNestToken_WW_824t, new List<string> { CardIds.Rheastrasza_HappilyHatchedEnchantment_WW_824e}},
            { CardIds.RingOfPhaseshifting_RingOfPhaseshiftingTavernBrawlEnchantment, new List<string> { CardIds.RingOfPhaseshifting_PhaseshiftedTavernBrawlEnchantment}},
            { CardIds.RuniTimeExplorer_RuinsOfKoruneToken_WON_053t6, new List<string> { CardIds.RuinsOfKorune_KorunesBlessingEnchantment_WON_053t6e}},
            { CardIds.SaloonBrewmaster_WW_423, new List<string> { CardIds.SaloonBrewmaster_OrderUpEnchantment_WW_423e}},
            { CardIds.ScavengersIngenuity, new List<string> { CardIds.ScavengersIngenuity_PackTacticsEnchantment}},
            { CardIds.ScourgeIllusionist, new List<string> { CardIds.ScourgeIllusionist_IllusionEnchantment}},
            { CardIds.SesselieOfTheFaeCourt_REV_319, new List<string> { CardIds.SesselieOfTheFaeCourt_SesseliesBlessingEnchantment}},
            { CardIds.Shadowcaster, new List<string> { CardIds.Shadowcaster_FlickeringDarknessEnchantment}},
            { CardIds.Shadowcasting101_Shadowcasting101TavernBrawlEnchantment_PVPDR_AV_Passive04e1, new List<string> { CardIds.Shadowcasting101_Shadowcasting101TavernBrawlEnchantment_PVPDR_AV_Passive04e2}},
            { CardIds.Shadowfiend_WON_061, new List<string> { CardIds.Shadowfiend_ShadowfiendedEnchantment_WON_061e}},
            { CardIds.Shadowfiend, new List<string> { CardIds.Shadowfiend_ShadowfiendedEnchantment}},
            { CardIds.ShadowstepCore, new List<string> { CardIds.CheatDeath_CloseCallEnchantment}},
            { CardIds.ShadowstepLegacy, new List<string> { CardIds.CheatDeath_CloseCallEnchantment}},
            { CardIds.ShadowstepVanilla, new List<string> { CardIds.CheatDeath_CloseCallEnchantment}},
            { CardIds.ShakyZipgunner, new List<string> { CardIds.ShakyZipgunner_SmugglingEnchantment}},
            { CardIds.SkullOfGuldan_BT_601, new List<string> { CardIds.SkullOfGuldan_EmbracePowerEnchantment }},
            { CardIds.SkullOfGuldanTavernBrawl, new List<string> { CardIds.SkullOfGuldan_EmbracePowerEnchantment }},
            { CardIds.SmugglersCrate, new List<string> { CardIds.SmugglersCrate_SmugglingEnchantment}},
            { CardIds.SmugglersRun, new List<string> { CardIds.SmugglersRun_SmugglingEnchantment}},
            { CardIds.SonyaShadowdancer, new List<string> { CardIds.SonyaShadowdancer_SonyasShadowEnchantment}},
            { CardIds.StarseekersToolsTavernBrawl, new List<string> { CardIds.StarseekersTools_PlannedEnchantment}},
            { CardIds.StealerOfSouls, new List<string> { CardIds.StealerOfSouls_StolenSoulEnchantment}},
            { CardIds.StolenGoods_WON_110, new List<string> { CardIds.StolenGoods_SmugglingEnchantment_WON_110e}},
            { CardIds.StolenGoods, new List<string> { CardIds.StolenGoods_SmugglingEnchantment}},
            { CardIds.SummerFlowerchild, new List<string> { CardIds.SummerFlowerchild_SunnyEnchantment}},
            { CardIds.SupremeArchaeology_TomeOfOrigination, new List<string> { CardIds.SupremeArchaeology_OriginationEnchantment}},
            { CardIds.TakeToTheSkies_WW_816, new List<string> { CardIds.TakeToTheSkies_SoaaaringFlyyyyingEnchantment_WW_816e}},
            { CardIds.TearReality, new List<string> { CardIds.TearReality_TornEnchantment}},
            { CardIds.TheDarkPortal_BT_302, new List<string> { CardIds.TheDarkPortal_DarkPortalEnchantment}},
            { CardIds.TroggBeastrager, new List<string> { CardIds.TroggBeastrager_SmugglingEnchantment}},
            { CardIds.Valanyr, new List<string> { CardIds.Valanyr_ValanyrReequipEffectDummy}},
            { CardIds.VelarokWindblade_VelarokTheDeceiverToken_WW_364t, new List<string> { CardIds.VelarokTheDeceiver_VelarokTheDeceiverEnchantment_WW_364te}},
            { CardIds.WagglePick, new List<string> { CardIds.CheatDeath_CloseCallEnchantment}},
            { CardIds.WaywardSage, new List<string> { CardIds.WaywardSage_FoundTheWrongWayEnchantment}},
            { CardIds.WilfredFizzlebang, new List<string> { CardIds.WilfredFizzlebang_MasterSummonerEnchantment}},
        };

        public CardBuffedInHandParser(ParserState ParserState, StateFacade facade)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.StateFacade = facade;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            return false;
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            // Use the meta node and not the action so that we can properly sequence events thanks to the 
            // node's index
            var isCorrectMeta = node.Type == typeof(MetaData)
                && ((node.Object as MetaData).Meta == (int)MetaDataType.TARGET
                    // Skull of Gul'dan doesn't have the TARGET info anymore, but the HOLD_DRAWN_CARD effect is only
                    // present when the card is buffed, so maybe we can use that
                    || (node.Object as MetaData).Meta == (int)MetaDataType.HOLD_DRAWN_CARD);
            return stateType == StateType.PowerTaskList
                && isCorrectMeta
                || (node.Type == typeof(SubSpell) && node.Object != null)
                || (node.Type == typeof(Action)
                    && (node.Object as Action).Type == (int)BlockType.TRIGGER
                    && (node.Object as Action).TriggerKeyword == (int)GameTag.TRIGGER_VISUAL)
                    && GameState.CurrentEntities.ContainsKey((node.Object as Action).Entity)
                    && validTriggerBuffers.Contains(GameState.CurrentEntities[(node.Object as Action).Entity].CardId);
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            return null;
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            if (node.Type == typeof(MetaData))
            {
                return CreateEventProviderForMeta(node);
            }
            else if (node.Type == typeof(SubSpell))
            {
                return CreateEventProviderForSubSpell(node);
            }
            else if (node.Type == typeof(Action))
            {
                return CreateEventProviderForAction(node);
            }
            return null;
        }

        private List<GameEventProvider> CreateEventProviderForSubSpell(Node node)
        {
            var subSpell = (node.Object as SubSpell);
            //Logger.Log("Buff from sub spell", subSpell);
            if (subSpell.Targets == null)
            {
                return null;
            }

            var bufferCardId = BuildSource(subSpell, node);
            //Logger.Log("subSpellEntity", subSpellEntity);
            //Logger.Log("bufferCardId", bufferCardId);
            // Because some cards have an animation that reveal the buffed cards, and others don't, 
            // we have to whitelist the valid cards to avoid info leaks
            if (!validBuffers.Contains(bufferCardId) || !validSubSpellBuffers.Contains(bufferCardId))
            {
                //Logger.Log("buffer not valid", bufferCardId);
                return null;
            }

            var entitiesBuffedInHand = subSpell.Targets
                .Select(target => GameState.CurrentEntities.ContainsKey(target) ? GameState.CurrentEntities[target] : null)
                .Where(entity => entity != null)
                .Where(entity => entity.GetTag(GameTag.ZONE) == (int)Zone.HAND)
                .ToList();
            //Logger.Log("entitiesBuffedInHand", JsonConvert.SerializeObject(entitiesBuffedInHand));
            //Logger.Log("entitiesBuffed", JsonConvert.SerializeObject(subSpell.Targets
            //    .Select(target => GameState.CurrentEntities.ContainsKey(target) ? GameState.CurrentEntities[target] : null)
            //    .Where(entity => entity != null)
            //    .ToList()));
            return entitiesBuffedInHand
                .Select(entity =>
                {
                    return GameEventProvider.Create(
                        subSpell.Timestamp,
                        "CARD_BUFFED_IN_HAND",
                        GameEvent.CreateProvider(
                            "CARD_BUFFED_IN_HAND",
                            entity.CardId,
                            entity.GetEffectiveController(),
                            entity.Entity,
                            StateFacade,
                            //null,
                            new
                            {
                                BuffingEntityCardId = bufferCardId,
                                BuffCardId = buffs.ContainsKey(bufferCardId) ? buffs[bufferCardId] : null,
                            }),
                        true,
                        node,
                        // The PowerTaskList doesnt' have an entry for that
                        true);
                })
                .ToList();
        }

        private List<GameEventProvider> CreateEventProviderForAction(Node node)
        {
            var action = node.Object as Action;
            var bufferCardId = GameState.CurrentEntities[action.Entity].CardId;

            var parentAction = node.Parent.Object as Action;

            var entitiesBuffedInHand = parentAction.Data
                .Where(data => data is TagChange)
                .Select(data => data as TagChange)
                .Where(data => data.Name == (int)GameTag.ZONE && data.Value == (int)Zone.HAND)
                .Select(data => GameState.CurrentEntities[data.Entity])
                .ToList();
            return entitiesBuffedInHand
                .Select(entity =>
                {
                    return GameEventProvider.Create(
                        action.TimeStamp,
                        "CARD_BUFFED_IN_HAND",
                        GameEvent.CreateProvider(
                            "CARD_BUFFED_IN_HAND",
                            entity.CardId,
                            entity.GetEffectiveController(),
                            entity.Entity,
                            StateFacade,
                            //null,
                            new
                            {
                                BuffingEntityCardId = bufferCardId,
                                BuffCardId = buffs.ContainsKey(bufferCardId) ? buffs[bufferCardId] : null,
                            }),
                        true,
                        node,
                        // The PowerTaskList doesnt' have an entry for that
                        true);
                })
                .ToList();
        }

        private string BuildSource(SubSpell subSpell, Node node)
        {
            switch (subSpell.Prefab)
            {
                case "CS3FX_AegwynnTheGuardian_DrawAndHold_CardBuff_Super":
                    return CardIds.AegwynnTheGuardianCore;
            }

            if (!GameState.CurrentEntities.ContainsKey(subSpell.Source))
            {
                return null;
            }
            var subSpellEntity = GameState.CurrentEntities[subSpell.Source];
            return subSpellEntity.CardId;
        }

        private List<GameEventProvider> CreateEventProviderForMeta(Node node)
        {
            var isPower = node.Parent.Type == typeof(Parser.ReplayData.GameActions.Action)
                 && (node.Parent.Object as Parser.ReplayData.GameActions.Action).Type == (int)BlockType.POWER;
            var isTrigger = node.Parent.Type == typeof(Parser.ReplayData.GameActions.Action)
                 && (node.Parent.Object as Parser.ReplayData.GameActions.Action).Type == (int)BlockType.TRIGGER;
            if (!isPower && !isTrigger)
            {
                return null;
            }


            var action = node.Parent.Object as Parser.ReplayData.GameActions.Action;
            if (!GameState.CurrentEntities.ContainsKey(action.Entity))
            {
                Logger.Log("Missing entity key", "" + action.Entity);
                return null;
            }

            var actionEntity = GameState.CurrentEntities[action.Entity];
            var bufferCardId = actionEntity.CardId;
            // Because some cards have an animation that reveal the buffed cards, and others don't, 
            // we have to whitelist the valid cards to avoid info leaks
            if (!validBuffers.Contains(bufferCardId))
            {
                return null;
            }

            var meta = node.Object as MetaData;
            var metaType = (node.Object as MetaData).Meta;
            if (metaType == (int)MetaDataType.HOLD_DRAWN_CARD && !validHoldWhenDrawnBuffers.Contains(bufferCardId))
            {
                return null;
            }

            var entitiesBuffedInHand = meta.MetaInfo
                .Select(info => GameState.CurrentEntities.ContainsKey(info.Entity) ? GameState.CurrentEntities[info.Entity] : null)
                .Where(entity => entity != null)
                .Where(entity => entity.GetTag(GameTag.ZONE) == (int)Zone.HAND)
                .ToList();
            return entitiesBuffedInHand
                .Select(entity =>
                {
                    return GameEventProvider.Create(
                        meta.TimeStamp,
                        "CARD_BUFFED_IN_HAND",
                        GameEvent.CreateProvider(
                            "CARD_BUFFED_IN_HAND",
                            entity.CardId,
                            entity.GetEffectiveController(),
                            entity.Entity,
                            StateFacade,
                            //null,
                            new
                            {
                                BuffingEntityCardId = actionEntity.CardId,
                                BuffCardId = buffs.ContainsKey(actionEntity.CardId) ? buffs[actionEntity.CardId] : null,
                            }),
                        true,
                        node);
                })
                .ToList();
        }
    }
}
