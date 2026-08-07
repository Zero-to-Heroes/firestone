import { CardIds, CardType, GameTag, Zone } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { TimewarpedNelliesShip } from '../cards/timewarped-nellies-ship';
import { GameEventProvider } from '../game-event';
import { FullEntity, Node, NodeType, ShowEntity, Tag } from '../models';
import { TagChange } from '../models/tag';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';
import { BattlegroundsStartOfBattleLegacySnapshot } from './battlegrounds-start-of-battle-legacy-snapshot';
import { BgsUtils } from './utils/bgs-utils';

export interface PlayerBoard {
	Hero: FullEntity | null;
	HeroPowers: BgsHeroPower[];
	HeroPowerCardId: string | null;
	HeroPowerEntityId: number;
	HeroPowerUsed: boolean;
	HeroPowerInfo: any;
	HeroPowerInfo2: number;
	HeroPowerCreatedEntity: string | null;
	CardId: string | null;
	PlayerId: number;
	PlayerEntityId: number;
	QuestEntities: QuestEntity[];
	QuestRewards: string[];
	QuestRewardEntities: QuestReward[];
	Board: BgsPlayerBoardEntity[];
	Secrets: FullEntity[];
	Hand: BgsPlayerBoardEntity[];
	Trinkets: TrinketEntity[];
	GlobalInfo: BgsPlayerGlobalInfo;
}

export interface BgsHeroPower {
	CardId: string | null;
	EntityId: number;
	Used: boolean;
	Info: any;
	Info2: number;
	Info3: number;
	Info4: number;
	Info5: number;
	Info6: number;
	ScoreValue1: number;
	ScoreValue2: number;
	ScoreValue3: number;
	Locked: number;
	CreatedEntity: string | null;
}

export interface BgsPlayerBoardEntity {
	CardId: string;
	Entity: number;
	Id: number;
	Tags: Tag[];
	TimeStamp: string;
	Enchantments: Enchantment[];
	DynamicInfo: any[];
}

export interface BgsPlayerGlobalInfo {
	EternalKnightsDeadThisGame: number;
	EternalKnightAttackBuff: number;
	EternalKnightHealthBuff: number;
	TavernSpellsCastThisGame: number;
	TastyLobstersBuff: number;
	SpellsCastThisGame: number;
	PiratesPlayedThisGame: number;
	PiratesSummonedThisGame: number;
	BeastsSummonedThisGame: number;
	UndeadAttackBonus: number;
	UndeadHealthBonus: number;
	HauntedCarapaceAttackBonus: number;
	HauntedCarapaceHealthBonus: number;
	FrostlingBonus: number;
	AstralAutomatonsSummonedThisGame: number;
	BloodGemAttackBonus: number;
	BloodGemHealthBonus: number;
	ChoralHealthBuff: number;
	ChoralAttackBuff: number;
	BeetleAttackBuff: number;
	BeetleHealthBuff: number;
	ElementalHealthBuff: number;
	ElementalAttackBuff: number;
	TavernSpellHealthBuff: number;
	TavernSpellAttackBuff: number;
	BattlecriesTriggeredThisGame: number;
	FriendlyMinionsDeadLastCombat: number;
	MagnetizedThisGame: number;
	SanlaynScribesDeadThisGame: number;
	GoldSpentThisGame: number;
	GoldenMinionsPlayedThisGame: number;
	GoldrinnBuffAtk: number;
	GoldrinnBuffHealth: number;
	DeepBluesPlayed: number;
	VolumizerAttackBuff: number;
	VolumizerHealthBuff: number;
	WhelpAttackBuff: number;
	WhelpHealthBuff: number;
	DeathrattlesTriggeredThisGame: number;
	TavernSpellsCastThisTurn: number;
	MrrgltonsPlayedThisGame: number;
	CardsPlayedThisTurn: number;
	BackToBackCastThisGame: number;
}

export interface QuestReward {
	CardId: string;
	AvengeCurrent: number;
	AvengeDefault: number;
	ScriptDataNum1: number;
}

export interface QuestEntity {
	CardId: string;
	RewardDbfId: number;
	ProgressCurrent: number;
	ProgressTotal: number;
}

export interface TrinketEntity {
	cardId: string;
	entityId: number;
	scriptDataNum1: number;
	scriptDataNum2: number;
	scriptDataNum6: number;
	tags: {
		[key in GameTag]?: number;
	};
}

export interface Enchantment {
	EntityId: number;
	CardId: string;
	TagScriptDataNum1: number;
	TagScriptDataNum2: number;
}

export class BattlegroundsPlayerBoardParser implements ActionParser {
	readonly ParserName = 'BattlegroundsPlayerBoardParser';

	private GameState: GameState;
	private ParserState: ParserState;
	private StateFacade: StateFacade;
	private Snapshot: BattlegroundsStartOfBattleLegacySnapshot;

	private static IsGSReadyForBattle = false;
	private static IsPTLReadyForBattle = false;

	constructor(parserState: ParserState, stateFacade: StateFacade) {
		this.ParserState = parserState;
		this.GameState = parserState.GameState;
		this.StateFacade = stateFacade;
		this.Snapshot = new BattlegroundsStartOfBattleLegacySnapshot(parserState, stateFacade);
	}

	AppliesOnNewNode(node: Node, stateType: StateType): boolean {
		return this.IsApplyOnNewNode(node, stateType);
	}

	IsApplyOnNewNode(node: Node, stateType: StateType): boolean {
		if (this.StateFacade.IsBattlegrounds() || this.StateFacade.IsBattlegroundsDuos()) {
			return (
				stateType === StateType.PowerTaskList &&
				node.Type === NodeType.TagChange &&
				(node.Object as TagChange).Name === (GameTag.BG_BATTLE_STARTING as number) &&
				(node.Object as TagChange).Value === 0
			);
		}
		return false;
	}

	AppliesOnCloseNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		BattlegroundsPlayerBoardParser.IsPTLReadyForBattle = false;
		BattlegroundsPlayerBoardParser.IsGSReadyForBattle = false;
		console.debug('Starting to build player boards', node.CreationLogLine);
		const tagChange = node.Object as TagChange;
		const opponent = this.StateFacade.OpponentPlayer!;
		const player = this.StateFacade.LocalPlayer!;

