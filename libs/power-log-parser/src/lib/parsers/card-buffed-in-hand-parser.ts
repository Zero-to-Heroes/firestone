import { BlockType, CardIds, GameTag, MetaTags, Zone } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventHelper, GameEventProvider } from '../game-event';
import { Action, FullEntity, MetaData, Node, SubSpell, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class CardBuffedInHandParser implements ActionParser {
	readonly ParserName = 'CardBuffedInHandParser';

	private GameState: GameState;
	private ParserState: ParserState;
	private StateFacade: StateFacade;

	private validBuffers: string[] = [
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
	];

	private validHoldWhenDrawnBuffers: string[] = [
		CardIds.SkullOfGuldan_BT_601,
		CardIds.SkullOfGuldanTavernBrawl,
	];

	private validSubSpellBuffers: string[] = [
		CardIds.AegwynnTheGuardianCore,
		CardIds.EfficientOctoBot,
	];

	private validTriggerBuffers: string[] = [
		CardIds.FarWatchPost,
		CardIds.DemonslayerKurtrus_LudicrousSpeedEnchantment,
		CardIds.Si7Skulker_SpyStuffEnchantment,
	];

	private buffs: Map<string, string[]> = new Map([
		[CardIds.AegwynnTheGuardianCore, [CardIds.AegwynnTheGuardian_GuardiansLegacyCoreEnchantment]],
		[CardIds.AkaliTheRhino, [CardIds.AkaliTheRhino]],
		[CardIds.AncientMysteries, [CardIds.AncientMysteries_TranslatedEnchantment]],
		[CardIds.AutoArmamentsTavernBrawlToken, [CardIds.AutoArmaments_AutoArmedTavernBrawlEnchantment]],
		[CardIds.AzeriteVein_WW_422, [CardIds.AzeriteGem_AzeriteGlowEnchantment_WW_001t14e]],
		[CardIds.BeaststalkerTavish_ImprovedFreezingTrapToken, [CardIds.ImprovedFreezingTrap_FreezingEnchantment]],
		[CardIds.BlackjackStunner, [CardIds.BlackjackStunner_StunnedEnchantment]],
		[CardIds.BogSlosher, [CardIds.BogSlosher_SloshedEnchantment]],
		[CardIds.BrassKnuckles, [CardIds.BrassKnuckles_SmugglingEnchantment]],
		[CardIds.CallToAdventure, [CardIds.CallToAdventure_HeroicEnchantment]],
		[CardIds.CattleRustler_WW_351, [CardIds.CattleRustler_RustledEnchantment_WW_351e]],
		[CardIds.CelestialProjectionist, [CardIds.CelestialProjectionist_AstralProjectionEnchantment]],
		[CardIds.CheatDeath, [CardIds.CheatDeath_CloseCallEnchantment]],
		[CardIds.CheatDeathCore, [CardIds.CheatDeath_CloseCallEnchantment]],
		[CardIds.ChorusRiff, [CardIds.ChorusRiff_ChorusEnchantment]],
		[CardIds.ClutchmotherZavas, [CardIds.ClutchmotherZavas_RemembranceEnchantment]],
		[CardIds.CorsairCache, [CardIds.CorsairCache_VoidSharpenedEnchantment]],
		[CardIds.DemonBloodTavernBrawl, [CardIds.DemonBlood_DemonBloodTavernBrawlEnchantment]],
		[CardIds.DemonizerTavernBrawlToken, [CardIds.Demonizer_DemonizedTavernBrawlEnchantment]],
		[CardIds.DinoTrackingTavernBrawl, [CardIds.DinoTracking_DinoTrackingTavernBrawlEnchantment]],
		[CardIds.DonHancho, [CardIds.DonHancho_SmugglingEnchantment]],
		[CardIds.DoorOfShadows, [CardIds.DoorOfShadows_ShadowstalkingEnchantment]],
		[CardIds.DoorOfShadows_DoorOfShadowsToken, [CardIds.DoorOfShadows_ShadowstalkingEnchantment]],
		[CardIds.DragonqueenAlexstrasza, [CardIds.DragonqueenAlexstrasza_AQueensDiscountEnchantment]],
		[CardIds.DunBaldarBunker, [CardIds.DunBaldarBunker_CloakedSecretsEnchantment]],
		[CardIds.EfficientOctoBot, [CardIds.EfficientOctoBot_TrainingEnchantment]],
		[CardIds.EmperorThaurissan_BRM_028, [CardIds.EmperorThaurissan_ImperialFavorEnchantment]],
		[CardIds.EmperorThaurissan_WON_133, [CardIds.EmperorThaurissan_ImperialFavorEnchantment_WON_133e]],
		[CardIds.FarSightCore, [CardIds.FarSight_FarSightLegacyEnchantment]],
		[CardIds.FarSightLegacy, [CardIds.FarSight_FarSightLegacyEnchantment]],
		[CardIds.FarSightVanilla, [CardIds.FarSight_FarSightLegacyEnchantment]],
		[CardIds.FarWatchPost, [CardIds.FarWatchPost_SpottedEnchantment]],
		[CardIds.FateWeaver, [CardIds.FateWeaver_DraconicFateEnchantment]],
		[CardIds.FinalShowdown_GainMomentumToken, [CardIds.FasterMovesEnchantment]],
		[CardIds.FinalShowdown, [CardIds.FasterMovesEnchantment]],
		[CardIds.FreezingTrapCore, [CardIds.FreezingTrap_TrappedLegacyEnchantment]],
		[CardIds.FreezingTrapLegacy, [CardIds.FreezingTrap_TrappedLegacyEnchantment]],
		[CardIds.FreezingTrapVanilla, [CardIds.FreezingTrap_TrappedLegacyEnchantment]],
		[CardIds.GalakrondTheUnbreakable_GalakrondAzerothsEndToken, [CardIds.GalakrondTheUnbreakable_GalakrondsStrengthEnchantment_DRG_650e3]],
		[CardIds.GalakrondTheUnbreakable_GalakrondTheApocalypseToken, [CardIds.GalakrondTheUnbreakable_GalakrondsStrengthEnchantment_DRG_650e2]],
		[CardIds.GalakrondTheUnbreakable, [CardIds.GalakrondTheUnbreakable_GalakrondsStrengthEnchantment_DRG_650e]],
		[CardIds.GrimestreetEnforcer, [CardIds.GrimestreetEnforcer_SmugglingEnchantment]],
		[CardIds.GrimestreetEnforcer_WON_046, [CardIds.GrimestreetEnforcer_SmugglingEnchantment_WON_046e]],
		[CardIds.GrimestreetOutfitter, [CardIds.GrimestreetOutfitter_SmugglingEnchantment]],
		[CardIds.GrimestreetOutfitterCore, [CardIds.GrimestreetOutfitter_SmugglingEnchantment]],
		[CardIds.GrimestreetPawnbroker, [CardIds.GrimestreetPawnbroker_SmugglingEnchantment]],
		[CardIds.GrimestreetSmuggler, [CardIds.GrimestreetSmuggler_SmugglingEnchantment]],
		[CardIds.GrimscaleChum, [CardIds.GrimscaleChum_SmugglingEnchantment]],
		[CardIds.GrimyGadgeteer, [CardIds.GrimyGadgeteer_SmugglingEnchantment]],
		[CardIds.GrimyGadgeteer_WON_108, [CardIds.GrimyGadgeteer_SmugglingEnchantment_WON_108e]],
		[CardIds.GrumbleWorldshaker, [CardIds.GrumbleWorldshaker_GrumblyTumblyEnchantment]],
		[CardIds.HarnessTheElements, [CardIds.HarnessTheElements_HarnessTheElementsTavernBrawlEnchantment]],
		[CardIds.HiddenCache, [CardIds.HiddenCache_SmugglingEnchantment]],
		[CardIds.HuntersInsight, [CardIds.HuntersInsight_InsightfulEnchantment]],
		[CardIds.HuntersInsightTavernBrawl, [CardIds.HuntersInsight_InsightfulTavernBrawlEnchantment]],
		[CardIds.IKnowAGuy_WON_350, [CardIds.IKnowAGuy_KnowsAnotherGuyEnchantment_CFM_940e]],
		[CardIds.IKnowAGuy, [CardIds.IKnowAGuy_KnowsAnotherGuyEnchantment_CFM_940e]],
		[CardIds.Insight_InsightToken, [CardIds.Insight_InsightfulEnchantment]],
		[CardIds.KoboldMiner_FoolsAzeriteToken_WW_001t3, [CardIds.AzeriteGem_AzeriteGlowEnchantment_WW_001t14e]],
		[CardIds.KoboldMiner_AzeriteChunkToken_WW_001t9, [CardIds.AzeriteGem_AzeriteGlowEnchantment_WW_001t14e]],
		[CardIds.KoboldMiner_AzeriteGemToken_WW_001t14, [CardIds.AzeriteGem_AzeriteGlowEnchantment_WW_001t14e]],
		[CardIds.KoboldMiner_TheAzeriteHawkToken_WW_001t24, [CardIds.TidestoneOfGolganneth_ReducedEnchantment]],
		[CardIds.KoboldMiner_TheAzeriteScorpionToken_WW_001t23, [CardIds.TheAzeriteScorpion_ScorpionsStingEnchantment_WW_001t23e]],
		[CardIds.TheCountess_LegendaryInvitationToken, [CardIds.TheCountess_GuestOfHonorEnchantment]],
		[CardIds.LegendaryLootTavernBrawl, [CardIds.LegendaryLoot_LootedTavernBrawlEnchantment]],
		[CardIds.LegendaryLoot_LegendaryLootTavernBrawlEnchantment, [CardIds.LegendaryLoot_LootedTavernBrawlEnchantment]],
		[CardIds.MesaduneTheFractured_WW_429, [CardIds.AzeriteVein_FracturedEnchantment_WW_422e, CardIds.AzeriteVein_FracturedEnchantment_WW_422e2]],
		[CardIds.NightmareDragonkin_EDR_890, [CardIds.Cost2LegacyEnchantment_GBL_002e]],
		[CardIds.OrbOfRevelationTavernBrawl, [CardIds.OrbOfRevelation_OrbOfRevelationTavernBrawlEnchantment_PVPDR_BAR_Passive08e1]],
		[CardIds.OrbOfRevelation_OrbOfRevelationTavernBrawlEnchantment_PVPDR_BAR_Passive08e1, [CardIds.OrbOfRevelation_OrbOfRevelationTavernBrawlEnchantment_PVPDR_BAR_Passive08e2]],
		[CardIds.PredatoryInstincts, [CardIds.PredatoryInstincts_PredatoryInstinctsEnchantment]],
		[CardIds.RelicOfDimensions, [CardIds.RelicOfDimensions_DimensionalEnchantment]],
		[CardIds.Rheastrasza_PurifiedDragonNestToken_WW_824t, [CardIds.Rheastrasza_HappilyHatchedEnchantment_WW_824e]],
		[CardIds.RingOfPhaseshifting_RingOfPhaseshiftingTavernBrawlEnchantment, [CardIds.RingOfPhaseshifting_PhaseshiftedTavernBrawlEnchantment]],
		[CardIds.RuniTimeExplorer_RuinsOfKoruneToken_WON_053t6, [CardIds.RuinsOfKorune_KorunesBlessingEnchantment_WON_053t6e]],
		[CardIds.SaloonBrewmaster_WW_423, [CardIds.SaloonBrewmaster_OrderUpEnchantment_WW_423e]],
		[CardIds.ScavengersIngenuity, [CardIds.ScavengersIngenuity_PackTacticsEnchantment]],
		[CardIds.ScourgeIllusionist, [CardIds.ScourgeIllusionist_IllusionEnchantment]],
		[CardIds.SesselieOfTheFaeCourt_REV_319, [CardIds.SesselieOfTheFaeCourt_SesseliesBlessingEnchantment]],
		[CardIds.Shadowcaster, [CardIds.Shadowcaster_FlickeringDarknessEnchantment]],
		[CardIds.Shadowcasting101_Shadowcasting101TavernBrawlEnchantment_PVPDR_AV_Passive04e1, [CardIds.Shadowcasting101_Shadowcasting101TavernBrawlEnchantment_PVPDR_AV_Passive04e2]],
		[CardIds.Shadowfiend_WON_061, [CardIds.Shadowfiend_ShadowfiendedEnchantment_WON_061e]],
		[CardIds.Shadowfiend, [CardIds.Shadowfiend_ShadowfiendedEnchantment]],
		[CardIds.ShadowstepCore, [CardIds.CheatDeath_CloseCallEnchantment]],
		[CardIds.ShadowstepLegacy, [CardIds.CheatDeath_CloseCallEnchantment]],
		[CardIds.ShadowstepVanilla, [CardIds.CheatDeath_CloseCallEnchantment]],
		[CardIds.ShakyZipgunner, [CardIds.ShakyZipgunner_SmugglingEnchantment]],
		[CardIds.SkullOfGuldan_BT_601, [CardIds.SkullOfGuldan_EmbracePowerEnchantment]],
		[CardIds.SkullOfGuldanTavernBrawl, [CardIds.SkullOfGuldan_EmbracePowerEnchantment]],
		[CardIds.SmugglersCrate, [CardIds.SmugglersCrate_SmugglingEnchantment]],
		[CardIds.SmugglersRun, [CardIds.SmugglersRun_SmugglingEnchantment]],
		[CardIds.SonyaShadowdancer, [CardIds.SonyaShadowdancer_SonyasShadowEnchantment]],
		[CardIds.StarseekersToolsTavernBrawl, [CardIds.StarseekersTools_PlannedEnchantment]],
		[CardIds.StealerOfSouls, [CardIds.StealerOfSouls_StolenSoulEnchantment]],
		[CardIds.StolenGoods_WON_110, [CardIds.StolenGoods_SmugglingEnchantment_WON_110e]],
		[CardIds.StolenGoods, [CardIds.StolenGoods_SmugglingEnchantment]],
		[CardIds.SummerFlowerchild, [CardIds.SummerFlowerchild_SunnyEnchantment]],
		[CardIds.SupremeArchaeology_TomeOfOrigination, [CardIds.SupremeArchaeology_OriginationEnchantment]],
		[CardIds.TakeToTheSkies_WW_816, [CardIds.TakeToTheSkies_SoaaaringFlyyyyingEnchantment_WW_816e]],
		[CardIds.TearReality, [CardIds.TearReality_TornEnchantment]],
		[CardIds.TheDarkPortal_BT_302, [CardIds.TheDarkPortal_DarkPortalEnchantment]],
		[CardIds.TroggBeastrager, [CardIds.TroggBeastrager_SmugglingEnchantment]],
		[CardIds.Valanyr, [CardIds.Valanyr_ValanyrReequipEffectDummy]],
		[CardIds.VelarokWindblade_VelarokTheDeceiverToken_WW_364t, [CardIds.VelarokTheDeceiver_VelarokTheDeceiverEnchantment_WW_364te]],
		[CardIds.WagglePick, [CardIds.CheatDeath_CloseCallEnchantment]],
		[CardIds.WaywardSage, [CardIds.WaywardSage_FoundTheWrongWayEnchantment]],
		[CardIds.WilfredFizzlebang, [CardIds.WilfredFizzlebang_MasterSummonerEnchantment]],
	]);

	constructor(parserState: ParserState, facade: StateFacade) {
		this.ParserState = parserState;
		this.GameState = parserState.GameState;
		this.StateFacade = facade;
	}

	AppliesOnNewNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	AppliesOnCloseNode(node: Node, stateType: StateType): boolean {
		const isCorrectMeta =
			node.Type === MetaData &&
			((node.Object as MetaData).Meta === (MetaTags.TARGET as number) ||
				(node.Object as MetaData).Meta === (MetaTags.HOLD_DRAWN_CARD as number));
		return (
			(stateType === StateType.PowerTaskList && isCorrectMeta) ||
			(node.Type === SubSpell && node.Object != null) ||
			(node.Type === Action &&
				(node.Object as Action).Type === (BlockType.TRIGGER as number) &&
				(node.Object as Action).TriggerKeyword === (GameTag.TRIGGER_VISUAL as number) &&
				this.GameState.CurrentEntities.has((node.Object as Action).Entity) &&
				this.validTriggerBuffers.includes(
					this.GameState.CurrentEntities.get((node.Object as Action).Entity)!.CardId,
				))
		);
	}

	CreateGameEventProviderFromNew(_node: Node): GameEventProvider[] | null {
		return null;
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		if (node.Type === MetaData) {
			return this.createEventProviderForMeta(node);
		} else if (node.Type === SubSpell) {
			return this.createEventProviderForSubSpell(node);
		} else if (node.Type === Action) {
			return this.createEventProviderForAction(node);
		}
		return null;
	}

	private createEventProviderForSubSpell(node: Node): GameEventProvider[] | null {
		const subSpell = node.Object as SubSpell;
		if (subSpell.Targets == null) {
			return null;
		}

		const bufferCardId = this.buildSource(subSpell);
		if (!bufferCardId || !this.validBuffers.includes(bufferCardId) || !this.validSubSpellBuffers.includes(bufferCardId)) {
			return null;
		}

		const entitiesBuffedInHand = subSpell.Targets.map((target) =>
			this.GameState.CurrentEntities.has(target) ? this.GameState.CurrentEntities.get(target)! : null,
		)
			.filter((entity) => entity != null)
			.filter((entity) => entity!.GetTag(GameTag.ZONE) === (Zone.HAND as number));

		return entitiesBuffedInHand.map((entity) =>
			GameEventProvider.Create(
				subSpell.Timestamp,
				'CARD_BUFFED_IN_HAND',
				GameEventHelper.CreateProvider(
					'CARD_BUFFED_IN_HAND',
					entity!.CardId,
					entity!.GetEffectiveController(),
					entity!.Entity,
					this.StateFacade,
					{
						BuffingEntityCardId: bufferCardId,
						BuffCardId: this.buffs.get(bufferCardId) ?? null,
					},
				),
				true,
				node,
				undefined,
				true as any,
			),
		);
	}

	private createEventProviderForAction(node: Node): GameEventProvider[] | null {
		const action = node.Object as Action;
		const bufferCardId = this.GameState.CurrentEntities.get(action.Entity)!.CardId;

		const parentAction = node.Parent!.Object as Action;

		const entitiesBuffedInHand = parentAction.Data.filter((data) => data instanceof TagChange)
			.map((data) => data as unknown as TagChange)
			.filter((data) => data.Name === (GameTag.ZONE as number) && data.Value === (Zone.HAND as number))
			.map((data) => this.GameState.CurrentEntities.get(data.Entity)!);

		return entitiesBuffedInHand.map((entity) =>
			GameEventProvider.Create(
				action.TimeStamp,
				'CARD_BUFFED_IN_HAND',
				GameEventHelper.CreateProvider(
					'CARD_BUFFED_IN_HAND',
					entity.CardId,
					entity.GetEffectiveController(),
					entity.Entity,
					this.StateFacade,
					{
						BuffingEntityCardId: bufferCardId,
						BuffCardId: this.buffs.get(bufferCardId) ?? null,
					},
				),
				true,
				node,
				undefined,
				true as any,
			),
		);
	}

	private buildSource(subSpell: SubSpell): string | null {
		switch (subSpell.Prefab) {
			case 'CS3FX_AegwynnTheGuardian_DrawAndHold_CardBuff_Super':
				return CardIds.AegwynnTheGuardianCore;
		}

		if (!this.GameState.CurrentEntities.has(subSpell.Source)) {
			return null;
		}
		const subSpellEntity = this.GameState.CurrentEntities.get(subSpell.Source)!;
		return subSpellEntity.CardId;
	}

	private createEventProviderForMeta(node: Node): GameEventProvider[] | null {
		const isPower =
			node.Parent?.Type === Action &&
			(node.Parent.Object as Action).Type === (BlockType.POWER as number);
		const isTrigger =
			node.Parent?.Type === Action &&
			(node.Parent.Object as Action).Type === (BlockType.TRIGGER as number);
		if (!isPower && !isTrigger) {
			return null;
		}

		const action = node.Parent!.Object as Action;
		if (!this.GameState.CurrentEntities.has(action.Entity)) {
			return null;
		}

		const actionEntity = this.GameState.CurrentEntities.get(action.Entity)!;
		const bufferCardId = actionEntity.CardId;
		if (!this.validBuffers.includes(bufferCardId)) {
			return null;
		}

		const meta = node.Object as MetaData;
		const metaType = meta.Meta;
		if (metaType === (MetaTags.HOLD_DRAWN_CARD as number) && !this.validHoldWhenDrawnBuffers.includes(bufferCardId)) {
			return null;
		}

		const entitiesBuffedInHand = meta.MetaInfo
			.map((info) =>
				this.GameState.CurrentEntities.has(info.Entity)
					? this.GameState.CurrentEntities.get(info.Entity)!
					: null,
			)
			.filter((entity) => entity != null)
			.filter((entity) => entity!.GetTag(GameTag.ZONE) === (Zone.HAND as number));

		return entitiesBuffedInHand.map((entity) =>
			GameEventProvider.Create(
				meta.TimeStamp,
				'CARD_BUFFED_IN_HAND',
				GameEventHelper.CreateProvider(
					'CARD_BUFFED_IN_HAND',
					entity!.CardId,
					entity!.GetEffectiveController(),
					entity!.Entity,
					this.StateFacade,
					{
						BuffingEntityCardId: actionEntity.CardId,
						BuffCardId: this.buffs.get(actionEntity.CardId) ?? null,
					},
				),
				true,
				node,
			),
		);
	}
}
