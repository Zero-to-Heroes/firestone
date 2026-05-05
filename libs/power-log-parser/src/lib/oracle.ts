import { BlockType, CardIds, CardType, GameTag, Zone } from '@firestone-hs/reference-data';
import { DeepSpaceCurator } from './cards/deep-space-curator';
import { DemonicProject } from './cards/demonic-project';
import { Mimicry } from './cards/mimicry';
import { RazaTheResealed } from './cards/raza-the-resealed';
import { RunicAdornment } from './cards/runic-adornment';
import { Triangulate } from './cards/triangulate';
import { MetaDataType } from './enums';
import { Logger } from './logger';
import { Action, ShowEntity } from './models/action';
import { FullEntity } from './models/entity';
import { GameData } from './models/game-data';
import { MetaData } from './models/meta';
import { Node, NodeType } from './models/node';
import { SubSpell } from './models/sub-spell';
import { Tag, TagChange } from './models/tag';
import { SHATTER_HAND_PIECE_CREATOR_FALLBACK_CARD_IDS } from './shatter-hand-piece-creator-fallback-card-ids';
import type { GameState } from './state/game-state';
import type { StateFacade } from './state/state-facade';

export class Oracle {
	private static PLAGUES: string[] = [
		CardIds.DistressedKvaldir_UnholyPlagueToken,
		CardIds.DistressedKvaldir_FrostPlagueToken,
		CardIds.DistressedKvaldir_BloodPlagueToken,
	];

	/**
	 * Body Wrapper: FULL_ENTITY in deck has empty CardID; the discover copy gets LAST_AFFECTED_BY = Body Wrapper entity id before the new deck entity is created.
	 */
	private static predictBodyWrapperShuffledCardId(gameState: GameState, bodyWrapperEntityId: number): string | null {
		for (const e of gameState.CurrentEntities.values()) {
			if (e.Entity === bodyWrapperEntityId) {
				continue;
			}
			if (e.GetTag(GameTag.LAST_AFFECTED_BY) === bodyWrapperEntityId && e.CardId?.length) {
				return e.CardId;
			}
		}
		return null;
	}