		const playerBoard = BattlegroundsPlayerBoardParser.CreateProviderFromAction(
			player.PlayerId,
			player.Id,
			false,
			player,
			this.GameState,
			this.StateFacade,
		);
		const opponentBoard = BattlegroundsPlayerBoardParser.CreateProviderFromAction(
			opponent.PlayerId,
			opponent.Id,
			true,
			player,
			this.GameState,
			this.StateFacade,
		);

		this.GameState.BgsHasSentNextOpponent = false;
		console.debug('Player boards built', '');

		return [
			GameEventProvider.Create(
				tagChange.TimeStamp,
				'BATTLEGROUNDS_PLAYER_BOARD',
				() => {
					console.debug(
						'Providing player board events ' + tagChange.TimeStamp + ' ' + node.CreationLogLine,
						`player: ${playerBoard?.Board?.map((e) => e.CardId).join("'") ?? ''} ` +
							`opponent: ${opponentBoard?.Board?.map((e) => e.CardId).join("'") ?? ''}`,
					);
					return {
						Type: 'BATTLEGROUNDS_PLAYER_BOARD',
						Value: {
							PlayerBoard: playerBoard,
							OpponentBoard: opponentBoard,
						},
					};
				},
				true,
				node,
			),
		];
	}

	CreateGameEventProviderFromClose(_node: Node): GameEventProvider[] | null {
		return null;
	}

	static CreateProviderFromAction(
		playerPlayerId: number,
		playerEntityId: number,
		isOpponent: boolean,
		_mainPlayer: any,
		gameState: GameState,
		stateFacade: StateFacade,
	): PlayerBoard | null {
		if (isOpponent) {
			console.debug(
				`Building opponent board for playerPlayerId=${playerPlayerId}, playerEntityId=${playerEntityId}`,
				'',
			);
		}

		const currentEntities = [...gameState.CurrentEntities.values()];

		const potentialHeroes = currentEntities.filter(
			(entity) =>
				entity.GetTag(GameTag.CARDTYPE) === (CardType.HERO as number) &&
				entity.GetTag(GameTag.ZONE) === (Zone.PLAY as number) &&
				entity.GetEffectiveController() === playerPlayerId &&
				!entity.IsBaconBartender() &&
				!entity.IsBaconEnchantment(),
		);

		let hero = potentialHeroes.length > 0 ? potentialHeroes[potentialHeroes.length - 1]?.Clone() : null;
		let cardId = hero?.CardId ?? null;
		let playerId = hero?.GetTag(GameTag.PLAYER_ID) ?? playerPlayerId;

		if (BgsUtils.IsBaconGhost(cardId ?? '') || (hero?.IsBaconBartender() ?? false)) {
			const heroesForTargetPlayerId = currentEntities.filter(
				(entity) =>
					entity.GetTag(GameTag.CARDTYPE) === (CardType.HERO as number) &&
					entity.GetTag(GameTag.PLAYER_ID) === playerId &&
					!entity.IsBaconBartender() &&
					!entity.IsBaconEnchantment() &&
					!entity.IsBaconGhost(),
			);

			const linkedEntity =
				heroesForTargetPlayerId.length > 0 ? heroesForTargetPlayerId[heroesForTargetPlayerId.length - 1] : null;
			if (linkedEntity != null) {
				hero = linkedEntity;
				cardId = hero.CardId;
				playerId = hero.GetTag(GameTag.PLAYER_ID);
			}
		}

		if (cardId == null) {
			const activePlayer = gameState.CurrentEntities.get(stateFacade.LocalPlayer!.Id);
			const opponentPlayerId = activePlayer?.GetTag(GameTag.NEXT_OPPONENT_PLAYER_ID) ?? -1;
			hero = currentEntities.find((data) => data.GetTag(GameTag.PLAYER_ID) === opponentPlayerId)?.Clone() ?? null;
			cardId = hero?.CardId ?? null;
			playerId = hero?.GetTag(GameTag.PLAYER_ID) ?? playerId;
		}

		if (isOpponent) {
			gameState.BgsCurrentBattleOpponent = cardId;
			gameState.BgsCurrentBattleOpponentPlayerId = playerId;
		}

		if (cardId != null) {
			const board = currentEntities
				.filter(
					(entity) =>
						entity.GetEffectiveController() === playerPlayerId &&
						entity.GetTag(GameTag.ZONE) === (Zone.PLAY as number) &&
						entity.TakesBoardSpace() &&
						(!isOpponent || entity.GetTag(GameTag.NUM_TURNS_IN_PLAY) <= 1),
				)
				.sort((a, b) => a.GetTag(GameTag.ZONE_POSITION) - b.GetTag(GameTag.ZONE_POSITION))
				.map((entity) =>
					BattlegroundsPlayerBoardParser.EnhanceEntities(entity.Clone(), gameState, stateFacade),
				);
			const secrets = currentEntities
				.filter(
					(entity) =>
						entity.GetEffectiveController() === playerPlayerId &&
						entity.GetTag(GameTag.ZONE) === (Zone.SECRET as number) &&
						entity.GetTag(GameTag.BACON_IS_BOB_QUEST) !== 1 &&
						entity.GetTag(GameTag.QUEST) !== 1 &&
						entity.GetTag(GameTag.SIDE_QUEST) !== 1,
				)
				.sort((a, b) => a.GetTag(GameTag.ZONE_POSITION) - b.GetTag(GameTag.ZONE_POSITION))
				.map((entity) =>
					BattlegroundsPlayerBoardParser.BuildEntityWithCardIdFromTheFuture(
						entity.Clone(),
						stateFacade.GsState!.GameState,
					),
				);
			let hand: (FullEntity | BgsPlayerBoardEntity)[] = currentEntities
				.filter(
					(entity) =>
						entity.GetEffectiveController() === playerPlayerId &&
						entity.GetTag(GameTag.ZONE) === (Zone.HAND as number),
				)
				.sort((a, b) => a.GetTag(GameTag.ZONE_POSITION) - b.GetTag(GameTag.ZONE_POSITION))
				.map((entity) => entity.Clone())
				.map((entity) => BattlegroundsPlayerBoardParser.AddEnchantments(gameState.CurrentEntities, entity));

			if (isOpponent) {
				hand = hand.map(
					(e) => BattlegroundsPlayerBoardParser.GetEntitySpawnedFromHand(e.Id, board, stateFacade) ?? e,
				);
			}

			const finalBoard = board.map((entity) =>
				BattlegroundsPlayerBoardParser.AddEnchantments(gameState.CurrentEntities, entity),
			);
			if (finalBoard.length > 7) {
				console.debug('Too many entities on board', '');
			}

			const questRewardRawEntities = currentEntities
				.filter(
					(entity) =>
						entity.GetEffectiveController() === playerPlayerId &&
						entity.GetTag(GameTag.ZONE) === (Zone.PLAY as number) &&
						entity.GetTag(GameTag.CARDTYPE) === (CardType.BATTLEGROUND_QUEST_REWARD as number),
				)
				.map((entity) => entity.Clone());
			const questRewards = questRewardRawEntities.map((entity) => entity.CardId);
			const questRewardEntities: QuestReward[] = questRewardRawEntities.map((entity) => ({
				CardId: entity.CardId,
				AvengeCurrent: 0,
				AvengeDefault: 0,
				ScriptDataNum1: entity.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_1, 0),
			}));
			const questEntities: QuestEntity[] = currentEntities
				.filter(
					(entity) =>
						entity.GetEffectiveController() === playerPlayerId &&
						entity.GetTag(GameTag.ZONE) === (Zone.SECRET as number) &&
						entity.GetTag(GameTag.CARDTYPE) === (CardType.SPELL as number) &&
						entity.GetTag(GameTag.QUEST) === 1,
				)
				.map((entity) => ({
					CardId: entity.CardId,
					RewardDbfId: entity.GetTag(GameTag.QUEST_REWARD_DATABASE_ID, 0),
					ProgressCurrent: entity.GetTag(GameTag.QUEST_PROGRESS, 0),
					ProgressTotal: entity.GetTag(GameTag.QUEST_PROGRESS_TOTAL, 0),
				}));

			const trinkets = BattlegroundsPlayerBoardParser.BuildTrinkets(playerPlayerId, gameState);

			const globalInfo = BattlegroundsPlayerBoardParser.BuildGlobalInfo(
				playerPlayerId,
				playerEntityId,
				finalBoard,
				gameState,
				stateFacade,
			);

			const heroPowerEntities = currentEntities
				.filter(
					(entity) =>
						entity.GetEffectiveController() === playerPlayerId &&
						entity.GetTag(GameTag.ZONE) === (Zone.PLAY as number) &&
						entity.GetTag(GameTag.CARDTYPE) === (CardType.HERO_POWER as number),
				)
				.map((entity) => entity.Clone());
			if (heroPowerEntities.length === 0) {
				console.debug('WARNING: could not find hero power', '');
			}

			const heroPowers: BgsHeroPower[] = heroPowerEntities.map((hp) => ({
				CardId: hp?.CardId ?? null,
				EntityId: hp?.Entity ?? -1,
				Used: hp?.GetTag(GameTag.BACON_HERO_POWER_ACTIVATED) === 1,
				Info: hp?.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_1) ?? 0,
				Info2: hp?.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_2) ?? 0,
				Info3: hp?.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_3) ?? 0,
				Info4: hp?.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_4) ?? 0,
				Info5: hp?.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_5) ?? 0,
				Info6: hp?.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_6) ?? 0,
				ScoreValue1: hp?.GetTag(GameTag.SCORE_VALUE_1, 0) ?? 0,
				ScoreValue2: hp?.GetTag(GameTag.SCORE_VALUE_2, 0) ?? 0,
				ScoreValue3: hp?.GetTag(GameTag.SCORE_VALUE_3, 0) ?? 0,
				Locked: hp?.GetTag(GameTag.LOCK_VISUAL) ?? 0,
				CreatedEntity: null,
			}));

			BattlegroundsPlayerBoardParser.UpdateEmbraceYourRageTarget(stateFacade, heroPowers);
			BattlegroundsPlayerBoardParser.UpdateRebornRitesTarget(stateFacade, heroPowers);
			BattlegroundsPlayerBoardParser.UpdateLockAndLoadMinion(stateFacade, heroPowers);

			return {
				Hero: hero,
				HeroPowers: heroPowers,
				HeroPowerCardId: heroPowerEntities[0]?.CardId ?? null,
				HeroPowerEntityId: heroPowerEntities[0]?.Entity ?? -1,
				HeroPowerUsed: heroPowerEntities[0]?.GetTag(GameTag.BACON_HERO_POWER_ACTIVATED) === 1,
				HeroPowerInfo: heroPowerEntities[0]?.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_1) ?? 0,
				HeroPowerInfo2: heroPowerEntities[0]?.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_2) ?? 0,
				HeroPowerCreatedEntity: null,
				CardId: cardId,
				PlayerId: playerId,
				PlayerEntityId: playerEntityId,
				Board: finalBoard,
				QuestEntities: questEntities,
				QuestRewards: questRewards,
				QuestRewardEntities: questRewardEntities,
				Secrets: secrets,
				Hand: hand as BgsPlayerBoardEntity[],
				Trinkets: trinkets,
				GlobalInfo: globalInfo,
			};
		}
		return null;
	}

	static BuildTrinkets(playerPlayerId: number, gameState: GameState): TrinketEntity[] {
		return [...gameState.CurrentEntities.values()]
			.filter(
				(entity) =>
					entity.GetEffectiveController() === playerPlayerId &&
					entity.GetTag(GameTag.ZONE) === (Zone.PLAY as number) &&
					entity.GetCardType() === (CardType.BATTLEGROUND_TRINKET as number),
			)
			.map((entity) => ({
				cardId: entity.CardId,
				entityId: entity.Entity,
				scriptDataNum1: entity.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_1, 0),
				scriptDataNum2: entity.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_2, 0),
				scriptDataNum6: entity.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_6, 0),
				tags: entity.Tags.reduce(
					(acc, tag) => {
						acc[tag.Name] = tag.Value;
						return acc;
					},
					{} as { [key in GameTag]?: number },
				),
			}))
			.sort((a, b) => a.scriptDataNum6 - b.scriptDataNum6);
	}

	static BuildGlobalInfo(
		playerId: number,
		playerEntityId: number,
		board: BgsPlayerBoardEntity[],
		gameState: GameState,
		stateFacade: StateFacade,
	): BgsPlayerGlobalInfo {
		const currentEntities = [...gameState.CurrentEntities.values()];
		const currentEntitiesGs = [...(stateFacade.GsState?.GameState?.CurrentEntities?.values() ?? [])];
		const eternalKnightBonus = BattlegroundsPlayerBoardParser.GetPlayerEnchantmentValue(
			playerId,
			CardIds.EternalKnightPlayerEnchantEnchantment,
			currentEntities,
		);
		const eternalKnightAttackBuff = BattlegroundsPlayerBoardParser.GetPlayerEnchantmentValue(
			playerId,
			CardIds.EternalPortrait_GreaterEternalLegionEnchantment_BG36_MagicItem_216e,
			currentEntities,
		);
		const eternalKnightHealthBuff = BattlegroundsPlayerBoardParser.GetPlayerEnchantmentValue(
			playerId,
			CardIds.EternalPortrait_GreaterEternalLegionEnchantment_BG36_MagicItem_216e,
			currentEntities,
			GameTag.TAG_SCRIPT_DATA_NUM_2,
		);
		const tavernSpellsCastThisGame = BattlegroundsPlayerBoardParser.GetPlayerTag(
			playerEntityId,
			GameTag.TAVERN_SPELLS_PLAYED_THIS_GAME,
			currentEntities,
		);
		const tastyLobstersBuff = BattlegroundsPlayerBoardParser.GetPlayerTag(
			playerEntityId,
			GameTag.BACON_TASTY_LOBSTER_BUFF,
			currentEntities,
		);
		const goldenMinionsPlayedThisGame = BattlegroundsPlayerBoardParser.GetPlayerTag(
			playerEntityId,
			GameTag.BACON_GOLDEN_MINIONS_PLAYED_THIS_GAME,
			currentEntities,
		);
		const spellsCastThisGame = BattlegroundsPlayerBoardParser.GetPlayerTag(
			playerEntityId,
			GameTag.NUM_SPELLS_PLAYED_THIS_GAME,
			currentEntities,
		);
		const undeadAttackBonus = BattlegroundsPlayerBoardParser.GetPlayerEnchantmentValue(
			playerId,
			CardIds.UndeadBonusAttackPlayerEnchantDntEnchantment,
			currentEntities,
		);
		const undeadHealthBonus = BattlegroundsPlayerBoardParser.GetPlayerEnchantmentValue(
			playerId,
			CardIds.UndeadBonusAttackPlayerEnchantDntEnchantment,
			currentEntities,
			GameTag.TAG_SCRIPT_DATA_NUM_2,
		);
		const hauntedCarapaceAttackBonus = BattlegroundsPlayerBoardParser.GetPlayerEnchantmentValue(
			playerId,
			CardIds.HauntedCarapacePlayerEnchantDntEnchantment_BG33_112pe,
			currentEntities,
		);
		const hauntedCarapaceHealthBonus = BattlegroundsPlayerBoardParser.GetPlayerEnchantmentValue(
			playerId,
			CardIds.HauntedCarapacePlayerEnchantDntEnchantment_BG33_112pe,
			currentEntities,
			GameTag.TAG_SCRIPT_DATA_NUM_2,
		);
		const goldrinnBuffAtk =
			BattlegroundsPlayerBoardParser.GetPlayerEnchantmentValue(
				playerId,
				CardIds.GoldrinnPlayerEnchantEnchantment_BGS_018pe,
				currentEntities,
			) +
			BattlegroundsPlayerBoardParser.GetPlayerEnchantmentValue(
				playerId,
				CardIds.TimewarpedGoldrinnPlayerEnchantDntEnchantment_BG34_Giant_362pe,
				currentEntities,
			);
		const goldrinnBuffHealth =
			BattlegroundsPlayerBoardParser.GetPlayerEnchantmentValue(
				playerId,
				CardIds.GoldrinnPlayerEnchantEnchantment_BGS_018pe,
				currentEntities,
				GameTag.TAG_SCRIPT_DATA_NUM_2,
			) +
			BattlegroundsPlayerBoardParser.GetPlayerEnchantmentValue(
				playerId,
				CardIds.TimewarpedGoldrinnPlayerEnchantDntEnchantment_BG34_Giant_362pe,
				currentEntities,
				GameTag.TAG_SCRIPT_DATA_NUM_2,
			);
		const astralAutomatonBonus = BattlegroundsPlayerBoardParser.GetPlayerEnchantmentValue(
			playerId,
			CardIds.AstralAutomatonPlayerEnchantDntEnchantment_BG_TTN_401pe,
			currentEntities,
		);
		const beetleArmy = BattlegroundsPlayerBoardParser.GetTupleEnchantmentValue(
			playerId,
			CardIds.BeetleArmyPlayerEnchantDntEnchantment_BG31_808pe,
			currentEntities,
		);
		const sanlyanScribesDeadThisGame = BattlegroundsPlayerBoardParser.GetTupleEnchantmentValue(
			playerId,
			CardIds.SanlaynScribePlayerEnchantDntEnchantment_BGDUO31_208pe,
			currentEntities,
		);
		const deepBluesPlayed = BattlegroundsPlayerBoardParser.GetPlayerEnchantmentValue(
			playerId,
			CardIds.DeepBlueCroonerPlayerEnchantDntEnchantment,
			currentEntities,
		);
		const frostlingBonus = BattlegroundsPlayerBoardParser.GetPlayerTag(
			playerEntityId,
			GameTag.BACON_ELEMENTALS_PLAYED_THIS_GAME,
			currentEntities,
		);
		const piratesPlayedThisGame = BattlegroundsPlayerBoardParser.GetPlayerTag(
			playerEntityId,
			GameTag.BACON_PIRATES_PLAYED_THIS_GAME,
			currentEntities,
		);
		const piratesSummonedThisGame = BattlegroundsPlayerBoardParser.GetPlayerTag(
			playerEntityId,
			GameTag.BACON_PIRATES_SUMMONED_THIS_GAME,
			currentEntities,
		);
		const beastsSummonedThisGame = BattlegroundsPlayerBoardParser.GetPlayerTag(
			playerEntityId,
			GameTag.BACON_BEASTS_SUMMONED_THIS_GAME,
			currentEntities,
		);
		const magnetizedThisGame = BattlegroundsPlayerBoardParser.GetPlayerTag(
			playerEntityId,
			GameTag.BACON_NUM_MAGNETIZE_THIS_GAME,
			currentEntities,
		);
		const elementalHealthBuff = BattlegroundsPlayerBoardParser.GetPlayerTag(
			playerEntityId,
			GameTag.BACON_ELEMENTAL_BUFFHEALTHVALUE,
			currentEntities,
		);
		const elementalAttackBuff = BattlegroundsPlayerBoardParser.GetPlayerTag(
			playerEntityId,
			GameTag.BACON_ELEMENTAL_BUFFATKVALUE,
			currentEntities,
		);
		const tavernSpellHealthBuff = BattlegroundsPlayerBoardParser.GetPlayerTag(
			playerEntityId,
			GameTag.TAVERN_SPELL_HEALTH_INCREASE,
			currentEntities,
		);
		const tavernSpellAttackBuff = BattlegroundsPlayerBoardParser.GetPlayerTag(
			playerEntityId,
			GameTag.TAVERN_SPELL_ATTACK_INCREASE,
			currentEntities,
		);
		const goldSpentThisGame = BattlegroundsPlayerBoardParser.GetPlayerTag(
			playerEntityId,
			GameTag.BACON_GOLD_SPENT_THIS_GAME,
			currentEntities,
		);
		// const bloodGemEnchant =
		// 	currentEntities
		// 		.filter(
		// 			(entity) =>
		// 				entity.GetEffectiveController() === playerId &&
		// 				entity.GetTag(GameTag.ZONE) === (Zone.PLAY as number) &&
		// 				entity.CardId === CardIds.BloodGemPlayerEnchantEnchantment,
		// 		)
		// 		.pop() ?? null;
		// const bloodGemAttackBonus = bloodGemEnchant?.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_1, 0) ?? 0;
		// const bloodGemHealthBonus = bloodGemEnchant?.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_2, 0) ?? 0;
		const bloodGemAttackBonus = BattlegroundsPlayerBoardParser.GetPlayerTag(
			playerEntityId,
			GameTag.BACON_BLOODGEMBUFFATKVALUE,
			currentEntities,
		);
		const bloodGemHealthBonus = BattlegroundsPlayerBoardParser.GetPlayerTag(
			playerEntityId,
			GameTag.BACON_BLOODGEMBUFFHEALTHVALUE,
			currentEntities,
		);
		const battlecriesTriggeredThisGame = BattlegroundsPlayerBoardParser.GetPlayerTag(
			playerEntityId,
			GameTag.BATTLECRIES_TRIGGERED_THIS_GAME,
			currentEntities,
		);
		const friendlyMinionsDeadLastCombat = BattlegroundsPlayerBoardParser.GetPlayerTag(
			playerEntityId,
			GameTag.NUM_FRIENDLY_MINIONS_THAT_DIED_LAST_TURN,
			currentEntities,
		);
		const volumizerAttackBuff = BattlegroundsPlayerBoardParser.GetPlayerTag(
			playerEntityId,
			GameTag.BACON_VOLUMIZER_ATTACK_BUFF,
			currentEntities,
		);
		const volumizerHealthBuff = BattlegroundsPlayerBoardParser.GetPlayerTag(
			playerEntityId,
			GameTag.BACON_VOLUMIZER_HEALTH_BUFF,
			currentEntities,
		);
		const whelpAttackBuff = BattlegroundsPlayerBoardParser.GetPlayerEnchantmentValue(
			playerId,
			CardIds.WhelpBuffPlayerEnchantDntEnchantment_BG34_402pe,
			currentEntities,
		);
		const whelpHealthBuff = BattlegroundsPlayerBoardParser.GetPlayerEnchantmentValue(
			playerId,
			CardIds.WhelpBuffPlayerEnchantDntEnchantment_BG34_402pe,
			currentEntities,
			GameTag.TAG_SCRIPT_DATA_NUM_2,
		);
		const cardsPlayedThisTurn = BattlegroundsPlayerBoardParser.GetPlayerTag(
			playerEntityId,
			GameTag.NUM_CARDS_PLAYED_THIS_TURN,
			currentEntities,
		);
		const mrrgltonsPlayedThisGame = BattlegroundsPlayerBoardParser.GetPlayerTag(
			playerEntityId,
			GameTag.BACON_MRRGLTON_PLAYED_THIS_GAME,
			currentEntities,
		);
		const backToBackCastThisGame = BattlegroundsPlayerBoardParser.GetPlayerTag(
			playerEntityId,
			GameTag.BACON_BACK_TO_BACK_CAST_THIS_GAME,
			currentEntities,
		);
		const deathrattlesTriggeredThisGame = BattlegroundsPlayerBoardParser.GetPlayerTag(
			playerEntityId,
			GameTag.DEATHRATTLES_TRIGGERED_THIS_GAME,
			currentEntities,
		);
		const tavernSpellsCastThisTurn = BattlegroundsPlayerBoardParser.GetPlayerTag(
			playerEntityId,
			GameTag.SPELLS_PLAYED_THIS_TURN,
			currentEntities,
		);

		// This doesn't work, because it includes too many things.
		// If you have a Choral Mrrrlgr and a Timewarped Mrrrlgr, it will include both in the enchantment,
		// while we only want to have the info from the base version itself
		const boardIds = board.map((b) => b.Id);
		const choralEnchantments = currentEntitiesGs.filter(
			(e) =>
				e.CardId === CardIds.ChoralMrrrglr_ChorusEnchantment && boardIds.includes(e.GetTag(GameTag.ATTACHED)),
		);
		const choralEnchantment = choralEnchantments[0] ?? null;
		const choralSource =
			choralEnchantment == null
				? null
				: (gameState.CurrentEntities.get(choralEnchantment.GetTag(GameTag.CREATOR)) ?? null);
		const isChoralPremium = choralSource?.GetTag(GameTag.PREMIUM) === 1;
		const choralAttackBuff =
			(choralEnchantment?.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_1, 0) ?? 0) / (isChoralPremium ? 2 : 1);
		const choralHealthBuff =
			(choralEnchantment?.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_2, 0) ?? 0) / (isChoralPremium ? 2 : 1);

		return {
			EternalKnightsDeadThisGame: eternalKnightBonus,
			EternalKnightAttackBuff: eternalKnightAttackBuff,
			EternalKnightHealthBuff: eternalKnightHealthBuff,
			TavernSpellsCastThisGame: tavernSpellsCastThisGame,
			TastyLobstersBuff: tastyLobstersBuff,
			UndeadAttackBonus: undeadAttackBonus,
			UndeadHealthBonus: undeadHealthBonus,
			HauntedCarapaceAttackBonus: hauntedCarapaceAttackBonus,
			HauntedCarapaceHealthBonus: hauntedCarapaceHealthBonus,
			FrostlingBonus: frostlingBonus,
			PiratesSummonedThisGame: piratesSummonedThisGame,
			BeastsSummonedThisGame: beastsSummonedThisGame,
			MagnetizedThisGame: magnetizedThisGame,
			AstralAutomatonsSummonedThisGame: astralAutomatonBonus,
			PiratesPlayedThisGame: piratesPlayedThisGame,
			BloodGemAttackBonus: bloodGemAttackBonus,
			BloodGemHealthBonus: bloodGemHealthBonus,
			ChoralAttackBuff: choralAttackBuff,
			ChoralHealthBuff: choralHealthBuff,
			BeetleAttackBuff: beetleArmy[0],
			BeetleHealthBuff: beetleArmy[1],
			ElementalHealthBuff: elementalHealthBuff,
			ElementalAttackBuff: elementalAttackBuff,
			TavernSpellHealthBuff: tavernSpellHealthBuff,
			TavernSpellAttackBuff: tavernSpellAttackBuff,
			BattlecriesTriggeredThisGame: battlecriesTriggeredThisGame,
			FriendlyMinionsDeadLastCombat: friendlyMinionsDeadLastCombat,
			SanlaynScribesDeadThisGame: sanlyanScribesDeadThisGame?.[0] ?? 0,
			SpellsCastThisGame: spellsCastThisGame,
			GoldSpentThisGame: goldSpentThisGame,
			GoldenMinionsPlayedThisGame: goldenMinionsPlayedThisGame,
			GoldrinnBuffAtk: goldrinnBuffAtk,
			GoldrinnBuffHealth: goldrinnBuffHealth,
			WhelpAttackBuff: whelpAttackBuff,
			WhelpHealthBuff: whelpHealthBuff,
			DeepBluesPlayed: deepBluesPlayed,
			VolumizerAttackBuff: volumizerAttackBuff,
			VolumizerHealthBuff: volumizerHealthBuff,
			DeathrattlesTriggeredThisGame: deathrattlesTriggeredThisGame,
			TavernSpellsCastThisTurn: tavernSpellsCastThisTurn,
			MrrgltonsPlayedThisGame: mrrgltonsPlayedThisGame,
			CardsPlayedThisTurn: cardsPlayedThisTurn,
			BackToBackCastThisGame: backToBackCastThisGame,
		};
	}

	static UpdateEmbraceYourRageTarget(stateFacade: StateFacade, heroPowers: BgsHeroPower[]): void {
		for (const heroPower of heroPowers) {
			if (heroPower.Used && heroPower.CardId === CardIds.EmbraceYourRage) {
				const entities = [...(stateFacade.GsState?.GameState?.CurrentEntities?.values() ?? [])];
				const createdEntity = [...entities]
					.reverse()
					.find(
						(e) =>
							e.GetTag(GameTag.CREATOR) === heroPower.EntityId &&
							e.GetCardType() === (CardType.MINION as number),
					);
				heroPower.Info = createdEntity?.CardId ?? null;
				return;
			}
		}
	}

	static UpdateLockAndLoadMinion(stateFacade: StateFacade, heroPowers: BgsHeroPower[]): void {
		for (const heroPower of heroPowers) {
			if (heroPower.Used && heroPower.CardId === CardIds.LockAndLoadToken_BG22_HERO_000p_Alt) {
				const createdEntity = [...(stateFacade.PtlState?.GameState?.CurrentEntities?.values() ?? [])]
					.reverse()
					.find(
						(e) =>
							e.GetTag(GameTag.CREATOR) === heroPower.EntityId &&
							e.GetCardType() === (CardType.MINION as number),
					);
				if (createdEntity != null) {
					const withEnchants = BattlegroundsPlayerBoardParser.AddEnchantments(
						// Why use the GameState here? If we do, this means that we will get either:
						// - Nothing, because the GS is already over and the enchantments are all removed from game
						// - Too much, because we will also get enchantments that were added before the combat started
						// I assume there must have been a reason for this, but it's not documented
						// stateFacade.GsState!.GameState.CurrentEntities,
						stateFacade.PtlState!.GameState.CurrentEntities,
						createdEntity,
					);
					heroPower.Info = withEnchants;
				} else {
					const createdEntity2 = [...(stateFacade.GsState?.GameState?.CurrentEntities?.values() ?? [])]
						.reverse()
						.find(
							(e) =>
								e.GetTag(GameTag.CREATOR) === heroPower.EntityId &&
								e.GetCardType() === (CardType.MINION as number),
						);
					if (createdEntity2 != null) {
						const clone = createdEntity2.Clone();
						const takeUntilTag = GameTag.COPIED_FROM_ENTITY_ID;
						BattlegroundsPlayerBoardParser.OverrideTagWithHistory(clone, GameTag.HEALTH, takeUntilTag);
						BattlegroundsPlayerBoardParser.OverrideTagWithHistory(clone, GameTag.ATK, takeUntilTag);
						BattlegroundsPlayerBoardParser.OverrideTagWithHistory(
							clone,
							GameTag.LITERALLY_UNPLAYABLE,
							takeUntilTag,
						);
						BattlegroundsPlayerBoardParser.OverrideTagWithHistory(
							clone,
							GameTag.UNPLAYABLE_VISUALS,
							takeUntilTag,
						);
						BattlegroundsPlayerBoardParser.OverrideTagWithHistory(clone, GameTag.REBORN, takeUntilTag);
						const withEnchants = BattlegroundsPlayerBoardParser.AddEnchantments(
							stateFacade.GsState!.GameState.CurrentEntities,
							clone,
							true,
						);
						heroPower.Info = withEnchants;
					}
				}
				return;
			}
		}
	}

	static UpdateRebornRitesTarget(stateFacade: StateFacade, heroPowers: BgsHeroPower[]): void {
		for (const heroPower of heroPowers) {
			const heroPowerInfo = typeof heroPower.Info === 'number' ? heroPower.Info : 0;
			if (heroPower.Used && heroPower.CardId === CardIds.RebornRites && heroPowerInfo <= 0) {
				const heroPowerEntity =
					stateFacade.PtlState?.GameState?.CurrentEntities?.get(heroPower.EntityId ?? -1) ?? null;
				if (heroPowerEntity == null) {
					return;
				}

				const targetEntityId = heroPowerEntity.GetTag(GameTag.CARD_TARGET);
				if (targetEntityId > 0) {
					heroPower.Info = targetEntityId;
					return;
				}
			}
		}
	}

	static BuildEntityWithCardIdFromTheFuture(entity: FullEntity, gsState: GameState): FullEntity {
		if (entity.CardId != null && entity.CardId.length > 0) {
			return entity;
		}
		const entityFromTheFuture = gsState.CurrentEntities.get(entity.Entity);
		if (
			entityFromTheFuture == null ||
			entityFromTheFuture.CardId == null ||
			entityFromTheFuture.CardId.length === 0
		) {
			return entity;
		}
		entity.CardId = entityFromTheFuture.CardId;
		return entity;
	}

	static EnhanceEntities(entity: FullEntity, gameState: GameState, stateFacade: StateFacade): FullEntity {
		switch (entity.CardId) {
			case CardIds.LovesickBalladist_BG26_814:
			case CardIds.LovesickBalladist_BG26_814_G:
				return BattlegroundsPlayerBoardParser.EnhanceLovesickBalladist(entity, stateFacade);
			case CardIds.TimewarpedNelliesShipToken_BG34_Giant_074t:
			case CardIds.TimewarpedNelliesShip_BG34_Giant_074t_G:
				return TimewarpedNelliesShip.EnhanceEntity(entity, stateFacade);
			default:
				return entity;
		}
	}

	static EnhanceLovesickBalladist(entity: FullEntity, stateFacade: StateFacade): FullEntity {
		const games = stateFacade.GSReplay.Games;
		const currentGame = games[games.length - 1];
		const serenadedEnchantments = currentGame
			.FilterGameData(ShowEntity)
			.filter((d): d is ShowEntity => d instanceof ShowEntity)
			.filter(
				(e) =>
					e.CardId === CardIds.LovesickBalladist_SerenadedEnchantment &&
					e.GetTag(GameTag.CREATOR) === entity.Id &&
					e.GetTag(GameTag.ATTACHED) > 0,
			);
		const latestEnchantment =
			serenadedEnchantments.length > 0 ? serenadedEnchantments[serenadedEnchantments.length - 1] : null;
		const latestEnchantmentId = latestEnchantment?.Entity;
		if (latestEnchantmentId == null) {
			return entity;
		}

		const buffEnchantmentValue =
			stateFacade.GsState?.GameState?.CurrentEntities?.get(latestEnchantmentId)?.GetTag(
				GameTag.TAG_SCRIPT_DATA_NUM_1,
			) ?? 0;
		if (buffEnchantmentValue > 0) {
			const baseValue =
				entity.CardId === CardIds.LovesickBalladist_BG26_814
					? buffEnchantmentValue
					: Math.floor(buffEnchantmentValue / 2);
			entity.SetTag(GameTag.TAG_SCRIPT_DATA_NUM_1, baseValue);
		}
		return entity;
	}

	static OverrideTagWithHistory(
		entity: FullEntity,
		tag: GameTag,
		takeUntilTag: GameTag = GameTag.SHOW_ENTITY_START,
	): void {
		const tagsBeforeCutoff: Tag[] = [];
		for (const t of entity.TagsHistory) {
			if (t.Name === (takeUntilTag as number)) break;
			tagsBeforeCutoff.push(t);
		}
		const tags = tagsBeforeCutoff.filter((t) => t.Name === (tag as number));
		let tagInHand: number | undefined;
		if (tags.length === 1) {
			tagInHand = tags[0].Value;
		} else {
			tagInHand = tags.length > 1 ? tags[1]?.Value : undefined;
		}
		entity.SetTag(tag, tagInHand ?? entity.GetTag(tag, 0));
	}

	static GetEntitySpawnedFromHand(
		id: number,
		board: (FullEntity | BgsPlayerBoardEntity)[],
		stateFacade: StateFacade,
	): BgsPlayerBoardEntity | null {
		const entityInHand = stateFacade.GsState?.GameState?.CurrentEntities?.get(id);
		if (entityInHand == null) return null;
		const clone = entityInHand.Clone();

		BattlegroundsPlayerBoardParser.OverrideTagWithHistory(clone, GameTag.HEALTH);
		BattlegroundsPlayerBoardParser.OverrideTagWithHistory(clone, GameTag.ATK);
		BattlegroundsPlayerBoardParser.OverrideTagWithHistory(clone, GameTag.LITERALLY_UNPLAYABLE);
		BattlegroundsPlayerBoardParser.OverrideTagWithHistory(clone, GameTag.UNPLAYABLE_VISUALS);
		BattlegroundsPlayerBoardParser.OverrideTagWithHistory(clone, GameTag.DIVINE_SHIELD);
		BattlegroundsPlayerBoardParser.OverrideTagWithHistory(clone, GameTag.VENOMOUS);
		BattlegroundsPlayerBoardParser.OverrideTagWithHistory(clone, GameTag.REBORN);
		BattlegroundsPlayerBoardParser.OverrideTagWithHistory(clone, GameTag.TAUNT);

		const enchantments = [...(stateFacade.GsState?.GameState?.CurrentEntities?.values() ?? [])].filter(
			(entity) => entity.GetTag(GameTag.ATTACHED) === id,
		);
		if (enchantments.some((e) => e.CardId === CardIds.ExpeditionPlans_UnplayableEnchantment)) {
			clone.SetTag(GameTag.UNPLAYABLE_VISUALS, 1);
		}
		clone.SetTag(GameTag.DAMAGE, 0).SetTag(GameTag.ZONE, Zone.HAND as number);

		const withEnchants = BattlegroundsPlayerBoardParser.AddEnchantments(
			stateFacade.GsState!.GameState.CurrentEntities,
			clone,
			true,
		);

		return withEnchants;
	}

	static GetPlayerEnchantmentValue(
		playerId: number,
		enchantment: string,
		currentEntities: FullEntity[],
		gameTag: GameTag = GameTag.TAG_SCRIPT_DATA_NUM_1,
	): number {
		return (
			currentEntities
				.find(
					(entity) =>
						entity.GetEffectiveController() === playerId &&
						entity.GetTag(GameTag.ZONE) === (Zone.PLAY as number) &&
						entity.CardId === enchantment,
				)
				?.GetTag(gameTag) ?? 0
		);
	}

	static GetTupleEnchantmentValue(
		playerId: number,
		enchantment: string,
		currentEntities: FullEntity[],
	): [number, number] {
		const ench = currentEntities.find(
			(entity) =>
				entity.GetEffectiveController() === playerId &&
				entity.GetTag(GameTag.ZONE) === (Zone.PLAY as number) &&
				entity.CardId === enchantment,
		);
		return [ench?.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_1) ?? 0, ench?.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_2) ?? 0];
	}

	static GetPlayerTag(playerEntityId: number, tag: GameTag, currentEntities: FullEntity[]): number {
		return currentEntities.find((e) => e.Entity === playerEntityId)?.GetTag(tag, 0) ?? 0;
	}

	static AddEnchantments(
		currentEntities: Map<number, FullEntity>,
		fullEntity: FullEntity,
		allowRemovedFromGame: boolean = false,
	): BgsPlayerBoardEntity {
		const enchantments = BattlegroundsPlayerBoardParser.BuildEnchantments(
			currentEntities,
			fullEntity,
			allowRemovedFromGame,
		);
		return {
			CardId: fullEntity.CardId,
			Entity: fullEntity.Entity,
			Id: fullEntity.Id,
			Tags: fullEntity.GetTagsCopy(),
			TimeStamp: fullEntity.TimeStamp,
			Enchantments: enchantments,
			DynamicInfo: fullEntity.DynamicInfo,
		};
	}

	private static BuildEnchantments(
		currentEntities: Map<number, FullEntity>,
		fullEntity: FullEntity,
		allowRemovedFromGame: boolean = false,
	): Enchantment[] {
		const enchantmentEntities = BattlegroundsPlayerBoardParser.BuildEnchantmentEntities(
			currentEntities,
			fullEntity,
			allowRemovedFromGame,
		);
		const enchantments: Enchantment[] = enchantmentEntities.map((entity) => ({
			EntityId: entity.Id,
			CardId: entity.CardId,
			TagScriptDataNum1: entity.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_1),
			TagScriptDataNum2: entity.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_2),
		}));
		const additionalEnchantments = BattlegroundsPlayerBoardParser.BuildAdditionalEnchantments(
			fullEntity,
			enchantmentEntities,
			currentEntities,
		);
		enchantments.push(...additionalEnchantments);
		return enchantments;
	}

	private static BuildEnchantmentEntities(
		currentEntities: Map<number, FullEntity>,
		fullEntity: FullEntity | null,
		allowRemovedFromGame: boolean = false,
	): FullEntity[] {
		if (fullEntity == null) {
			return [];
		}

		const enchantmentEntities = [...currentEntities.values()].filter(
			(entity) =>
				entity.GetTag(GameTag.ATTACHED) === fullEntity.Id &&
				(allowRemovedFromGame || entity.GetTag(GameTag.ZONE) !== (Zone.REMOVEDFROMGAME as number)),
		);
		const newEnchantEntities: FullEntity[] = [];
		for (const enchant of enchantmentEntities) {
			if (enchant.GetTag(GameTag.MAGNETIC) === 1) {
				const subEnchants = BattlegroundsPlayerBoardParser.BuildEnchantmentEntities(
					currentEntities,
					currentEntities.get(enchant.GetTag(GameTag.CREATOR)) ?? null,
					allowRemovedFromGame,
				).filter((e) => e.GetTag(GameTag.MAGNETIC) === 1);
				newEnchantEntities.push(...subEnchants);
			}
		}
		enchantmentEntities.push(...newEnchantEntities);
		return enchantmentEntities;
	}

	static BuildAdditionalEnchantments(
		_fullEntity: FullEntity,
		enchantmentEntities: FullEntity[],
		currentEntities: Map<number, FullEntity>,
	): Enchantment[] {
		return enchantmentEntities
			.filter(
				(e) =>
					e.CardId === CardIds.PolarizingBeatboxer_PolarizedEnchantment ||
					e.CardId === CardIds.ClunkerJunker_ClunkyEnchantment_BG29_503e,
			)
			.map((e) => {
				const entityAsEnchantmentDbfId =
					currentEntities.get(e.GetTag(GameTag.CREATOR))?.GetTag(GameTag.ENTITY_AS_ENCHANTMENT) ?? null;
				return {
					CardId: '' + (entityAsEnchantmentDbfId ?? e.GetTag(GameTag.CREATOR_DBID)),
					EntityId: e.GetTag(GameTag.CREATOR),
					TagScriptDataNum1: 0,
					TagScriptDataNum2: 0,
				};
			});
	}
}