	/** Gemstone Hoarder / Deathblossom Whomper: enchantment on the minion stores the linked entity id. */
	private static predictGemstoneHoarderOrDeathBlossomLinkedCardId(
		gameState: GameState,
		actionEntity: FullEntity,
	): string | null {
		const enchantment = Array.from(gameState.CurrentEntities.values())
			.filter((e) => e.GetCardType() === (CardType.ENCHANTMENT as number))
			.filter((e) => e.GetTag(GameTag.ATTACHED) === actionEntity.Entity)
			.filter((e) => e.GetTag(GameTag.CREATOR) === actionEntity.Entity);
		const lastEnchantment = enchantment.length > 0 ? enchantment[enchantment.length - 1] : null;
		const referencedEntityId = lastEnchantment?.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_1) ?? -1;
		const linkedEntity = gameState.CurrentEntities.get(referencedEntityId);
		return linkedEntity?.CardId ?? null;
	}

	static GetCreatorFromTags(gameState: GameState, entity: FullEntity | ShowEntity, node: Node): string | null {
		let creatorCardId = Oracle.GetCreatorCardIdFromTag(gameState, entity.GetTag(GameTag.CREATOR));
		if (!creatorCardId) {
			creatorCardId = Oracle.GetCreatorCardIdFromTag(gameState, entity.GetTag(GameTag.DISPLAYED_CREATOR));
		}
		return creatorCardId;
	}

	/**
	 * The GameState log stream often applies DISPLAYED_CREATOR / CREATOR before PowerTaskList closes the
	 * same entity — and GS vs PTL use separate {@link GameState} maps, so read missing tags from
	 * {@link StateFacade.GSState} when the PTL entity still has -1.
	 */
	private static creatorEntityTagWithGameStateStreamFallback(
		gameState: GameState,
		entity: FullEntity,
		tag: GameTag,
		stateFacade: StateFacade | null,
	): number {
		const local = entity.GetTag(tag);
		if (local !== -1) {
			return local;
		}
		const ptlMerged = gameState.CurrentEntities.get(entity.Id);
		let v = ptlMerged?.GetTag(tag) ?? -1;
		if (v === -1 && stateFacade?.GsState?.GameState) {
			v = stateFacade.GsState.GameState.CurrentEntities.get(entity.Id)?.GetTag(tag) ?? -1;
		}
		return v;
	}

	static FindCardCreator(
		gameState: GameState,
		entity: FullEntity,
		node: Node,
		getLastInfluencedBy: boolean = true,
		stateFacade: StateFacade | null = null,
	): [string, number] | null {
		const displayedCreatorEnt = Oracle.creatorEntityTagWithGameStateStreamFallback(
			gameState,
			entity,
			GameTag.DISPLAYED_CREATOR,
			stateFacade,
		);
		const creatorEnt = Oracle.creatorEntityTagWithGameStateStreamFallback(
			gameState,
			entity,
			GameTag.CREATOR,
			stateFacade,
		);
		if (
			!getLastInfluencedBy &&
			creatorEnt === -1 &&
			displayedCreatorEnt === -1 &&
			entity.GetTag(GameTag.CREATOR_DBID) === -1 &&
			entity.GetTag(GameTag.ZONE) === (Zone.DECK as number)
		) {
			return null;
		}

		let creatorTuple = Oracle.FindCardCreatorCardId(gameState, displayedCreatorEnt, node);
		if (!creatorTuple?.[0]) {
			creatorTuple = Oracle.FindCardCreatorCardId(gameState, creatorEnt, node);
		}
		if (creatorTuple?.[0] === CardIds.DarkGiftToken_EDR_102t) {
			const futureEntity = stateFacade?.GsState?.GameState.CurrentEntities.get(entity.Id);
			if (futureEntity) {
				const tagHist = [...futureEntity.TagsHistory]
					.reverse()
					.find((t) => t.Name === (GameTag.TAG_SCRIPT_DATA_ENT_1 as number) && t.Value > 0);
				const realGiftCreatorEntityId = tagHist?.Value ?? 0;
				const realGiftCreator = stateFacade!.GsState!.GameState.CurrentEntities.get(realGiftCreatorEntityId);
				if (realGiftCreator) {
					creatorTuple = [realGiftCreator.CardId, realGiftCreatorEntityId];
				}
			}
		}
		// Only attribute to a SHATTER source spell (Spark of Life / Sands of Time) when the entity is
		// actually a shatter piece — either the SHATTERED tag is set, or the parser is currently inside
		// the shatter sub-spell. Without this guard, any later draw with no CardId (e.g. Smoldering
		// Grove drawing from the opponent deck) would inherit the spell still sitting in the graveyard.
		const isShattered = entity.GetTag(GameTag.SHATTERED) === 1;
		const isBeingShattered =
			gameState.ParserState.CurrentSubSpell?.Prefab === 'CATAFX_Shattered_Combined_OverrideSpawn_Super';
		if (!creatorTuple?.[0] && (isShattered || isBeingShattered)) {
			const shatteredFallback = Oracle.FindShatteredPieceCreatorFromGraveyard(gameState, entity);
			if (shatteredFallback) {
				creatorTuple = shatteredFallback;
			}
		}
		if (!creatorTuple?.[0] && isShattered) {
			const informantDiscover = Oracle.FindShatteredPieceCreatorFromDiscoverInformant(gameState, entity);
			if (informantDiscover) {
				creatorTuple = informantDiscover;
			}
		}
		// Shattered hand pieces often omit CREATOR / DISPLAYED_CREATOR; inferring the parent block
		// would incorrectly attribute the enclosing minion PLAY (e.g. Violet Treasuregill) while the
		// card was drawn from deck (e.g. Dragonscale Armaments) and split by Shatter. Only use
		// parent-chain inference when the entity is not SHATTERED — Spark/Sands still resolve via
		// {@link FindShatteredPieceCreatorFromGraveyard} above.
		if (!creatorTuple?.[0] && !isShattered && !isBeingShattered) {
			creatorTuple = Oracle.FindParentEntity(gameState, node);
		}
		return creatorTuple;
	}

	/** When shatter pieces omit CREATOR / DISPLAYED_CREATOR, tie them to a known source spell in the graveyard (same controller). */
	private static FindShatteredPieceCreatorFromGraveyard(
		gameState: GameState,
		entity: FullEntity,
	): [string, number] | null {
		if (entity.CardId?.length) {
			return null;
		}
		const controller = entity.GetEffectiveController();
		const shatteredSourceSpells = SHATTER_HAND_PIECE_CREATOR_FALLBACK_CARD_IDS;
		for (const e of gameState.CurrentEntities.values()) {
			if (e.GetEffectiveController() !== controller) {
				continue;
			}
			if (e.GetTag(GameTag.ZONE) !== (Zone.GRAVEYARD as number)) {
				continue;
			}
			if (!e.CardId?.length || !(shatteredSourceSpells as readonly string[]).includes(e.CardId)) {
				continue;
			}
			return [e.CardId, e.Entity];
		}
		return null;
	}

	/**
	 * Shadowed Informant discover puts a spell in hand with DISPLAYED_CREATOR → Informant; when that
	 * spell shatters, SHATTERED tokens often have no CREATOR. Non–graveyard discover options also
	 * point at Informant but sit in GY — skip GY and empty CardId to find the real hand/setaside spell.
	 */
	private static FindShatteredPieceCreatorFromDiscoverInformant(
		gameState: GameState,
		entity: FullEntity,
	): [string, number] | null {
		if (entity.CardId?.length) {
			return null;
		}
		const controller = entity.GetEffectiveController();
		const informantId = CardIds.ShadowedInformant_CATA_614;
		for (const e of gameState.CurrentEntities.values()) {
			if (e.GetEffectiveController() !== controller || e.Entity === entity.Entity) {
				continue;
			}
			if (e.GetTag(GameTag.ZONE) === (Zone.GRAVEYARD as number)) {
				continue;
			}
			if (e.CardId?.length) {
				continue;
			}
			const displayedCreatorEntId = e.GetTag(GameTag.DISPLAYED_CREATOR);
			if (displayedCreatorEntId <= 0) {
				continue;
			}
			const displayedCreator = gameState.CurrentEntities.get(displayedCreatorEntId);
			if (displayedCreator?.CardId === informantId) {
				return [informantId, displayedCreator.Entity];
			}
		}
		return null;
	}

	static FindCardCreatorFromShowEntity(
		gameState: GameState,
		entity: ShowEntity,
		node: Node,
	): [string, number] | null {
		let creatorTuple = Oracle.FindCardCreatorCardId(gameState, entity.GetTag(GameTag.CREATOR), node);
		if (!creatorTuple?.[0]) {
			creatorTuple = Oracle.FindCardCreatorCardId(gameState, entity.GetTag(GameTag.DISPLAYED_CREATOR), node);
		}
		if (!creatorTuple?.[0] && entity.GetTag(GameTag.SHATTERED) !== 1) {
			creatorTuple = Oracle.FindParentEntity(gameState, node);
		}
		return creatorTuple;
	}

	static FindCardCreatorCardId(gameState: GameState, creatorTag: number, node: Node): [string, number] | null {
		if (creatorTag === -1) {
			return null;
		}
		if (gameState.CurrentEntities.has(creatorTag)) {
			const creator = gameState.CurrentEntities.get(creatorTag)!;
			let cardId = creator?.CardId ?? '';
			let entityId = creator?.Entity ?? -1;
			// Concealed intermediary entities (e.g. Shatter flow) keep the real source in DISPLAYED_CREATOR.
			if (!cardId.length) {
				const displayedEntId = creator.GetTag(GameTag.DISPLAYED_CREATOR);
				if (displayedEntId !== -1 && gameState.CurrentEntities.has(displayedEntId)) {
					const displayed = gameState.CurrentEntities.get(displayedEntId)!;
					if (displayed.CardId?.length) {
						cardId = displayed.CardId;
						entityId = displayedEntId;
					}
				}
			}
			return [cardId, entityId];
		}
		return Oracle.FindParentEntity(gameState, node);
	}

	/**
	 * Fyrakk's battlecry casts Fire spells via nested spell entities; CREATOR / parent resolution may
	 * point at an intermediate spell. If any ancestor ACTION block is Fyrakk the Blazing, use it as
	 * the logical creator (e.g. for SECRET_CREATED_IN_GAME + secret pool).
	 */
	static FindFyrakkTheBlazingInActionAncestors(gameState: GameState, node: Node): [string, number] | null {
		let current: Node | null = node.Parent;
		while (current != null) {
			if (current.Type === NodeType.Action) {
				const act = current.Object as Action;
				if (gameState.CurrentEntities.has(act.Entity)) {
					const ent = gameState.CurrentEntities.get(act.Entity)!;
					if (ent.CardId === CardIds.FyrakkTheBlazing_FIR_959) {
						return [CardIds.FyrakkTheBlazing_FIR_959, ent.Entity];
					}
				}
			}
			current = current.Parent;
		}
		return null;
	}

	static FindParentEntity(gameState: GameState, node: Node): [string, number] | null {
		let current: Node | null = node.Parent;
		while (current != null) {
			if (current.Type === NodeType.Action) {
				const act = current.Object as Action;
				if (gameState.CurrentEntities.has(act.Entity)) {
					const creator = gameState.CurrentEntities.get(act.Entity)!;
					if (creator?.CardId === CardIds.YseraUnleashed_DreamPortalToken) {
						if (node.Object instanceof ShowEntity) {
							const handledEntity = node.Object as ShowEntity;
							if (handledEntity.GetTag(GameTag.ZONE) === (Zone.HAND as number)) {
								return null;
							}
						}
					}
					let cardId = creator?.CardId ?? '';
					let entityId = creator?.Entity ?? -1;
					// Concealed intermediary entities (e.g. Shatter flow) keep the real source in DISPLAYED_CREATOR.
					if (!cardId.length) {
						const displayedEntId = creator.GetTag(GameTag.DISPLAYED_CREATOR);
						if (displayedEntId !== -1 && gameState.CurrentEntities.has(displayedEntId)) {
							const displayed = gameState.CurrentEntities.get(displayedEntId)!;
							if (displayed.CardId?.length) {
								cardId = displayed.CardId;
								entityId = displayedEntId;
							}
						}
					}
					if (cardId.length) {
						return [cardId, entityId];
					}
				}
			}
			current = current.Parent;
		}
		return null;
	}

	private static GetCreatorCardIdFromTag(gameState: GameState, creatorTag: number): string | null {
		if (creatorTag !== -1 && gameState.CurrentEntities.has(creatorTag)) {
			const creator = gameState.CurrentEntities.get(creatorTag);
			return creator?.CardId ?? null;
		}
		return null;
	}

	static GuessTags(
		gameState: GameState,
		creatorCardId: string | null | undefined,
		creatorEntityId: number,
		node: Node,
		inputCardId: string | null = null,
		stateFacade: StateFacade | null = null,
		createdEntityId: number | null = null,
	): Tag[] | null {
		switch (creatorCardId) {
			case CardIds.DeepSpaceCurator_GDB_311:
				return DeepSpaceCurator.GuessTags(gameState, creatorCardId, creatorEntityId, node, stateFacade);
			default:
				return null;
		}
	}

	static PredictCardId(
		gameState: GameState,
		creatorCardId: string | null | undefined,
		creatorEntityId: number,
		node: Node,
		inputCardId: string | null = null,
		stateFacade: StateFacade | null = null,
		createdEntityId: number | null = null,
		subSpellInEffect: SubSpell | null = null,
	): string | null {
		if (inputCardId && inputCardId.length > 0) {
			return inputCardId;
		}

		let isFunkyDeathrattleEffect = false;
		if (node.Parent != null && node.Parent.Type === NodeType.Action) {
			const action = node.Parent.Object as Action;
			if (
				action.Type === (BlockType.TRIGGER as number) &&
				action.TriggerKeyword === (GameTag.DEATHRATTLE as number) &&
				action.EffectIndex === -1
			) {
				isFunkyDeathrattleEffect = true;
			}
		}

		const creatorEntity = gameState.CurrentEntities.get(creatorEntityId);
		if (!isFunkyDeathrattleEffect) {
			switch (creatorCardId) {
				case CardIds.AbyssalWave:
					return CardIds.SirakessCultist_AbyssalCurseToken;
				case CardIds.Acornbearer:
					return CardIds.Acornbearer_SquirrelToken;
				case CardIds.AdorableInfestation:
					return CardIds.AdorableInfestation_MarsuulCubToken;
				case CardIds.AirRaid_YOD_012:
					return CardIds.AirRaid_YOD_012ts;
				case CardIds.Akama_BT_713:
					return CardIds.Akama_AkamaPrimeToken;
				case CardIds.AmateurPuppeteer_TOY_828:
					return CardIds.AmateurPuppeteer_AmateurPuppeteerToken_TOY_828t;
				case CardIds.AncientShade:
					return CardIds.AncientShade_AncientCurseToken;
				case CardIds.AngryMob:
					return CardIds.CrazedMob;
				case CardIds.ArcaneWyrm:
					return CardIds.ArcaneBolt;
				case CardIds.ArchmageAntonidas:
				case CardIds.ArchmageAntonidas_CORE_EX1_559:
				case CardIds.ArchmageAntonidasLegacy:
				case CardIds.ArchmageAntonidasVanilla:
					return CardIds.FireballCore_CORE_CS2_029;
				case CardIds.ArchsporeMsshifn:
					return CardIds.ArchsporeMsshifn_MsshifnPrimeToken;
				case CardIds.Arcsplitter:
					return CardIds.ArcaneBolt;
				case CardIds.AstalorBloodsworn_AstalorTheProtectorToken:
					return CardIds.AstalorBloodsworn_AstalorTheFlamebringerToken;
				case CardIds.AstalorBloodsworn:
					return CardIds.AstalorBloodsworn_AstalorTheProtectorToken;
				case CardIds.AstralTiger:
					return CardIds.AstralTiger;
				case CardIds.AstromancerSolarian:
					return CardIds.AstromancerSolarian_SolarianPrimeToken;
				case CardIds.AwakeningTremors:
					return CardIds.AwakeningTremors_BurstingJormungarToken;
				case CardIds.AwakenTheMakers:
					return CardIds.AwakenTheMakers_AmaraWardenOfHopeToken;
				case CardIds.AzsharanDefector:
					return CardIds.AzsharanDefector_SunkenDefectorToken;
				case CardIds.AzsharanGardens:
					return CardIds.AzsharanGardens_SunkenGardensToken;
				case CardIds.AzsharanMooncatcher_TSC_644:
					return CardIds.AzsharanMooncatcher_SunkenMooncatcherToken;
				case CardIds.AzsharanRitual:
					return CardIds.AzsharanRitual_SunkenRitualToken;
				case CardIds.AzsharanSaber:
					return CardIds.AzsharanSaber_SunkenSaberToken;
				case CardIds.AzsharanScavenger:
					return CardIds.AzsharanScavenger_SunkenScavengerToken;
				case CardIds.AzsharanScroll:
					return CardIds.AzsharanScroll_SunkenScrollToken;
				case CardIds.AzsharanSentinel:
					return CardIds.AzsharanSentinel_SunkenSentinelToken;
				case CardIds.AzsharanSweeper_TSC_776:
					return CardIds.AzsharanSweeper_SunkenSweeperToken;
				case CardIds.AzsharanTrident:
					return CardIds.AzsharanTrident_SunkenTridentToken;
				case CardIds.AzsharanVessel:
					return CardIds.AzsharanVessel_SunkenVesselToken;
				case CardIds.BadLuckAlbatross:
					return CardIds.BadLuckAlbatross_AlbatrossToken;
				case CardIds.BagOfCoins_LOOTA_836:
					return CardIds.TheCoinCore;
				case CardIds.BagOfCoinsTavernBrawl:
					return CardIds.TheCoinCore;
				case CardIds.BananaBuffoon:
					return CardIds.BananaBuffoon_BananasToken;
				case CardIds.BananaVendor:
					return CardIds.BananaVendor_BananasToken;
				case CardIds.BarrelOfMonkeys_BarrelOfMonkeysToken_ETC_207t:
					return CardIds.BarrelOfMonkeys_BarrelOfMonkeysToken_ETC_207t2;
				case CardIds.BarrelOfMonkeys:
					return CardIds.BarrelOfMonkeys_BarrelOfMonkeysToken_ETC_207t;
				case CardIds.BaubleOfBeetles_ULDA_307:
					return CardIds.BaubleOfBeetles_ULDA_307ts;
				case CardIds.BeneathTheGrounds:
					return CardIds.BeneathTheGrounds_NerubianAmbushToken;
				case CardIds.BeOurGuestTavernBrawl:
					return CardIds.TheCountess_LegendaryInvitationToken;
				case CardIds.BlackwingExperiment_CATA_464:
					return CardIds.BlackwingExperiment_DragonBreathToken_CATA_464t;
				case CardIds.BlessingOfTheAncients_DAL_351:
					return CardIds.BlessingOfTheAncients_DAL_351ts;
				case CardIds.BloodsailFlybooter:
					return CardIds.BloodsailFlybooter_SkyPirateToken;
				case CardIds.BoneBaron_CORE_ICC_065:
					return CardIds.GrimNecromancer_SkeletonToken;
				case CardIds.BoneBaron_ICC_065:
					return CardIds.GrimNecromancer_SkeletonToken;
				case CardIds.BookOfWonders:
					return CardIds.DeckOfWonders_ScrollOfWonderToken;
				case CardIds.BodyWrapper:
					return Oracle.predictBodyWrapperShuffledCardId(gameState, creatorEntityId);
				case CardIds.BootyBayBookie:
					return CardIds.TheCoinCore;
				case CardIds.Bottomfeeder:
					return CardIds.Bottomfeeder;
				case CardIds.BoomWrench_TOY_604:
					return CardIds.BoomWrench_BoomWrenchToken_TOY_604t;
				case CardIds.BountyWrangler_WW_363:
					return CardIds.TheCoinCore;
				case CardIds.BringOnRecruitsTavernBrawl:
					return CardIds.SilverHandRecruitLegacyToken;
				case CardIds.BroodQueen_SC_003:
					return CardIds.BroodQueen_LarvaToken_SC_003t;
				case CardIds.BronzeHerald:
					return CardIds.BronzeHerald_BronzeDragonToken;
				case CardIds.BuildASnowman_BuildASnowbruteToken:
					return CardIds.BuildASnowman_BuildASnowgreToken;
				case CardIds.BuildASnowman:
					return CardIds.BuildASnowman_BuildASnowbruteToken;
				case CardIds.BumperCar:
					return CardIds.BumperCar_DarkmoonRiderToken;
				case CardIds.BunchOfBananas_BunchOfBananasToken_ETC_201t:
					return CardIds.BunchOfBananas_BunchOfBananasToken_ETC_201t2;
				case CardIds.BunchOfBananas:
					return CardIds.BunchOfBananas_BunchOfBananasToken_ETC_201t;
				case CardIds.BurglyBully:
					return CardIds.TheCoinCore;
				case CardIds.CarelessCrafter_TOY_382:
					return CardIds.CarelessCrafter_BandageToken_TOY_382t;
				case CardIds.CashCow_WORK_019:
					return CardIds.TheCoinCore;
				case CardIds.CarryOnGrub_VAC_935:
					return CardIds.CarryOnGrub_CarryOnSuitcaseToken_VAC_935t;
				case CardIds.ChainsOfDread_AV_316hp:
					return CardIds.DreadlichTamsin_FelRiftToken;
				case CardIds.ChiaDrake_TOY_801:
					return CardIds.ChiaDrake_ChiaDrakeToken_TOY_801t;
				case CardIds.ClayMatriarch_TOY_380:
					return CardIds.ClayMatriarch_ClayMatriarchToken_TOY_380t;
				case CardIds.ClockworkGoblin_DAL_060:
					return CardIds.SeaforiumBomber_BombToken;
				case CardIds.CoinPouch_SackOfCoinsTavernBrawl:
					return CardIds.CoinPouch_HeftySackOfCoinsTavernBrawl;
				case CardIds.CoinPouch:
					return CardIds.SackOfCoins;
				case CardIds.CoinPouchTavernBrawl:
					return CardIds.CoinPouch_SackOfCoinsTavernBrawl;
				case CardIds.CommandTheElements_TameTheFlamesToken:
					return CardIds.CommandTheElements_StormcallerBrukanToken;
				case CardIds.ConfectionCyclone:
					return CardIds.ConfectionCyclone_SugarElementalToken;
				case CardIds.ConjureManaBiscuit:
					return CardIds.ConjureManaBiscuit_ManaBiscuitToken;
				case CardIds.ConjurersCalling_DAL_177:
					return CardIds.ConjurersCalling_DAL_177ts;
				case CardIds.ConsiderThePast_ConsiderThePastEnchantment_TOT_341e:
					return CardIds.ConsiderThePast;
				case CardIds.CoppertailSnoop_CoppertailSnoopEnchantment:
					return CardIds.TheCoinCore;
				case CardIds.CoppertailSnoop:
					return CardIds.TheCoinCore;
				case CardIds.CreepyCurio_HauntedCurioTavernBrawl:
					return CardIds.CreepyCurio_CursedCurioTavernBrawl;
				case CardIds.CreepyCurio:
					return CardIds.HauntedCurio;
				case CardIds.CreepyCurioTavernBrawl:
					return CardIds.CreepyCurio_HauntedCurioTavernBrawl;
				case CardIds.CthunTheShattered_BodyOfCthunToken:
					return CardIds.CthunTheShattered;
				case CardIds.CthunTheShattered_EyeOfCthunToken:
					return CardIds.CthunTheShattered;
				case CardIds.CthunTheShattered_HeartOfCthunToken:
					return CardIds.CthunTheShattered;
				case CardIds.CthunTheShattered_MawOfCthunToken:
					return CardIds.CthunTheShattered;
				case CardIds.CultivatingSprite_MEND_100:
					return CardIds.CultivatingSprite_BloomingBulbToken_MEND_100t;
				case CardIds.CurseOfAgony:
					return CardIds.CurseOfAgony_AgonyToken;
				case CardIds.CurseOfRafaam:
					return CardIds.CurseOfRafaam_CursedToken;
				case CardIds.Cutpurse:
					return CardIds.TheCoinCore;
				case CardIds.DartThrow_WW_006:
					return CardIds.TheCoinCore;
				case CardIds.DeadlyFork:
					return CardIds.DeadlyFork_SharpFork;
				case CardIds.DeathbringerSaurfangCore_RLK_082:
					return CardIds.DeathbringerSaurfangCore_RLK_082;
				case CardIds.DeckOfWonders:
					return CardIds.DeckOfWonders_ScrollOfWonderToken;
				case CardIds.DefendTheDwarvenDistrict_KnockEmDownToken:
					return CardIds.DefendTheDwarvenDistrict_TavishMasterMarksmanToken;
				case CardIds.DesperateMeasures_DAL_141:
					return CardIds.DesperateMeasures_DAL_141ts;
				case CardIds.DigForTreasure_TOY_510:
					return CardIds.TheCoinCore;
				case CardIds.DirehornHatchling:
					return CardIds.DirehornHatchling_DirehornMatriarchToken;
				case CardIds.Doomcaller:
					return CardIds.Cthun_OG_279;
				case CardIds.DraggedBelow:
					return CardIds.SirakessCultist_AbyssalCurseToken;
				case CardIds.DragonbaneShot:
					return CardIds.DragonbaneShot;
				case CardIds.DrawOffensivePlayTavernBrawlEnchantment:
					return CardIds.OffensivePlayTavernBrawl;
				case CardIds.DreadlichTamsin_AV_316:
					return CardIds.DreadlichTamsin_FelRiftToken;
				case CardIds.DrivenToGreed_ChaoticUnspentCoinEnchantment_TTN_002t20e:
					return CardIds.TheCoinCore;
				case CardIds.RuleModifier_DrivenToGreedToken_TTN_002t20:
					return CardIds.TheCoinCore;
				case CardIds.DrygulchJailor:
					return CardIds.SilverHandRecruitLegacyToken;
				case CardIds.EliseStarseeker_CORE_LOE_079:
					return CardIds.UnearthedRaptor_MapToTheGoldenMonkeyToken;
				case CardIds.EliseStarseeker_LOE_079:
					return CardIds.UnearthedRaptor_MapToTheGoldenMonkeyToken;
				case CardIds.EliseTheTrailblazer:
					return CardIds.EliseTheTrailblazer_UngoroPackToken;
				case CardIds.EliteTaurenChampion_MoltenPickOfRockToken:
					return CardIds.EliteTaurenChampion_MoltenPickOfRockToken;
				case CardIds.EliteTaurenChampion:
					return CardIds.EliteTaurenChampion_MoltenPickOfRockToken;
				case CardIds.EncumberedPackMule:
					return CardIds.EncumberedPackMule;
				case CardIds.EscapeTheUnderfel_TLC_446:
					return CardIds.EscapeTheUnderfel_UnderfelRiftToken_TLC_446t;
				case CardIds.EverburningPhoenix_EverburningEnchantment_FIR_919e:
					return CardIds.EverburningPhoenix_FIR_919;
				case CardIds.DopEmergencyEnchant2Enchantment_DOP_002e:
					return CardIds.EverburningPhoenix_FIR_919;
				case CardIds.Roach_SC_012:
					return CardIds.Roach_SC_012;
				case CardIds.ExcavatedEvil:
					return CardIds.ExcavatedEvil;
				case CardIds.ExploreUngoro:
					return CardIds.ExploreUngoro_ChooseYourPathToken;
				case CardIds.ExplorersHat:
					return CardIds.ExplorersHat;
				case CardIds.ExplorersHat_ExplorersHatEnchantment:
					return CardIds.ExplorersHat;
				case CardIds.ExplorersHat_WON_022:
					return CardIds.ExplorersHat_WON_022;
				case CardIds.ExtraArms:
					return CardIds.ExtraArms_MoreArmsToken;
				case CardIds.EyeOfChaos_YOG_515:
					return CardIds.ChaoticTendril_YOG_514;
				case CardIds.FactoryAssemblybot_TOY_601:
					return CardIds.FactoryAssemblybot_FactoryAssemblybotToken_TOY_601t;
				case CardIds.FaldoreiStrider:
					return CardIds.FaldoreiStrider_SpiderAmbush;
				case CardIds.FeralGibberer:
					return CardIds.FeralGibberer;
				case CardIds.FinalShowdown_CloseThePortalToken:
					return CardIds.DemonslayerKurtrusToken;
				case CardIds.FindTheImposter_MarkedATraitorToken:
					return CardIds.FindTheImposter_SpymasterScabbsToken;
				case CardIds.FireFly:
					return CardIds.FireFly_FlameElementalToken;
				case CardIds.FireFly_CORE_UNG_809:
					return CardIds.FireFly_FlameElementalToken;
				case CardIds.FirePlumesHeart:
					return CardIds.FirePlumesHeart_SulfurasToken;
				case CardIds.FirstFlame:
					return CardIds.FirstFlame_SecondFlameToken;
				case CardIds.FirstFlame_CORE_SW_108:
					return CardIds.FirstFlame_SecondFlameToken;
				case CardIds.FishyFlyer:
					return CardIds.FishyFlyer_SpectralFlyerToken;
				case CardIds.FlameGeyser:
					return CardIds.FireFly_FlameElementalToken;
				case CardIds.FlameGeyserCore:
					return CardIds.FireFly_FlameElementalToken;
				case CardIds.FinalPortalToArgus_FleeingTerrorguardToken_TIME_020t5t:
					return CardIds.Broxigar_TIME_020;
				case CardIds.FlickeringLightbot_MIS_918:
					return CardIds.FlickeringLightbot_FlickeringLightbotToken_MIS_918t;
				case CardIds.FloppyHydra_TOY_897:
					return CardIds.FloppyHydra_TOY_897;
				case CardIds.ForgottenTorch:
					return CardIds.ForgottenTorch_RoaringTorchToken;
				case CardIds.Framester:
					return CardIds.Framester_FramedToken;
				case CardIds.FreshScent_YOD_005:
					return CardIds.FreshScent_YOD_005ts;
				case CardIds.FrostShardsTavernBrawl:
					return CardIds.FrostShards_IceShardTavernBrawl;
				case CardIds.FrozenTouch_FrozenTouchToken:
					return CardIds.FrozenTouch;
				case CardIds.FrozenTouch:
					return CardIds.FrozenTouch_FrozenTouchToken;
				case CardIds.FullBlownEvil:
					return CardIds.FullBlownEvil;
				case CardIds.GhastlyConjurer_CORE_ICC_069:
					return CardIds.MirrorImageLegacy_CS2_027;
				case CardIds.GhastlyConjurer_ICC_069:
					return CardIds.MirrorImageLegacy_CS2_027;
				case CardIds.GiftOfTheHeartTavernBrawlToken:
					return CardIds.WildGrowth_ExcessManaLegacyToken;
				case CardIds.GildedGargoyle_LOOT_534:
					return CardIds.TheCoinCore;
				case CardIds.GladeEcologist_TLC_820:
					return CardIds.PurifyingVines_TLC_813;
				case CardIds.GorishiWasp_TLC_630:
					return CardIds.GorishiWasp_GorishiStingerToken_TLC_630t;
				case CardIds.GreedyPartner_WW_901:
					return CardIds.TheCoinCore;
				case CardIds.HakkarTheSoulflayer_CorruptedBloodToken:
					return CardIds.HakkarTheSoulflayer_CorruptedBloodToken;
				case CardIds.HakkarTheSoulflayer:
					return CardIds.HakkarTheSoulflayer_CorruptedBloodToken;
				case CardIds.HalazziTheLynx:
				case CardIds.HalazziTheLynx_CORE_TRL_900:
					return CardIds.Springpaw_LynxToken;
				case CardIds.HandleWithBear_WORK_024:
					return CardIds.HandleWithBear_CarefulBearToken_WORK_024t;
				case CardIds.Harpoon:
					return CardIds.ArcaneShot;
				case CardIds.HauntedCurio:
					return CardIds.CursedCurio;
				case CardIds.HeadcrackLegacy:
					return CardIds.HeadcrackLegacy;
				case CardIds.HeadcrackVanilla:
					return CardIds.HeadcrackVanilla;
				case CardIds.HighborneMentor_TIME_704:
					return CardIds.HighborneMentor_HighbornePupilToken_TIME_704t;
				case CardIds.HighPriestessJeklik_CORE_TRL_252:
					return CardIds.HighPriestessJeklik_CORE_TRL_252;
				case CardIds.HighPriestessJeklik_TRL_252:
					return CardIds.HighPriestessJeklik_TRL_252;
				case CardIds.HoardingDragon_LOOT_144:
					return CardIds.TheCoinCore;
				case CardIds.HolySpringwater_WW_395:
					return CardIds.HolySpringwater_BottledSpringwaterToken_WW_395t;
				case CardIds.IdoOfTheThreshfleet_TLC_241:
					return CardIds.IdoOfTheThreshfleet_CallTheThreshfleetToken_TLC_241t;
				case CardIds.IgneousElemental:
					return CardIds.FireFly_FlameElementalToken;
				case CardIds.Ignite:
					return CardIds.Ignite;
				case CardIds.Impbalming:
					return CardIds.Impbalming_WorthlessImpToken;
				case CardIds.ImpCredibleTrousers_ImpCredibleTrousersTavernBrawlEnchantment:
					return CardIds.DreadlichTamsin_FelRiftToken;
				case CardIds.ImpCredibleTrousersTavernBrawl:
					return CardIds.DreadlichTamsin_FelRiftToken;
				case CardIds.InfernalStrikeTavernBrawl:
					return CardIds.TwinSlice_SecondSliceToken;
				case CardIds.Infestation_TLC_902:
					return CardIds.GorishiWasp_GorishiStingerToken_TLC_630t;
				case CardIds.InfestedGoblin:
					return CardIds.WrappedGolem_ScarabToken;
				case CardIds.InfestedWatcher_YOG_523:
					return CardIds.ChaoticTendril_YOG_514;
				case CardIds.InfinitizeTheMaxitude_InfinitizeTheMaxitudeEnchantment:
					return CardIds.InfinitizeTheMaxitude;
				case CardIds.InvasiveShadeleaf_WW_393:
					return CardIds.InvasiveShadeleaf_BottledShadeleafToken_WW_393t;
				case CardIds.IronJuggernaut:
					return CardIds.IronJuggernaut_BurrowingMineToken;
				case CardIds.JadeDisplay_TOY_803:
					return CardIds.JadeDisplay_TOY_803;
				case CardIds.JadeIdol_JadeStash:
					return CardIds.JadeIdol;
				case CardIds.JadeIdol:
					return CardIds.JadeIdol;
				case CardIds.JungleGiants:
					return CardIds.JungleGiants_BarnabusTheStomperToken;
				case CardIds.KangorDancingKing:
					return CardIds.KangorDancingKing;
				case CardIds.KanrethadEbonlocke:
					return CardIds.KanrethadEbonlocke_KanrethadPrimeToken;
				case CardIds.KargathBladefist_BT_123:
					return CardIds.KargathBladefist_KargathPrimeToken;
				case CardIds.GaronaHalforcen_KingLlaneToken_TIME_875t:
					return CardIds.GaronaHalforcen_KingLlaneToken_TIME_875t;
				case CardIds.KingMaluk_TIME_042:
					return CardIds.KingMaluk_InfiniteBananaToken_TIME_042t;
				case CardIds.KingMaluk_InfiniteBananaToken_TIME_042t:
					return CardIds.KingMaluk_InfiniteBananaToken_TIME_042t;
				case CardIds.KingMukla_CORE_EX1_014:
					return CardIds.KingMukla_BananasLegacyToken;
				case CardIds.KingMuklaLegacy:
					return CardIds.KingMukla_BananasLegacyToken;
				case CardIds.KingMuklaVanilla:
					return CardIds.KingMukla_BananasLegacyToken;
				case CardIds.Kingsbane_LOOT_542:
					return CardIds.Kingsbane_LOOT_542;
				case CardIds.KingTogwaggle:
					return CardIds.KingTogwaggle_KingsRansomToken;
				case CardIds.KoboldMiner_PouchOfCoinsToken_WW_001t18:
					return CardIds.TheCoinCore;
				case CardIds.KoboldTaskmaster:
					return CardIds.KoboldTaskmaster_ArmorScrapToken;
				case CardIds.LadyVashj_BT_109:
					return CardIds.LadyVashj_VashjPrimeToken;
				case CardIds.LakkariSacrifice:
					return CardIds.LakkariSacrifice_NetherPortalToken_UNG_829t1;
				case CardIds.LicensedAdventurer:
					return CardIds.TheCoinCore;
				case CardIds.LieInWait_TLC_513:
					return CardIds.LieInWait_MasterDuskToken_TLC_513t;
				case CardIds.LifesavingAura_VAC_922:
					return CardIds.Grillmaster_SunscreenToken_VAC_917t;
				case CardIds.LightforgedBlessing_DAL_568:
					return CardIds.LightforgedBlessing_DAL_568ts;
				case CardIds.LightOfTheNewMoon_LightOfTheFullMoonToken_FIR_918t:
					return CardIds.LightOfTheNewMoon_FIR_918;
				case CardIds.LibramOfDivinity_LibramOfDivinityEnchantment_GDB_138e2:
					return CardIds.LibramOfDivinity_GDB_138;
				case CardIds.LoanShark:
					return CardIds.TheCoinCore;
				case CardIds.Locuuuusts_ONY_005tb3:
					return CardIds.Locuuuusts_GiantLocustToken_ONY_005tb3t2;
				case CardIds.Locuuuusts_ULDA_036:
					return CardIds.GiantLocust_Locuuuusts;
				case CardIds.LocuuuustsTavernBrawl:
					return CardIds.Locuuuusts_LocuuuustsTavernBrawl;
				case CardIds.LostInThePark_FeralFriendsyToken:
					return CardIds.LostInThePark_GuffTheToughToken;
				case CardIds.MadeOfCoins:
					return CardIds.TheCoinCore;
				case CardIds.MagneticMinesTavernBrawl:
					return CardIds.SeaforiumBomber_BombToken;
				case CardIds.MailboxDancer:
					return CardIds.TheCoinCore;
				case CardIds.Malorne:
					return CardIds.Malorne;
				case CardIds.Mankrik:
					return CardIds.Mankrik_OlgraMankriksWifeToken;
				case CardIds.Marrowslicer:
					return CardIds.SchoolSpirits_SoulFragmentToken;
				case CardIds.MerchSeller:
				case CardIds.MerchSeller_CORE_ETC_111:
					// Random spell on the opponent's deck; identity comes from SHOW_ENTITY when played/drawn.
					return null;
				case CardIds.MetalDetector_VAC_330:
					return CardIds.TheCoinCore;
				case CardIds.MidaPureLight_ONY_028:
					return CardIds.MidaPureLight_FragmentOfMidaToken;
				case CardIds.MilitiaHorn:
					return CardIds.VeteransMilitiaHorn;
				case CardIds.MiracleSalesman_WW_331:
					return CardIds.MiracleSalesman_SnakeOilToken_WW_331t;
				case CardIds.MisterMukla_ETC_836:
					return CardIds.KingMukla_BananasLegacyToken;
				case CardIds.MonkeyBusiness_WORK_020:
					return CardIds.KingMukla_BananasLegacyToken;
				case CardIds.RemixedDispenseOBot_MoneyDispenseOBotToken:
					return CardIds.TheCoinCore;
				case CardIds.MuklaTyrantOfTheVale:
					return CardIds.KingMukla_BananasLegacyToken;
				case CardIds.MuradinHighKing_TIME_209:
					return CardIds.MuradinHighKing_HighKingsHammerToken_TIME_209t;
				case CardIds.MurgurMurgurgle:
					return CardIds.MurgurMurgurgle_MurgurglePrimeToken;
				case CardIds.MurlocGrowfin_MIS_307:
					return CardIds.MurlocGrowfin_MurlocGrowfinToken_MIS_307t1;
				case CardIds.MysteryEgg_TOY_351:
					return CardIds.MysteryEgg_MysteryEggToken_TOY_351t;
				case CardIds.MysticalMirage_ULDA_035:
					return CardIds.MysticalMirage_ULDA_035ts;
				case CardIds.NarainSoothfancy_VAC_420:
					return CardIds.NarainSoothfancy_FortuneToken_VAC_420t;
				case CardIds.NostalgicClown_TOY_341:
					return CardIds.NostalgicClown_NostalgicClownToken_TOY_341t;
				case CardIds.NostalgicGnome_TOY_312:
					return CardIds.NostalgicGnome_NostalgicGnomeToken_TOY_312t;
				case CardIds.NostalgicInitiate_TOY_340:
					return CardIds.NostalgicInitiate_NostalgicInitiateToken_TOY_340t1;
				case CardIds.OhManager_VAC_460:
					return CardIds.TheCoinCore;
				case CardIds.OldMilitiaHorn_MilitiaHornTavernBrawl:
					return CardIds.OldMilitiaHorn_VeteransMilitiaHornTavernBrawl;
				case CardIds.OldMilitiaHorn:
					return CardIds.MilitiaHorn;
				case CardIds.OldMilitiaHornTavernBrawl:
					return CardIds.OldMilitiaHorn_MilitiaHornTavernBrawl;
				case CardIds.OpenTheWaygate:
					return CardIds.OpenTheWaygate_TimeWarpToken;
				case CardIds.Overgrowth:
					return CardIds.WildGrowth_ExcessManaLegacyToken;
				case CardIds.Parrrley_DED_005:
					return CardIds.Parrrley_DED_005;
				case CardIds.PhotographerFizzle:
					return CardIds.PhotographerFizzle_FizzlesSnapshotToken;
				case CardIds.PiranhaPoacher:
					return CardIds.PiranhaSwarmer;
				case CardIds.TwistPlagueOfMurlocs:
					return CardIds.TwistPlagueOfMurlocs_SurpriseMurlocsToken;
				case CardIds.PopgarThePutrid_WW_091:
					return CardIds.TramMechanic_BarrelOfSludgeToken_WW_044t;
				case CardIds.PortalKeeper:
					return CardIds.PortalKeeper_FelhoundPortalToken;
				case CardIds.PortalOverfiend:
					return CardIds.PortalKeeper_FelhoundPortalToken;
				case CardIds.PozzikAudioEngineer:
					return CardIds.PozzikAudioEngineer_AudioBotToken;
				case CardIds.Pyros_PyrosToken_UNG_027t2:
					return CardIds.Pyros_PyrosToken_UNG_027t4;
				case CardIds.Pyros:
					return CardIds.Pyros_PyrosToken_UNG_027t2;
				case CardIds.Queldelar_ForgingQueldelarToken_LOOTA_842t:
				case CardIds.Queldelar_ForgingQueldelarToken_VAC_464t31t:
				case CardIds.BladeOfQueldelar_ForgingQueldelarTavernBrawl:
					return CardIds.QueldelarTavernBrawl;
				case CardIds.Queldelar_ForgingQueldelarToken_ONY_005tc7t:
					return CardIds.Queldelar_ForgingQueldelarToken_ONY_005tc7t;
				case CardIds.RaidTheDocks_SecureTheSuppliesToken:
					return CardIds.RaidTheDocks_CapnRokaraToken;
				case CardIds.RamCommander:
					return CardIds.RamCommander_BattleRamToken;
				case CardIds.RangerGilly_VAC_413:
					return CardIds.RangerGilly_IslandCrocoliskToken_VAC_413t;
				case CardIds.RapidFire_DAL_373:
					return CardIds.RapidFire_DAL_373ts;
				case CardIds.RaptorHatchling:
					return CardIds.RaptorHatchling_RaptorPatriarchToken;
				case CardIds.RatSensei_WON_013: {
					const options = [
						CardIds.RatSensei_MonkTurtleToken_WON_013t,
						CardIds.RatSensei_MonkTurtleToken_WON_013t2,
						CardIds.RatSensei_MonkTurtleToken_WON_013t3,
						CardIds.RatSensei_MonkTurtleToken_WON_013t4,
					];
					return options[Math.floor(Math.random() * options.length)];
				}
				case CardIds.RatsOfExtraordinarySize:
					return CardIds.RodentNest_RatToken;
				case CardIds.RayOfFrost_DAL_577:
					return CardIds.RayOfFrost_DAL_577ts;
				case CardIds.RazorpetalLasher:
					return CardIds.RazorpetalVolley_RazorpetalToken;
				case CardIds.RazorpetalVolley:
					return CardIds.RazorpetalVolley_RazorpetalToken;
				case CardIds.ReanimateTheTerror_TLC_433:
					return CardIds.ReanimateTheTerror_TyraxBoneTerrorToken_TLC_433t;
				case CardIds.RehgarEarthfury_CORE_CATA_004:
					return CardIds.LightningBoltCore;
				case CardIds.ReliquaryOfSouls:
					return CardIds.ReliquaryOfSouls_ReliquaryPrimeToken;
				case CardIds.ReachEquilibrium_CleanseTheShadowToken_TLC_817t:
					return CardIds.ReachEquilibrium_SoletosLifesBreathToken_TLC_817t3;
				case CardIds.ReachEquilibrium_CorruptTheLightToken_TLC_817t2:
					return CardIds.ReachEquilibrium_SoletosDeathsTouchToken_TLC_817t4;
				case CardIds.ReachEquilibrium_SoletosLifesBreathToken_TLC_817t3:
					return CardIds.ReachEquilibrium_SoletosCyclesRebirthToken_TLC_817t5;
				case CardIds.ReachEquilibrium_SoletosDeathsTouchToken_TLC_817t4:
					return CardIds.ReachEquilibrium_SoletosCyclesRebirthToken_TLC_817t5;
				case CardIds.RemoteControlledGolem_SW_097:
					return CardIds.RemoteControlledGolem_GolemPartsToken;
				case CardIds.Rhonin:
					return CardIds.ArcaneMissilesLegacy;
				case CardIds.RinTheFirstDisciple_TheFinalSealToken:
					return CardIds.RinTheFirstDisciple_AzariTheDevourerToken;
				case CardIds.RinTheFirstDisciple_TheFirstSealToken:
					return CardIds.RinTheFirstDisciple_TheSecondSealToken;
				case CardIds.RinTheFirstDisciple_TheFourthSealToken:
					return CardIds.RinTheFirstDisciple_TheFinalSealToken;
				case CardIds.RinTheFirstDisciple_TheSecondSealToken:
					return CardIds.RinTheFirstDisciple_TheThirdSealToken;
				case CardIds.RinTheFirstDisciple:
					return CardIds.RinTheFirstDisciple_TheFirstSealToken;
				case CardIds.RiseToTheOccasion_AvengeTheFallenToken:
					return CardIds.RiseToTheOccasion_LightbornCarielToken;
				case CardIds.RisingWinds:
					return CardIds.Eagle_RisingWinds;
				case CardIds.RitualOfPower_CATA_561:
					return CardIds.RitualOfPower_BreezlingToken_CATA_561t;
				case CardIds.Rockskipper_TLC_427:
					return CardIds.KoboldMiner_RockToken_WW_001t;
				case CardIds.RuleModifier_ApproachingNightmareToken_TTN_002t14:
					return CardIds.YoggSaronHopesEnd_OG_134;
				case CardIds.RuleModifier_ShiftingFateToken_TTN_002t50:
					return CardIds.GearShift;
				case CardIds.RuleModifier_ShiftingFuturesToken_TTN_002t36:
					return CardIds.ShifterZerus_OG_123;
				case CardIds.RunawayGyrocopter:
					return CardIds.RunawayGyrocopter;
				case CardIds.SackOfCoins:
					return CardIds.HeftySackOfCoins;
				case CardIds.SandArtElemental_TOY_513:
					return CardIds.SandArtElemental_SandArtElementalToken_TOY_513t;
				case CardIds.SandboxScoundrel_TOY_521:
					return CardIds.SandboxScoundrel_SandboxScoundrelToken_TOY_521t1;
				case CardIds.SandwaspQueen:
					return CardIds.SandwaspQueen_SandwaspToken;
				case CardIds.SaxophoneSoloist:
					return CardIds.SaxophoneSoloist;
				case CardIds.Schooling:
					return CardIds.PiranhaSwarmer_PiranhaSwarmerToken_TSC_638t;
				case CardIds.SchoolSpirits_SCH_307:
					return CardIds.SchoolSpirits_SoulFragmentToken;
				case CardIds.SchoolTeacher:
					return CardIds.SchoolTeacher_NagalingToken;
				case CardIds.Scrapsmith:
					return CardIds.Scrapsmith_ScrappyGruntToken;
				case CardIds.SeaforiumBomber:
					return CardIds.SeaforiumBomber_BombToken;
				case CardIds.SecureTheDeck:
					return CardIds.ClawLegacy;
				case CardIds.SeedsOfDestruction:
					return CardIds.DreadlichTamsin_FelRiftToken;
				case CardIds.SeekGuidance_IlluminateTheVoidToken:
					return CardIds.SeekGuidance_XyrellaTheSanctifiedToken;
				case CardIds.SeekGuidance_XyrellaTheSanctifiedToken:
					return CardIds.XyrellaTheSanctified_PurifiedShard;
				case CardIds.SerpentWig_TSC_215:
					return CardIds.SerpentWig_TSC_215;
				case CardIds.ShadowOfDeath_ULD_286:
					return CardIds.ShadowOfDeath_ShadowToken;
				case CardIds.Shudderblock_TOY_501:
					return CardIds.Shudderblock_ShudderblockToken_TOY_501t;
				case CardIds.SinfulSousChef:
					return CardIds.SilverHandRecruitLegacyToken;
				case CardIds.SirakessCultist:
					return CardIds.SirakessCultist_AbyssalCurseToken;
				case CardIds.SisterSvalna:
					return CardIds.SisterSvalna_VisionOfDarknessToken;
				case CardIds.Sleetbreaker:
					return CardIds.Windchill_AV_266;
				case CardIds.SleetSkater_TOY_375:
					return CardIds.SleetSkater_SleetSkaterToken_TOY_375t;
				case CardIds.SludgeOnWheels_WW_043:
					return CardIds.TramMechanic_BarrelOfSludgeToken_WW_044t;
				case CardIds.SmugSenior:
					return CardIds.SmugSenior_SpectralSeniorToken;
				case CardIds.SnuggleTeddy_MIS_300:
					return CardIds.SnuggleTeddy_SnuggleTeddyToken_MIS_300t;
				case CardIds.Sn1pSn4p:
					return CardIds.Sn1pSn4p;
				case CardIds.SneakyDelinquent:
					return CardIds.SneakyDelinquent_SpectralDelinquentToken;
				case CardIds.SoldierOfFortune:
					return CardIds.TheCoinCore;
				case CardIds.SonOfHodir:
					return CardIds.SonOfHodir_FrostTyrantToken;
				case CardIds.SorcerersGambit_ReachThePortalRoomToken:
					return CardIds.SorcerersGambit_ArcanistDawngraspToken;
				case CardIds.SoulShear_SCH_701:
					return CardIds.SchoolSpirits_SoulFragmentToken;
				case CardIds.SparkDrill_BOT_102:
					return CardIds.SparkDrill_SparkToken;
				case CardIds.SparkEngine:
					return CardIds.SparkDrill_SparkToken;
				case CardIds.SpawningPool_SC_000:
					return CardIds.Zergling_SC_010;
				case CardIds.SpiritGatherer_EDR_871:
					return CardIds.WispToken_EDR_851t;
				case CardIds.SpiritJailer_SCH_700:
					return CardIds.SchoolSpirits_SoulFragmentToken;
				case CardIds.SpiritOfTheBadlands_WW_337:
					return CardIds.SpiritOfTheBadlands_MirageToken_WW_337t;
				case CardIds.SpiritOfTheMountain_TLC_229:
					return CardIds.SpiritOfTheMountain_AshalonRidgeGuardianToken_TLC_229t14;
				case CardIds.Springpaw_CORE_TRL_348:
					return CardIds.Springpaw_LynxToken;
				case CardIds.Springpaw_TRL_348:
					return CardIds.Springpaw_LynxToken;
				case CardIds.StaffOfAmmunae_ULDA_041:
					return CardIds.StaffOfAmmunae_ULDA_041ts;
				case CardIds.Starseeker_ULDA_Elise_HP3:
					return CardIds.MoonfireLegacy;
				case CardIds.Starshooter_WW_813:
					return CardIds.ArcaneShotLegacy_DS1_185;
				case CardIds.SteamSurger:
					return CardIds.FlameGeyser;
				case CardIds.StickybombSaboteur_CATA_186:
					return CardIds.StickybombSaboteur_SabotageToken_CATA_186t;
				case CardIds.SunscaleRaptor:
					return CardIds.SunscaleRaptor;
				case CardIds.SurlyMob_AngryMobTavernBrawl:
					return CardIds.SurlyMob_CrazedMobTavernBrawl;
				case CardIds.SurlyMob:
					return CardIds.AngryMob;
				case CardIds.SurlyMobTavernBrawl:
					return CardIds.SurlyMob_AngryMobTavernBrawl;
				case CardIds.SwarmOfLightbugs_WW_052:
					return CardIds.SwarmOfLightbugs_BottledLightbugsToken_WW_052t2;
				case CardIds.TabletopRoleplayer_TOY_915:
					return CardIds.TabletopRoleplayer_TabletopRoleplayerToken_TOY_915t;
				case CardIds.TalanjiOfTheGraves_TIME_619:
					return CardIds.TalanjiOfTheGraves_BwonsamdiToken_TIME_619t;
				case CardIds.Talgath_GDB_472:
					return CardIds.BackstabCore;
				case CardIds.Teamwork_MEND_900:
					return CardIds.SilverHandRecruitLegacyToken;
				case CardIds.TentacleGrip_YOG_526:
					return CardIds.ChaoticTendril_YOG_514;
				case CardIds.TentacleTender_YOG_517:
					return CardIds.ChaoticTendril_YOG_514;
				case CardIds.TheCandle:
					return CardIds.TheCandle;
				case CardIds.TheCandlesquestion_TheCandlesquestion_DALA_714a:
					return CardIds.TheCandlesquestion_TheCandlesquestion_DALA_714b;
				case CardIds.TheCandlesquestion_TheCandlesquestion_DALA_714b:
					return CardIds.TheCandlesquestion_TheCandlesquestion_DALA_714c;
				case CardIds.TheCandlesquestion:
					return CardIds.TheCandlesquestion_TheCandlesquestion_DALA_714a;
				case CardIds.TheCavernsBelow:
					return CardIds.TheCavernsBelow_CrystalCoreToken;
				case CardIds.TheCountess:
					return CardIds.TheCountess_LegendaryInvitationToken;
				case CardIds.TheDarkness_LOOT_526:
					return CardIds.TheDarkness_DarknessCandleToken;
				case CardIds.TheDemonSeed_CompleteTheRitualToken:
					return CardIds.TheDemonSeed_BlightbornTamsinToken;
				case CardIds.TheForestsAid_DAL_256:
					return CardIds.TheForestsAid_DAL_256ts;
				case CardIds.TheForbiddenSequence_TLC_460:
					return CardIds.TheForbiddenSequence_TheOriginStoneToken_TLC_460t;
				case CardIds.TheHandOfRafaam:
					return CardIds.CurseOfRafaam_CursedToken;
				case CardIds.TheLastKaleidosaur:
					return CardIds.TheLastKaleidosaur_GalvadonToken;
				case CardIds.TheMarshQueen_QueenCarnassaToken:
					return CardIds.TheMarshQueen_CarnassasBroodToken;
				case CardIds.TheMarshQueen:
					return CardIds.TheMarshQueen_QueenCarnassaToken;
				case CardIds.TheRyecleaver_VAC_525:
					return CardIds.TheRyecleaver_SliceOfBreadToken_VAC_525t1;
				case CardIds.ThrowGlaive:
					return CardIds.ThrowGlaive;
				case CardIds.Thunderquake_TIME_215:
					return CardIds.StaticShock_TIME_218;
				case CardIds.TigressPlushy_TOY_811:
					return CardIds.TigressPlushy_TigressPlushyToken_TOY_811t;
				case CardIds.TimeAdmralHooktail_TimelessChestToken_TIME_713t:
					return CardIds.TheCoinCore;
				case CardIds.TimelooperToki_LoopingTimeEnchantment_TIME_861e1:
					return CardIds.TimelooperToki_TIME_861;
				case CardIds.TimeSkipper_TIME_054:
					return CardIds.TheCoinCore;
				case CardIds.TinyThimbleTavernBrawl:
					return CardIds.TinyThimble_RegularSizeThimbleTavernBrawl;
				case CardIds.TombPillager_CORE_LOE_012:
					return CardIds.TheCoinCore;
				case CardIds.TombPillager_LOE_012:
					return CardIds.TheCoinCore;
				case CardIds.TombPillager_WON_340:
					return CardIds.TheCoinCore;
				case CardIds.Torch_CATA_585:
					return CardIds.Torch_CATA_585;
				case CardIds.ToyCaptainTarim_TOY_813:
					return CardIds.ToyCaptainTarim_ToyCaptainTarimToken_TOY_813t;
				case CardIds.TradePrinceGallywix_GVG_028:
					return CardIds.TradePrinceGallywix_GallywixsCoinToken;
				case CardIds.TramMechanic_WW_044:
					return CardIds.TramMechanic_BarrelOfSludgeToken_WW_044t;
				case CardIds.TwinSlice_BT_175:
					return CardIds.TwinSlice_SecondSliceToken;
				case CardIds.TwistTheCoffers_CacheOfCashToken:
					return CardIds.TheCoinCore;
				case CardIds.UmbralSkulker:
					return CardIds.TheCoinCore;
				case CardIds.UnearthedRaptor_MapToTheGoldenMonkeyToken:
					return CardIds.UnearthedRaptor_GoldenMonkeyToken;
				case CardIds.UniteTheMurlocs:
					return CardIds.UniteTheMurlocs_MegafinToken;
				case CardIds.UnleashTheBeast_DAL_378:
					return CardIds.UnleashTheBeast_DAL_378ts;
				case CardIds.UnleashTheColossus_TLC_631:
					return CardIds.UnleashTheColossus_GorishiColossusToken_TLC_631t;
				case CardIds.UrzulHorror:
					return CardIds.UrzulHorror_LostSoulToken;
				case CardIds.VictoriousVrykul:
					return CardIds.VictoriousVrykul_VictoriousValkyrToken;
				case CardIds.VioletSpellwing:
					return CardIds.ArcaneMissilesLegacy;
				case CardIds.VioletSpellwing_CORE_DRG_107:
					return CardIds.ArcaneMissilesLegacy;
				case CardIds.VolleyMaul_VAC_921:
					return CardIds.Grillmaster_SunscreenToken_VAC_917t;
				case CardIds.Wanted:
					return CardIds.Coin;
				case CardIds.Waxadred:
					return CardIds.Waxadred_WaxadredsCandleToken;
				case CardIds.WeaselTunneler:
					return CardIds.WeaselTunneler;
				case CardIds.WhelpWrangler_WW_827:
					return CardIds.TakeToTheSkies_HappyWhelpToken_WW_816t;
				case CardIds.WhiteEyes:
					return CardIds.WhiteEyes_TheStormGuardianToken;
				case CardIds.WildGrowthCore:
					return CardIds.WildGrowth_ExcessManaLegacyToken;
				case CardIds.WildGrowthLegacy:
					return CardIds.WildGrowth_ExcessManaLegacyToken;
				case CardIds.WildGrowthVanilla:
					return CardIds.WildGrowth_ExcessManaLegacyToken;
				case CardIds.WitchwoodApple:
					return CardIds.WitchwoodApple_TreantToken;
				case CardIds.WitchwoodAppleCore:
					return CardIds.WitchwoodApple_TreantToken;
				case CardIds.WorkForTogwaggle_WorkForTogwaggleEnchantTavernBrawlEnchantment:
					return CardIds.TheCoinCore;
				case CardIds.Wrenchcalibur:
					return CardIds.SeaforiumBomber_BombToken;
				case CardIds.YoggSaronUnleashed_TentacleSwarmToken_YOG_516t3:
					return CardIds.ChaoticTendril_YOG_514;
				case CardIds.YseraUnleashed:
					return CardIds.YseraUnleashed_DreamPortalToken;
				case CardIds.Zaqul_TSC_959:
					return CardIds.SirakessCultist_AbyssalCurseToken;
				case CardIds.ZixorApexPredator:
					return CardIds.ZixorApexPredator_ZixorPrimeToken;
				case CardIds.FaldoreiStrider_CORE_LOOT_026:
					return CardIds.FaldoreiStrider_SpiderAmbush;
				case CardIds.SeabreezeChalice_VAC_520:
					return CardIds.SeabreezeChalice_SeabreezeChaliceToken_VAC_520t;
				case CardIds.SeabreezeChalice_SeabreezeChaliceToken_VAC_520t:
					return CardIds.SeabreezeChalice_SeabreezeChaliceToken_VAC_520t2;
				case CardIds.DivineBrew_VAC_916:
					return CardIds.DivineBrew_DivineBrewToken_VAC_916t2;
				case CardIds.DivineBrew_DivineBrewToken_VAC_916t2:
					return CardIds.DivineBrew_DivineBrewToken_VAC_916t3;
				case CardIds.NightshadeTea_VAC_404:
					return CardIds.NightshadeTea_NightshadeTeaToken_VAC_404t1;
				case CardIds.NightshadeTea_NightshadeTeaToken_VAC_404t1:
					return CardIds.NightshadeTea_NightshadeTeaToken_VAC_404t2;
				case CardIds.MaltedMagma_VAC_323:
					return CardIds.MaltedMagma_MaltedMagmaToken_VAC_323t;
				case CardIds.MaltedMagma_MaltedMagmaToken_VAC_323t:
					return CardIds.MaltedMagma_MaltedMagmaToken_VAC_323t2;
				case CardIds.CupOMuscle_VAC_338:
					return CardIds.CupOMuscle_CupOMuscleToken_VAC_338t;
				case CardIds.CupOMuscle_CupOMuscleToken_VAC_338t:
					return CardIds.CupOMuscle_CupOMuscleToken_VAC_338t2;
				case CardIds.HealthDrink_VAC_951:
					return CardIds.HealthDrink_HealthDrinkToken_VAC_951t;
				case CardIds.HealthDrink_HealthDrinkToken_VAC_951t:
					return CardIds.HealthDrink_HealthDrinkToken_VAC_951t2;
				case CardIds.AdaptiveAmalgam_VAC_958:
					return CardIds.AdaptiveAmalgam_VAC_958;
				case CardIds.Corpsicle_CorpsicleEnchantment_VAC_427e:
					return CardIds.Corpsicle_VAC_427;
				case CardIds.EternalFirebolt_EternalFireboltEnchantment_END_025e:
					return CardIds.EternalFirebolt_END_025;
				case CardIds.LineCook_VAC_337:
					return CardIds.LineCook_VAC_337;

				// Action targets
				case CardIds.BalefulBanker:
				case CardIds.CelestialProjectionist:
				case CardIds.DireFrenzy_CORE_GIL_828:
				case CardIds.DireFrenzy_GIL_828:
				case CardIds.DollmasterDorian:
				case CardIds.DragonBreeder:
				case CardIds.GangUp:
				case CardIds.HolyWater:
				case CardIds.LabRecruiter:
				case CardIds.ManicSoulcaster:
				case CardIds.MarkOfTheSpikeshell:
				case CardIds.PowerChordSynchronize:
				case CardIds.Recycle:
				case CardIds.Sathrovarr:
				case CardIds.Seance:
				case CardIds.Shadowcaster:
				case CardIds.Splintergraft:
				case CardIds.TogwagglesScheme:
				case CardIds.ZolaTheGorgon:
				case CardIds.ZolaTheGorgonCore:
				case CardIds.PuppetTheatre_MIS_919:
				case CardIds.Convert:
				case CardIds.Convert_WON_342:
					if (node.Parent?.Type === NodeType.Action) {
						const act = node.Parent.Object as Action;
						const target = gameState.CurrentEntities.get(act.Target);
						if (target) {
							return target.CardId;
						}
					}
					return null;

				case CardIds.BobTheBartender_BG31_BOB:
					if (subSpellInEffect?.Prefab === 'ReuseFX_Generic_SpawnToHand_GoldCoins_Super') {
						return CardIds.TheCoinCore;
					} else if (subSpellInEffect?.Parent?.Prefab === 'ReuseFX_Sneaky_Missile_Smoke_Sap_Super_WithIdle') {
						const targetEntityId = subSpellInEffect.Parent.Targets[0];
						const target = gameState.CurrentEntities.get(targetEntityId);
						if (target) {
							return target.CardId;
						}
					}
					return null;

				// Multiple known cards
				case CardIds.XortothBreakerOfStars_GDB_118:
					return Oracle.AddMultipleKnownCards(gameState, node, [
						CardIds.XortothBreakerOfStars_StarOfConclusionToken_GDB_118t2,
						CardIds.XortothBreakerOfStars_StarOfOriginationToken_GDB_118t,
					]);
				case CardIds.StellarBalance_EDR_874:
					return Oracle.AddMultipleKnownCards(gameState, node, [
						CardIds.MoonfireLegacy,
						CardIds.StarfireLegacy,
					]);
				case CardIds.TheReplicatorInator_MIS_025:
					return Oracle.AddMultipleKnownCards(gameState, node, [
						CardIds.TheReplicatorInator_TheReplicatorInatorMiniToken_MIS_025t,
						CardIds.TheReplicatorInator_TheReplicatorInatorToken_MIS_025t1,
					]);
				case CardIds.YseraTheDreamerCore:
				case CardIds.YseraTheDreamer_LEG_CS3_033:
					return Oracle.AddMultipleKnownCards(gameState, node, [
						CardIds.NightmareLegacy,
						CardIds.DreamLegacy,
						CardIds.LaughingSisterLegacy,
						CardIds.YseraAwakensLegacy,
						CardIds.EmeraldDrakeLegacy,
					]);
				case CardIds.PatchworkPals_TOY_353:
					return Oracle.AddMultipleKnownCards(gameState, node, [
						CardIds.HufferLegacy,
						CardIds.MishaLegacy,
						CardIds.LeokkLegacy,
					]);
				case CardIds.RivendareWarrider:
					return Oracle.AddMultipleKnownCards(gameState, node, [
						CardIds.RivendareWarrider_BlaumeuxFamineriderToken,
						CardIds.RivendareWarrider_KorthazzDeathriderToken,
						CardIds.RivendareWarrider_ZeliekConquestriderToken,
					]);
				case CardIds.FindTheImposter_SpymasterScabbsToken:
					return Oracle.AddMultipleKnownCards(gameState, node, [
						CardIds.FindTheImposter_SpyOMaticToken,
						CardIds.FindTheImposter_FizzflashDistractorToken,
						CardIds.FindTheImposter_HiddenGyrobladeToken,
						CardIds.UndercoverMoleToken,
						CardIds.FindTheImposter_NoggenFogGeneratorToken,
					]);
				case CardIds.MoonbeastTavernBrawlToken:
				case CardIds.KiriChosenOfElune:
				case CardIds.KiriChosenOfEluneCore:
					return Oracle.AddMultipleKnownCards(gameState, node, [CardIds.LunarEclipse, CardIds.SolarEclipse]);

				case CardIds.Triangulate_GDB_451:
					return Triangulate.PredictCardId(gameState, creatorCardId, creatorEntityId, node, stateFacade);
				case CardIds.RunicAdornment:
					return RunicAdornment.PredictCardId(gameState, creatorCardId, creatorEntityId, node, stateFacade);
				case CardIds.RazaTheResealed_TOY_383:
					return RazaTheResealed.PredictCardId(gameState, creatorCardId, creatorEntityId, node, stateFacade);
				case CardIds.Mimicry_EDR_522:
					return Mimicry.PredictCardId(gameState, createdEntityId ?? -1, creatorEntityId, node, stateFacade);
				case CardIds.DemonicProject:
					return DemonicProject.PredictCardId(
						gameState,
						createdEntityId ?? -1,
						creatorEntityId,
						node,
						stateFacade,
					);

				case CardIds.AugmentedElekk:
					if (node.Parent?.Parent?.Type === NodeType.Action) {
						const act = node.Parent.Parent.Object as Action;
						for (let i = act.Data.length - 1; i >= 0; i--) {
							if (act.Data[i] instanceof ShowEntity) {
								return (act.Data[i] as ShowEntity).CardId;
							}
							if (act.Data[i] instanceof FullEntity) {
								return (act.Data[i] as FullEntity).CardId;
							}
						}
						return null;
					}
					return null;

				case CardIds.ExpiredMerchant:
					if (node.Parent?.Type === NodeType.Action) {
						const act = node.Parent.Object as Action;
						const actionEntity = gameState.CurrentEntities.get(act.Entity);
						return actionEntity?.CardIdsToCreate?.[0] ?? null;
					}
					return null;

				case CardIds.FightOverMe:
					if (node.Parent?.Type === NodeType.Action) {
						const act = node.Parent.Object as Action;
						const actionEntity = gameState.CurrentEntities.get(act.Entity);
						if (actionEntity) {
							if (actionEntity.KnownEntityIds.length === 0) {
								const fightingEntities = act.Data.filter((d): d is TagChange => d instanceof TagChange)
									.filter((d) => d.Name === 1715)
									.map((d) => gameState.CurrentEntities.get(d.Entity))
									.filter((d): d is FullEntity => d != null)
									.filter((d) => d.IsInGraveyard());
								actionEntity.KnownEntityIds = fightingEntities.map((d) => d.Entity);
							}
							if (actionEntity.KnownEntityIds.length > 0) {
								const nextEntity = actionEntity.KnownEntityIds[0];
								actionEntity.KnownEntityIds.splice(0, 1);
								return gameState.CurrentEntities.get(nextEntity)?.CardId ?? null;
							}
						}
					}
					return null;

				case CardIds.X21Repairbot:
					if (node.Parent?.Type === NodeType.Action) {
						const act = node.Parent.Object as Action;
						if (creatorEntity) {
							if (creatorEntity.KnownEntityIds.length === 0) {
								creatorEntity.KnownEntityIds = act.Data.filter(
									(d): d is ShowEntity => d instanceof ShowEntity,
								)
									.filter((d) => d.GetTag(GameTag.CREATOR) === creatorEntityId)
									.map((d) => d.Entity);
							}
							if (creatorEntity.KnownEntityIds.length > 0) {
								const nextEntityId = creatorEntity.KnownEntityIds[0];
								creatorEntity.KnownEntityIds.splice(0, 1);
								return gameState.CurrentEntities.get(nextEntityId)?.CardId ?? null;
							}
						}
					}
					return null;

				case CardIds.SpiritOfTheDead:
					if (node.Parent?.Type === NodeType.Action) {
						const act = node.Parent.Object as Action;
						for (const data of act.Data) {
							if (data instanceof MetaData) {
								const info = (data as MetaData).MetaInfo[0];
								const targetId = info.Entity;
								if (gameState.CurrentEntities.has(targetId)) {
									return gameState.CurrentEntities.get(targetId)!.CardId;
								}
							}
						}
					}
					return null;

				case CardIds.ManaBind:
				case CardIds.AzeriteVein_WW_422:
				case CardIds.FrozenClone_CORE_ICC_082:
				case CardIds.FrozenClone_ICC_082:
					if (node.Parent?.Type === NodeType.Action && node.Parent.Parent?.Type === NodeType.Action) {
						const act = node.Parent.Parent.Object as Action;
						const existingEntity = gameState.CurrentEntities.get(act.Entity);
						return existingEntity?.CardId ?? null;
					}
					return null;

				case CardIds.Duplicate:
				case CardIds.CheatDeathCore:
				case CardIds.CheatDeath:
					if (node.Parent?.Type === NodeType.Action) {
						const act = node.Parent.Object as Action;
						if (act.Type === (BlockType.TRIGGER as number)) {
							const metaData = act.Data.filter((d): d is MetaData => d instanceof MetaData)
								.filter((d) => d.Meta === (MetaDataType.HISTORY_TARGET as number))
								.filter((d) => d.MetaInfo != null)
								.find((d) => d.MetaInfo.length > 0);
							if (metaData) {
								const entityId = metaData.MetaInfo[0].Entity;
								const existingEntity = gameState.CurrentEntities.get(entityId);
								return existingEntity?.CardId ?? null;
							}
						}
					}
					return null;

				case CardIds.PotionOfIllusion:
					if (node.Parent?.Type === NodeType.Action) {
						const act = node.Parent.Object as Action;
						const existingEntity = gameState.CurrentEntities.get(act.Entity);
						if (!existingEntity) {
							return null;
						}
						const controllerId = existingEntity.GetController();
						if (gameState.EntityIdsOnBoardWhenPlayingPotionOfIllusion) {
							const boardLeftToHandleForPlayer =
								gameState.EntityIdsOnBoardWhenPlayingPotionOfIllusion.get(controllerId);
							if (boardLeftToHandleForPlayer && boardLeftToHandleForPlayer.length > 0) {
								const entityToCopy = boardLeftToHandleForPlayer[0];
								boardLeftToHandleForPlayer.splice(0, 1);
								return entityToCopy.CardId;
							}
						}
					}
					return null;

				case CardIds.SuspiciousAlchemist_AMysteryEnchantment: {
					const enchantmentEntity = gameState.CurrentEntities.get(creatorEntityId);
					if (!enchantmentEntity) {
						return null;
					}
					const attachedToEntityId = enchantmentEntity.GetTag(GameTag.ATTACHED);
					const sourceEntity = gameState.CurrentEntities.get(attachedToEntityId);
					if (sourceEntity?.KnownEntityIds?.length && sourceEntity.KnownEntityIds.length > 0) {
						const nextEntity = sourceEntity.KnownEntityIds[0];
						sourceEntity.KnownEntityIds.splice(0, 1);
						return gameState.CurrentEntities.get(nextEntity)?.CardId ?? null;
					}
					return null;
				}

				case CardIds.CactusConstruct_WW_818:
					if (node.Parent?.Type === NodeType.Action) {
						const gsData = stateFacade?.GsState?.CurrentGame?.FilterGameData(Action)?.filter(
							(d): d is Action => d instanceof Action,
						);
						if (gsData && gsData.length > 0) {
							const reversed = [...gsData].reverse();
							const cactusAction = reversed[0];
							const entities = cactusAction.Data.filter(
								(d): d is ShowEntity => d instanceof ShowEntity,
							).filter(
								(d) =>
									d.GetZone() === (Zone.PLAY as number) &&
									d.GetCardType() !== (CardType.ENCHANTMENT as number),
							);
							return entities.length > 0 ? entities[entities.length - 1].CardId : null;
						}
					}
					return null;
			}
		}

		if (node.Parent != null && node.Parent.Type === NodeType.Action) {
			const action = node.Parent.Object as Action;

			if (action.Type === (BlockType.TRIGGER as number)) {
				const actionEntity = gameState.CurrentEntities.has(action.Entity)
					? gameState.CurrentEntities.get(action.Entity)!
					: null;

				if (actionEntity?.CardId === CardIds.SonyaWaterdancer_TOY_515) {
					if (node.Parent.Parent?.Type === NodeType.Action) {
						const initialAction = node.Parent.Parent.Object as Action;
						return gameState.CurrentEntities.get(initialAction.Entity)?.CardId ?? null;
					}
				}
				if (actionEntity?.CardId === CardIds.SonyaShadowdancer) {
					const entityId = action.Data.filter((d): d is MetaData => d instanceof MetaData)
						.flatMap((d) => d.MetaInfo)
						.map((i) => i.Id)
						.find(() => true);
					const entity = gameState.CurrentEntities.get(entityId ?? -1);
					return entity?.CardId ?? null;
				} else if (actionEntity?.CardId === CardIds.PrimalSabretooth_TLC_247) {
					const entityId = actionEntity.GetTag(GameTag.CARD_TARGET);
					const entity = gameState.CurrentEntities.get(entityId);
					return entity?.CardId ?? null;
				} else if (actionEntity?.CardId === CardIds.RatSensei_WON_013) {
					const options = [
						CardIds.RatSensei_MonkTurtleToken_WON_013t,
						CardIds.RatSensei_MonkTurtleToken_WON_013t2,
						CardIds.RatSensei_MonkTurtleToken_WON_013t3,
						CardIds.RatSensei_MonkTurtleToken_WON_013t4,
					];
					return options[Math.floor(Math.random() * options.length)];
				} else if (actionEntity?.CardId === CardIds.Kidnap_KidnappersSackToken) {
					const sackEntityId = actionEntity.Entity;
					const attachedEnchantment = Array.from(gameState.CurrentEntities.values()).find(
						(e) => e.GetTag(GameTag.ATTACHED) === sackEntityId,
					);
					const entityIdInSack = attachedEnchantment?.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_1);
					const entityInSack = gameState.CurrentEntities.get(entityIdInSack ?? -1);
					return entityInSack?.CardId ?? null;
				} else if (
					action.TriggerKeyword === (GameTag.DEATHRATTLE as number) &&
					actionEntity != null &&
					(actionEntity.CardId === CardIds.DeathBlossomWhomper ||
						actionEntity.CardId === CardIds.GemstoneHoarder_CATA_897)
				) {
					return Oracle.predictGemstoneHoarderOrDeathBlossomLinkedCardId(gameState, actionEntity);
				} else if (actionEntity?.CardId === CardIds.TwistReality_ChaoticShuffleCopyEnchantment_TTN_002t21e) {
					const entity = node.Type === NodeType.FullEntity ? (node.Object as FullEntity) : null;
					if (entity) {
						const copiedEntityId = entity.SubSpellInEffect?.Source ?? 0;
						const copiedEntity = gameState.CurrentEntities.get(copiedEntityId);
						return copiedEntity?.CardId ?? null;
					}
				} else if (
					actionEntity?.CardId === CardIds.ElixirOfVigor_ElixirOfVigorPlayerTavernBrawlEnchantment ||
					actionEntity?.CardId === CardIds.ElixirOfVigor_ElixirOfVigorPlayerEnchantment
				) {
					const entity = node.Type === NodeType.FullEntity ? (node.Object as FullEntity) : null;
					if (entity) {
						let playActionNode: Node | null = node;
						while (playActionNode != null) {
							playActionNode = playActionNode.Parent;
							if (!playActionNode || playActionNode.Type !== NodeType.Action) {
								continue;
							}
							const playAction = playActionNode.Object as Action;
							if (playAction.Type !== (BlockType.PLAY as number)) {
								continue;
							}
							const playedEntityId = playAction.Entity;
							const playedEntity = gameState.CurrentEntities.get(playedEntityId);
							return playedEntity?.CardId ?? null;
						}
					}
				} else if (
					actionEntity?.CardId === CardIds.Helya_PlightOfTheDeadEnchantment &&
					createdEntityId != null
				) {
					const actions = gameState.ParserState.CurrentGame.FilterGameData(Action)
						.filter((d): d is Action => d instanceof Action)
						.filter((d) => d.Type === (BlockType.TRIGGER as number));
					const reversed = [...actions].reverse();
					const allPlagueActions = reversed.filter((a) => Oracle.IsPlagueAction(a, gameState));
					if (allPlagueActions.length > 0) {
						const baseInternalParent = Oracle.GetTopInternalParentEntityId(allPlagueActions[0]);
						const plagueActions = allPlagueActions
							.filter(
								(a) => !a.Processed && Oracle.GetTopInternalParentEntityId(a) === baseInternalParent,
							)
							.reverse();
						if (plagueActions.length > 0) {
							const plagueAction = plagueActions[0];
							plagueAction.Processed = true;
							const plagueActionEntity = gameState.CurrentEntities.get(plagueAction?.Entity ?? -1);
							return plagueActionEntity?.CardId ?? null;
						}
					}
				} else if (
					actionEntity?.CardId === CardIds.VanessaVancleef_CORE_CS3_005 ||
					actionEntity?.CardId === CardIds.VanessaVancleefLegacy ||
					actionEntity?.CardId === CardIds.FateSplitter
				) {
					const vanessaControllerId = gameState.CurrentEntities.get(actionEntity.Entity)?.GetController();
					const playerIds = Array.from(gameState.CardsPlayedByPlayerEntityIdByTurn.keys());
					for (const playerId of playerIds) {
						if (playerId !== vanessaControllerId) {
							const cardsPlayedByOpponentByTurn =
								gameState.CardsPlayedByPlayerEntityIdByTurn.get(playerId);
							if (!cardsPlayedByOpponentByTurn || cardsPlayedByOpponentByTurn.size === 0) {
								return null;
							}
							const cardsPlayedByOpponent = Array.from(cardsPlayedByOpponentByTurn.values()).flat();
							if (cardsPlayedByOpponent.length === 0) {
								return null;
							}
							const lastCardPlayedByOpponentEntityId =
								cardsPlayedByOpponent[cardsPlayedByOpponent.length - 1];
							const lastCardPlayedByOpponent = gameState.CurrentEntities.get(
								lastCardPlayedByOpponentEntityId,
							);
							return lastCardPlayedByOpponent?.CardId ?? null;
						}
					}
				}

				// Tamsin Roana
				if (actionEntity != null && actionEntity.CardId === CardIds.TamsinRoame_BAR_918) {
					if (node.Parent.Parent != null && node.Parent.Parent.Type === NodeType.Action) {
						const playAction = node.Parent.Parent.Object as Action;
						if (playAction.Type === (BlockType.PLAY as number)) {
							const playedEntity = gameState.CurrentEntities.get(playAction.Entity);
							return playedEntity?.CardId ?? null;
						}
					}
				}

				// Keymaster Alabaster
				if (
					actionEntity != null &&
					gameState.LastCardDrawnEntityId > 0 &&
					actionEntity.CardId === CardIds.KeymasterAlabaster
				) {
					const lastDrawnEntity = gameState.CurrentEntities.get(gameState.LastCardDrawnEntityId);
					return lastDrawnEntity?.CardId ?? null;
				}

				// Plagiarize
				if (
					action.TriggerKeyword === (GameTag.SECRET as number) &&
					actionEntity != null &&
					actionEntity.KnownEntityIds.length > 0 &&
					(actionEntity.CardId === CardIds.PlagiarizeCore || actionEntity.CardId === CardIds.Plagiarize)
				) {
					const plagiarizeController = actionEntity.GetEffectiveController();
					const entitiesPlayedByActivePlayer = actionEntity.KnownEntityIds.map((entityId) =>
						gameState.CurrentEntities.get(entityId),
					).filter(
						(card): card is FullEntity =>
							card != null &&
							card.GetEffectiveController() !== -1 &&
							card.GetEffectiveController() !== plagiarizeController,
					);
					if (entitiesPlayedByActivePlayer.length === 0) {
						return null;
					}
					const nextCardToCreatePlagia = entitiesPlayedByActivePlayer[0].CardId;
					const idx = actionEntity.KnownEntityIds.indexOf(entitiesPlayedByActivePlayer[0].Entity);
					if (idx !== -1) {
						actionEntity.KnownEntityIds.splice(idx, 1);
					}
					return nextCardToCreatePlagia;
				}

				// Diligent Notetaker
				if (
					action.TriggerKeyword === (GameTag.SPELLBURST as number) &&
					actionEntity != null &&
					gameState.LastCardPlayedEntityId > 0 &&
					actionEntity.CardId === CardIds.DiligentNotetaker
				) {
					const lastPlayedEntity = gameState.CurrentEntities.get(gameState.LastCardPlayedEntityId);
					return lastPlayedEntity?.CardId ?? null;
				}

				// Felsoul Jailer
				if (
					(actionEntity?.CardId === CardIds.FelsoulJailer ||
						actionEntity?.CardId === CardIds.FelsoulJailerLegacy) &&
					actionEntity.CardIdsToCreate.length > 0
				) {
					const result = actionEntity.CardIdsToCreate[0];
					actionEntity.CardIdsToCreate.splice(0, 1);
					return result;
				}

				// Nellie
				if (
					actionEntity != null &&
					actionEntity.CardId === CardIds.NellieTheGreatThresher_NelliesPirateShipToken &&
					action.TriggerKeyword === (GameTag.DEATHRATTLE as number)
				) {
					const pirateShipEntity = gameState.CurrentEntities.get(creatorEntityId);
					const nellieEntity = gameState.CurrentEntities.get(pirateShipEntity?.GetTag(GameTag.CREATOR) ?? -1);
					if (pirateShipEntity && pirateShipEntity.KnownEntityIds.length === 0) {
						const crewmates = Array.from(gameState.CurrentEntities.values())
							.filter((entity) => entity.GetTag(GameTag.CREATOR) === nellieEntity?.Entity)
							.filter(
								(entity) => entity.CardId !== CardIds.NellieTheGreatThresher_NelliesPirateShipToken,
							);
						pirateShipEntity.KnownEntityIds = crewmates.map((entity) => entity.Entity);
					}
					if (pirateShipEntity && pirateShipEntity.KnownEntityIds.length > 0) {
						const entities = pirateShipEntity.KnownEntityIds.map((entityId) =>
							gameState.CurrentEntities.get(entityId),
						);
						const nextCard = entities[0]?.CardId ?? null;
						pirateShipEntity.KnownEntityIds.splice(0, 1);
						return nextCard;
					}
					return null;
				}

				// Ice Trap
				if (
					actionEntity != null &&
					(actionEntity.CardId === CardIds.IceTrap ||
						actionEntity.CardId === CardIds.IceTrap_CORE_AV_226 ||
						actionEntity.CardId === CardIds.BeaststalkerTavish_ImprovedIceTrapToken) &&
					action.TriggerKeyword === (GameTag.SECRET as number)
				) {
					const candidateEntityIds = action.Data.filter((d): d is MetaData => d instanceof MetaData)
						.filter((m) => m.Meta === (MetaDataType.TARGET as number))
						.flatMap((m) => m.MetaInfo)
						.map((info) => info.Entity);
					if (candidateEntityIds.length !== 1) {
						Logger.Log(
							"WARN: could not determine with full accuracy Ice Trap's target",
							candidateEntityIds.length,
						);
					}
					if (candidateEntityIds.length === 0) {
						return null;
					}
					return gameState.CurrentEntities.get(candidateEntityIds[0])?.CardId ?? null;
				}

				// Getaway Kodo
				if (
					actionEntity != null &&
					actionEntity.CardId === CardIds.GetawayKodo &&
					action.TriggerKeyword === (GameTag.SECRET as number)
				) {
					const candidateEntityIds = action.Data.filter((d): d is MetaData => d instanceof MetaData)
						.filter((m) => m.Meta === (MetaDataType.HISTORY_TARGET as number))
						.flatMap((m) => m.MetaInfo)
						.map((info) => info.Entity);
					if (candidateEntityIds.length !== 1) {
						Logger.Log(
							"WARN: could not determine with full accuracy Getaway Kodo's target",
							candidateEntityIds.length,
						);
					}
					if (candidateEntityIds.length === 0) {
						return null;
					}
					return gameState.CurrentEntities.get(candidateEntityIds[0])?.CardId ?? null;
				}

				// Flesh Behemoth
				if (
					actionEntity != null &&
					(actionEntity.CardId === CardIds.IceTrap ||
						actionEntity.CardId === CardIds.FleshBehemoth_RLK_830) &&
					action.TriggerKeyword === (GameTag.DEATHRATTLE as number)
				) {
					const candidateEntityIds = Array.from(
						(stateFacade?.GsState?.GameState?.CurrentEntities ?? new Map()).values(),
					)
						.filter((e) => e.GetTag(GameTag.CREATOR) === actionEntity.Entity)
						.filter((e) => e.IsInPlay())
						.filter((e) => e.IsMinionLike())
						.map((e) => e.Entity);
					if (candidateEntityIds.length !== 1) {
						Logger.Log(
							"WARN: could not determine with full accuracy Flesh Behemoth's target",
							candidateEntityIds.length,
						);
					}
					if (candidateEntityIds.length === 0) {
						return null;
					}
					return stateFacade?.GsState?.GameState?.CurrentEntities?.get(candidateEntityIds[0])?.CardId ?? null;
				}
			}

			if (action.Type === (BlockType.POWER as number)) {
				const actionEntity = gameState.CurrentEntities.get(action.Entity);
				if (!actionEntity) {
					return null;
				}

				if (actionEntity.CardId === CardIds.TheExodar_GDB_120) {
					const tagChangeEntities = action.Data.filter((d): d is TagChange => d instanceof TagChange)
						.filter((t) => t.Name === (GameTag.PARENT_CARD as number) && t.Value === 0)
						.map((t) => gameState.CurrentEntities.get(t.Entity))
						.filter((e): e is FullEntity => e != null && e.IsStarshipPiece())
						.map((e) => e.CardId);
					if (tagChangeEntities.length === 0) {
						return null;
					}
					if (actionEntity.CardIdsToCreate.length === 0) {
						actionEntity.CardIdsToCreate = tagChangeEntities;
					}
					if (actionEntity.CardIdsToCreate.length > 0) {
						const cardId = actionEntity.CardIdsToCreate[0];
						actionEntity.CardIdsToCreate.splice(0, 1);
						return cardId;
					}
				}

				if (actionEntity.CardId === CardIds.SymphonyOfSins) {
					const previousChange = action.Data.filter((d): d is TagChange => d instanceof TagChange).filter(
						(t) => t.Name === (GameTag.ZONE as number) && t.Value === (Zone.SETASIDE as number),
					);
					const last = previousChange.length > 0 ? previousChange[previousChange.length - 1] : null;
					return gameState.CurrentEntities.get(last?.Entity ?? -1)?.CardId ?? null;
				}

				if (actionEntity.CardId === CardIds.ShatteredReflections_DEEP_025) {
					const candidate = action.Data.filter((d): d is FullEntity => d instanceof FullEntity).find(
						(e) => e.CardId != null && e.CardId.length > 0,
					);
					return candidate?.CardId ?? null;
				}

				if (actionEntity.CardId === CardIds.Griftah) {
					const candidates = action.Data.filter((d): d is FullEntity => d instanceof FullEntity)
						.map((d) => gameState.CurrentEntities.get(d.Entity))
						.filter(
							(e) => e != null && (e.Tags.find((t) => t.Name === 2509)?.Value ?? 0) !== 1,
						) as FullEntity[];
					const candidateCardIds = candidates.map((e) => e.CardId);
					for (const cardId of candidateCardIds) {
						const totalCardIds = candidateCardIds.filter((c) => c === cardId).length;
						if (totalCardIds === 1) {
							return cardId;
						}
					}
					return null;
				}

				if (actionEntity.CardId === CardIds.PowerOfCreation) {
					if (stateFacade) {
						const found = Array.from(
							(stateFacade.GsState?.GameState?.CurrentEntities ?? new Map()).values(),
						)
							.filter((d) => d.GetTag(GameTag.CREATOR) === actionEntity.Entity)
							.find((d) => d.IsInPlay());
						return found?.CardId ?? null;
					}
					return null;
				}

				if (actionEntity.CardId === CardIds.DevouringSwarm) {
					if (actionEntity.CardIdsToCreate.length === 0) {
						const controller = actionEntity.GetController();
						const deathBlock = action.Data.filter((d): d is Action => d instanceof Action).find(
							(a) => a.Type === (BlockType.DEATHS as number),
						);
						if (deathBlock) {
							const deadEntities = deathBlock.Data.filter((d): d is TagChange => d instanceof TagChange)
								.filter(
									(tag) =>
										tag.Name === (GameTag.ZONE as number) &&
										tag.Value === (Zone.GRAVEYARD as number),
								)
								.map((tag) => gameState.CurrentEntities.get(tag.Entity))
								.filter(
									(entity): entity is FullEntity =>
										entity != null && entity.GetController() === controller,
								);
							actionEntity.CardIdsToCreate = deadEntities.map((entity) => entity.CardId);
						}
					}
					if (actionEntity.CardIdsToCreate.length > 0) {
						const cardId = actionEntity.CardIdsToCreate[0];
						actionEntity.CardIdsToCreate.splice(0, 1);
						return cardId;
					}
				} else if (actionEntity.CardId === CardIds.ArchivistElysiana) {
					const lastTagChange = action.Data.filter((d): d is TagChange => d instanceof TagChange).filter(
						(tag) => tag.Name === (GameTag.ZONE as number) && tag.Value === (Zone.DECK as number),
					);
					const last = lastTagChange.length > 0 ? lastTagChange[lastTagChange.length - 1] : null;
					if (last) {
						return gameState.CurrentEntities.get(last.Entity)?.CardId ?? null;
					}
				} else if (actionEntity.CardId === CardIds.Kazakusan_ONY_005) {
					const lastTagChange = action.Data.filter((d): d is TagChange => d instanceof TagChange).filter(
						(tag) => tag.Name === (GameTag.ZONE as number) && tag.Value === (Zone.DECK as number),
					);
					const last = lastTagChange.length > 0 ? lastTagChange[lastTagChange.length - 1] : null;
					if (last) {
						return gameState.CurrentEntities.get(last.Entity)?.CardId ?? null;
					}
				} else if (actionEntity.CardId === CardIds.SouthseaScoundrel_BAR_081) {
					const cardDrawn = action.Data.filter((d): d is TagChange => d instanceof TagChange)
						.filter((tag) => tag.Name === (GameTag.ZONE as number) && tag.Value === (Zone.HAND as number))
						.find(
							(tag) =>
								gameState.CurrentEntities.has(tag.Entity) &&
								(gameState.CurrentEntities.get(tag.Entity)!.CardId?.length ?? 0) > 0,
						);
					return cardDrawn ? (gameState.CurrentEntities.get(cardDrawn.Entity)?.CardId ?? null) : null;
				} else if (
					actionEntity.CardId === CardIds.VanessaVancleef_CORE_CS3_005 ||
					actionEntity.CardId === CardIds.VanessaVancleefLegacy ||
					actionEntity.CardId === CardIds.FateSplitter
				) {
					const vanessaControllerId = gameState.CurrentEntities.get(actionEntity.Entity)?.GetController();
					const playerIds = Array.from(gameState.CardsPlayedByPlayerEntityIdByTurn.keys());
					for (const playerId of playerIds) {
						if (playerId !== vanessaControllerId) {
							const cardsPlayedByOpponentByTurn =
								gameState.CardsPlayedByPlayerEntityIdByTurn.get(playerId);
							if (!cardsPlayedByOpponentByTurn || cardsPlayedByOpponentByTurn.size === 0) {
								return null;
							}
							const cardsPlayedByOpponent = Array.from(cardsPlayedByOpponentByTurn.values()).flat();
							if (cardsPlayedByOpponent.length === 0) {
								return null;
							}
							const lastCardPlayedByOpponentEntityId =
								cardsPlayedByOpponent[cardsPlayedByOpponent.length - 1];
							const lastCardPlayedByOpponent = gameState.CurrentEntities.get(
								lastCardPlayedByOpponentEntityId,
							);
							return lastCardPlayedByOpponent?.CardId ?? null;
						}
					}
				} else if (actionEntity.CardId === CardIds.AceInTheHoleTavernBrawlToken) {
					const actionControllerId = actionEntity.GetController();
					if (actionEntity.KnownEntityIds.length === 0) {
						const cardsPlayedByPlayerByTurn =
							gameState.CardsPlayedByPlayerEntityIdByTurn.get(actionControllerId);
						if (!cardsPlayedByPlayerByTurn || cardsPlayedByPlayerByTurn.size === 0) {
							return null;
						}
						const lastTurn = (gameState.GetGameEntity()?.GetTag(GameTag.TURN) ?? 0) - 2;
						if (!cardsPlayedByPlayerByTurn.has(lastTurn)) {
							return null;
						}
						const cardsPlayedLastTurn = cardsPlayedByPlayerByTurn.get(lastTurn)!;
						if (cardsPlayedLastTurn.length === 0) {
							return null;
						}
						actionEntity.KnownEntityIds = [...cardsPlayedLastTurn];
					}
					if (actionEntity.KnownEntityIds.length > 0) {
						const entities = actionEntity.KnownEntityIds.map((entityId) =>
							gameState.CurrentEntities.get(entityId),
						);
						const nextCard = entities[0]?.CardId ?? null;
						const entityToRemove = entities[0]?.Entity;
						if (entityToRemove != null) {
							const idx = actionEntity.KnownEntityIds.indexOf(entityToRemove);
							if (idx !== -1) {
								actionEntity.KnownEntityIds.splice(idx, 1);
							}
						}
						return nextCard;
					}
				} else if (actionEntity.CardId === CardIds.PhotographerFizzle_FizzlesSnapshotToken) {
					if (actionEntity?.KnownEntityIds?.length && actionEntity.KnownEntityIds.length > 0) {
						const nextEntity = actionEntity.KnownEntityIds[0];
						actionEntity.KnownEntityIds.splice(0, 1);
						return gameState.CurrentEntities.get(nextEntity)?.CardId ?? null;
					}
					return null;
				} else if (actionEntity.CardId === CardIds.CommanderSivara_TSC_087) {
					if (actionEntity.PlayedWhileInHand.length > 0) {
						const spells = actionEntity.PlayedWhileInHand.map((entityId) =>
							gameState.CurrentEntities.get(entityId),
						).filter((entity): entity is FullEntity => entity != null && entity.IsSpell());
						if (spells.length > 0) {
							const firstSpellEntity = spells[0];
							const idx = actionEntity.PlayedWhileInHand.indexOf(firstSpellEntity.Entity);
							if (idx !== -1) {
								actionEntity.PlayedWhileInHand.splice(idx, 1);
							}
							return firstSpellEntity.CardId;
						}
					}
				} else if (actionEntity.CardId === CardIds.ColdStorage) {
					const targetEntityId = action.Data.filter((d): d is MetaData => d instanceof MetaData)
						.filter((meta) => meta.Meta === (MetaDataType.TARGET as number))
						.flatMap((meta) => meta.MetaInfo)
						.filter((info) => info != null)
						.map((info) => info.Entity)
						.find(() => true);
					return targetEntityId != null
						? (gameState.CurrentEntities.get(targetEntityId)?.CardId ?? null)
						: null;
				} else if (actionEntity.CardId === CardIds.ConquerorsBanner && node.Type === NodeType.TagChange) {
					const tagChange = node.Object as TagChange;
					const nodeElement = action.Data.filter((d): d is TagChange => d instanceof TagChange).find(
						(t) =>
							t.Entity === tagChange.Entity && t.Name === tagChange.Name && t.Value === tagChange.Value,
					);
					const nodeIndex = action.Data.indexOf(nodeElement!);
					const joustAction = action.Data.slice(0, nodeIndex)
						.filter((d): d is Action => d instanceof Action)
						.filter((a) => a.Index < node.Index)
						.filter((a) => a.Type === (BlockType.JOUST as number))
						.reverse()
						.find(() => true);
					const lastJoust = joustAction?.Data.filter((d): d is MetaData => d instanceof MetaData)
						.filter((d) => d.Meta === (MetaDataType.JOUST as number))
						.reverse()
						.find(() => true);
					if (lastJoust && gameState.CurrentEntities.has(lastJoust.Data)) {
						const pickedEntity = gameState.CurrentEntities.get(lastJoust.Data);
						return pickedEntity?.CardId ?? null;
					}
				} else if (
					actionEntity.CardId === CardIds.DeathBlossomWhomper ||
					actionEntity.CardId === CardIds.GemstoneHoarder_CATA_897
				) {
					return Oracle.predictGemstoneHoarderOrDeathBlossomLinkedCardId(gameState, actionEntity);
				}
			}
		}

		// Libram spawn-to-hand (empty CardID until linked entity resolves)
		if (node.Type === NodeType.FullEntity) {
			const prefab = (node.Object as FullEntity).SubSpellInEffect?.Prefab;
			if (prefab === 'Librams_SpawnToHand_Book') {
				return CardIds.LibramOfWisdom_BT_025;
			}
			if (prefab === 'BTFX_Librams_SpawnToHand_HolyLight_Book') {
				return CardIds.LibramOfDivinity_GDB_138;
			}
		}

		return null;
	}

	static PredictSecret(
		gameState: GameState,
		creatorCardId: string,
		creatorEntityId: number,
		node: Node,
		inputCardId: string | null = null,
		stateFacade: StateFacade | null = null,
		createdEntityId: number | null = null,
	): string | null {
		if (inputCardId && inputCardId.length > 0) {
			return inputCardId;
		}

		if (node.Parent != null && node.Parent.Type === NodeType.Action) {
			const action = node.Parent.Object as Action;
			if (action.Type === (BlockType.POWER as number)) {
				const actionEntity = gameState.CurrentEntities.get(action.Entity);
				if (!actionEntity) {
					return null;
				}

				if (actionEntity.CardId === CardIds.FacelessEnigma_TIME_860) {
					const actionControllerId = actionEntity.GetController();
					if (actionEntity.KnownEntityIds.length === 0) {
						const allSecrets = action.Data.filter((e): e is FullEntity => e instanceof FullEntity)
							.filter((e) => e.GetController() === actionControllerId)
							.filter((e) => e.GetTag(GameTag.SECRET) === 1);
						actionEntity.KnownEntityIds = allSecrets.map((e) => e.Entity);
					}

					if (actionEntity.KnownEntityIds.length > 0) {
						const currentSecretCardIds = Array.from(gameState.CurrentEntities.values())
							.filter((e) => e.GetController() === actionControllerId)
							.filter((e) => e.GetZone() === (Zone.SECRET as number))
							.filter((e) => e.GetTag(GameTag.SECRET) === 1)
							.sort((a, b) => a.GetTag(GameTag.ZONE_POSITION) - b.GetTag(GameTag.ZONE_POSITION))
							.map((e) => e.CardId);
						const entities = actionEntity.KnownEntityIds.map((entityId) =>
							gameState.CurrentEntities.get(entityId),
						).filter((e): e is FullEntity => e != null && !currentSecretCardIds.includes(e.CardId));
						if (entities.length === 0) {
							return null;
						}
						const nextCard = entities[0].CardId;
						const idx = actionEntity.KnownEntityIds.indexOf(entities[0].Entity);
						if (idx !== -1) {
							actionEntity.KnownEntityIds.splice(idx, 1);
						}
						return nextCard;
					}
				}

				if (actionEntity.CardId === CardIds.HordeOperative) {
					const actionControllerId = actionEntity.GetController();
					if (actionEntity.KnownEntityIds.length === 0) {
						const allOpponentSecrets = Array.from(gameState.CurrentEntities.values())
							.filter((e) => e.GetController() !== actionControllerId)
							.filter((e) => e.GetZone() === (Zone.SECRET as number))
							.filter((e) => e.GetTag(GameTag.SECRET) === 1)
							.sort((a, b) => a.GetTag(GameTag.ZONE_POSITION) - b.GetTag(GameTag.ZONE_POSITION));
						actionEntity.KnownEntityIds = allOpponentSecrets.map((e) => e.Entity);
					}

					if (actionEntity.KnownEntityIds.length > 0) {
						const currentSecretCardIds = Array.from(gameState.CurrentEntities.values())
							.filter((e) => e.GetController() === actionControllerId)
							.filter((e) => e.GetZone() === (Zone.SECRET as number))
							.filter((e) => e.GetTag(GameTag.SECRET) === 1)
							.sort((a, b) => a.GetTag(GameTag.ZONE_POSITION) - b.GetTag(GameTag.ZONE_POSITION))
							.map((e) => e.CardId);
						const entities = actionEntity.KnownEntityIds.map((entityId) =>
							gameState.CurrentEntities.get(entityId),
						).filter((e): e is FullEntity => e != null && !currentSecretCardIds.includes(e.CardId));
						const nextCard = entities[0].CardId;
						const idx = actionEntity.KnownEntityIds.indexOf(entities[0].Entity);
						if (idx !== -1) {
							actionEntity.KnownEntityIds.splice(idx, 1);
						}
						return nextCard;
					}
				}
			}
		}

		return null;
	}

	private static GetTopInternalParentEntityId(action: Action): number {
		let baseEntity = action.Entity;
		let current: GameData = action;
		while (current.InternalParent != null) {
			current = current.InternalParent;
			if (!(current instanceof Action)) {
				continue;
			}
			const currentAction = current as Action;
			if (currentAction.InternalParent != null && currentAction.Entity > 0) {
				baseEntity = currentAction.Entity;
			}
		}
		return baseEntity;
	}

	private static AddMultipleKnownCards(gameState: GameState, node: Node, cardsList: string[]): string | null {
		if (node.Parent?.Type === NodeType.Action) {
			const act = node.Parent.Object as Action;
			const existingEntity = gameState.CurrentEntities.get(act.Entity);
			if (!existingEntity) {
				return null;
			}

			let cardsLeft = existingEntity.CardIdsToCreate;
			if (cardsLeft.length === 0) {
				cardsLeft = [...cardsList];
				existingEntity.CardIdsToCreate = cardsLeft;
			}
			const cardId = cardsLeft[0];
			cardsLeft.splice(0, 1);
			return cardId;
		}
		return null;
	}

	static GetBuffCardId(creatorEntityId: number, creatorCardId: string | null | undefined): string | null {
		switch (creatorCardId) {
			case CardIds.TamsinRoame_BAR_918:
				return CardIds.TamsinRoame_GatheredShadowsEnchantment;
			default:
				return null;
		}
	}

	static GetBuffingCardCardId(creatorEntityId: number, creatorCardId: string | null | undefined): string | null {
		switch (creatorCardId) {
			case CardIds.TamsinRoame_BAR_918:
				return creatorCardId;
			default:
				return null;
		}
	}

	private static IsPlagueAction(action: Action, gameState: GameState): boolean {
		const entityId = action.Entity;
		const entity = gameState.CurrentEntities.get(entityId);
		const cardId = entity?.CardId;
		return cardId != null && Oracle.PLAGUES.includes(cardId);
	}

	private static IsPlightOfTheDeadAction(action: Action, gameState: GameState): boolean {
		const entityId = action.Entity;
		const entity = gameState.CurrentEntities.get(entityId);
		const cardId = entity?.CardId;
		return cardId === CardIds.Helya_PlightOfTheDeadEnchantment;
	}

	private static BuildLastPlagueActions(actions: Action[], gameState: GameState): Action[] {
		let startIndex = 0;
		while (startIndex < actions.length && Oracle.IsPlightOfTheDeadAction(actions[startIndex], gameState)) {
			startIndex++;
		}
		const beforeEnchantments = actions.slice(startIndex);

		const plagueActions: Action[] = [];
		for (const action of beforeEnchantments) {
			if (action.InternalParent == null) {
				break;
			}
			if (Oracle.IsPlagueAction(action, gameState)) {
				plagueActions.push(action);
			}
		}
		return plagueActions;
	}

	private static ContainsFullEntityCreation(action: Action, entityId: number): boolean {
		return action.Data.filter((d): d is FullEntity => d instanceof FullEntity).some((f) => f.Entity === entityId);
	}
}
