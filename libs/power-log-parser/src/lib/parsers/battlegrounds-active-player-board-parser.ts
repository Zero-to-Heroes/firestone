import { CardIds, CardType, GameTag, Step, Zone } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider } from '../game-event';
import { FullEntity, Node, NodeType, Player } from '../models';
import { TagChange } from '../models/tag';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';
import {
	BattlegroundsPlayerBoardParser,
	BgsPlayerBoardEntity,
	PlayerBoard,
	QuestEntity,
	QuestReward,
} from './battlegrounds-player-board-parser';
import { BattlegroundsStartOfBattleLegacySnapshot } from './battlegrounds-start-of-battle-legacy-snapshot';

export class BattlegroundsActivePlayerBoardParser implements ActionParser {
	readonly ParserName = 'BattlegroundsActivePlayerBoardParser';

	private GameState: GameState;
	private ParserState: ParserState;
	private StateFacade: StateFacade;
	private Snapshot: BattlegroundsStartOfBattleLegacySnapshot;

	constructor(parserState: ParserState, stateFacade: StateFacade) {
		this.ParserState = parserState;
		this.GameState = parserState.GameState;
		this.StateFacade = stateFacade;
		this.Snapshot = new BattlegroundsStartOfBattleLegacySnapshot(parserState, stateFacade);
	}

	AppliesOnNewNode(node: Node, stateType: StateType): boolean {
		return stateType === StateType.GameState && this.IsApplyOnNewNode(node);
	}

	IsApplyOnNewNode(node: Node): boolean {
		return (
			this.StateFacade.IsBattlegroundsDuos() &&
			node.Type === NodeType.TagChange &&
			(node.Object as TagChange).Name === (GameTag.STEP as number) &&
			(node.Object as TagChange).Value === (Step.MAIN_END as number) &&
			(this.GameState.GetGameEntity()?.GetTag(GameTag.BOARD_VISUAL_STATE) ?? 0) < 2
		);
	}

	AppliesOnCloseNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;

		this.GameState.BgsHasSentNextOpponent = false;

		return [
			GameEventProvider.Create(
				tagChange.TimeStamp,
				'BATTLEGROUNDS_ACTIVE_PLAYER_BOARD',
				() => ({
					Type: 'BATTLEGROUNDS_ACTIVE_PLAYER_BOARD',
					Value: {},
				}),
				true,
				node,
			),
		];
	}

	CreateGameEventProviderFromClose(_node: Node): GameEventProvider[] | null {
		return null;
	}

	static CreateProviderFromAction(
		player: Player,
		isOpponent: boolean,
		mainPlayer: Player,
		gameState: GameState,
		stateFacade: StateFacade,
	): PlayerBoard | null {
		const potentialHeroes = [...gameState.CurrentEntities.values()]
			.filter((entity) => entity.GetTag(GameTag.CARDTYPE) === (CardType.HERO as number))
			.filter((entity) => entity.GetTag(GameTag.ZONE) === (Zone.PLAY as number))
			.filter((entity) => entity.GetEffectiveController() === player.PlayerId)
			.filter((entity) => !!entity.IsBaconBartender() && entity.CardId !== CardIds.BaconphheroHeroic);
		let hero: FullEntity | null = potentialHeroes[0]?.Clone() ?? null;
		let cardId: string | null = hero?.CardId ?? null;
		let playerId = hero?.GetTag(GameTag.PLAYER_ID) ?? player.PlayerId;
		const currentEntities = [...gameState.CurrentEntities.values()];

		if (hero == null || hero.IsBaconGhost() || hero?.GetTag(GameTag.BACON_BOB_SKIN) === 1) {
			const playerEntity =
				currentEntities
					.filter((entity) => entity.GetTag(GameTag.CARDTYPE) === (CardType.HERO as number))
					.filter((entity) => entity.GetTag(GameTag.ZONE) === (Zone.PLAY as number))
					.filter((entity) => entity.GetEffectiveController() === mainPlayer.PlayerId)
					.filter(
						(entity) =>
							!entity.IsBaconBartender() && !entity.IsBaconGhost() && !entity.IsBaconEnchantment(),
					)
					.sort((a, b) => a.Id - b.Id)
					.pop() ?? null;
			const nextOpponentPlayerId = playerEntity?.GetTag(GameTag.NEXT_OPPONENT_PLAYER_ID) ?? -1;

			const nextOpponentCandidates = currentEntities
				.filter((entity) => entity.GetTag(GameTag.CARDTYPE) === (CardType.HERO as number))
				.filter((entity) => entity.GetTag(GameTag.PLAYER_ID) === nextOpponentPlayerId)
				.filter(
					(entity) => !entity.IsBaconBartender() && !entity.IsBaconGhost() && !entity.IsBaconEnchantment(),
				);
			const nextOpponent =
				nextOpponentCandidates == null || nextOpponentCandidates.length === 0
					? null
					: nextOpponentCandidates[0];

			hero = nextOpponent;
			cardId = nextOpponent?.CardId ?? null;
			playerId = nextOpponent?.GetTag(GameTag.PLAYER_ID) ?? playerId;
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
				.filter((entity) => entity.GetEffectiveController() === player.PlayerId)
				.filter((entity) => (isOpponent ? entity.GetTag(GameTag.NUM_TURNS_IN_PLAY) <= 1 : true))
				.filter((entity) => entity.GetTag(GameTag.ZONE) === (Zone.PLAY as number))
				.filter((entity) => entity.TakesBoardSpace())
				.sort((a, b) => a.GetTag(GameTag.ZONE_POSITION) - b.GetTag(GameTag.ZONE_POSITION))
				.map((entity) => entity.Clone())
				.map((entity) => BattlegroundsPlayerBoardParser.EnhanceEntities(entity, gameState, stateFacade));
			const secrets = currentEntities
				.filter((entity) => entity.GetEffectiveController() === player.PlayerId)
				.filter((entity) => entity.GetTag(GameTag.ZONE) === (Zone.SECRET as number))
				.filter((entity) => entity.GetTag(GameTag.BACON_IS_BOB_QUEST) !== 1)
				.filter((entity) => entity.GetTag(GameTag.QUEST) !== 1)
				.filter((entity) => entity.GetTag(GameTag.SIDE_QUEST) !== 1)
				.sort((a, b) => a.GetTag(GameTag.ZONE_POSITION) - b.GetTag(GameTag.ZONE_POSITION))
				.map((entity) => entity.Clone())
				.map((entity) =>
					BattlegroundsPlayerBoardParser.BuildEntityWithCardIdFromTheFuture(
						entity,
						stateFacade.GsState!.GameState,
					),
				);
			let hand: (FullEntity | BgsPlayerBoardEntity)[] = currentEntities
				.filter((entity) => entity.GetEffectiveController() === player.PlayerId)
				.filter((entity) => entity.GetTag(GameTag.ZONE) === (Zone.HAND as number))
				.sort((a, b) => a.GetTag(GameTag.ZONE_POSITION) - b.GetTag(GameTag.ZONE_POSITION))
				.map((entity) => entity.Clone());
			if (isOpponent) {
				hand = hand
					.map(
						(e) =>
							BattlegroundsActivePlayerBoardParser.GetEntitySpawnedFromHand(e.Id, board, stateFacade) ??
							e,
					)
					.map((e) => {
						if (e instanceof FullEntity) {
							return e.SetTag(GameTag.DAMAGE, 0).SetTag(GameTag.ZONE, Zone.HAND as number) as FullEntity;
						}
						return e;
					});
			}
			const heroPower =
				currentEntities
					.filter((entity) => entity.GetEffectiveController() === player.PlayerId)
					.filter((entity) => entity.GetTag(GameTag.ZONE) === (Zone.PLAY as number))
					.filter((entity) => entity.GetTag(GameTag.CARDTYPE) === (CardType.HERO_POWER as number))
					.map((entity) => entity.Clone())[0] ?? null;
			if (heroPower == null) {
				console.debug('WARNING: could not find hero power', '');
			}
			const heroPowerUsed = heroPower?.GetTag(GameTag.BACON_HERO_POWER_ACTIVATED) === 1;
			const heroPowerCreatedEntity: string | null = null;
			const finalBoard = board.map((entity) =>
				BattlegroundsPlayerBoardParser.AddEnchantments(gameState.CurrentEntities, entity),
			);
			if (finalBoard.length > 7) {
				console.debug('Too many entities on board', '');
			}

			const questRewardRawEntities = currentEntities
				.filter((entity) => entity.GetEffectiveController() === player.PlayerId)
				.filter((entity) => entity.GetTag(GameTag.ZONE) === (Zone.PLAY as number))
				.filter((entity) => entity.GetTag(GameTag.CARDTYPE) === (CardType.BATTLEGROUND_QUEST_REWARD as number))
				.map((entity) => entity.Clone());
			const questRewards = questRewardRawEntities.map((entity) => entity.CardId);
			const questRewardEntities: QuestReward[] = questRewardRawEntities.map((entity) => ({
				CardId: entity.CardId,
				AvengeCurrent: 0,
				AvengeDefault: 0,
				ScriptDataNum1: entity.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_1, 0),
			}));
			const questEntities: QuestEntity[] = currentEntities
				.filter((entity) => entity.GetEffectiveController() === player.PlayerId)
				.filter((entity) => entity.GetTag(GameTag.ZONE) === (Zone.SECRET as number))
				.filter((entity) => entity.GetTag(GameTag.CARDTYPE) === (CardType.SPELL as number))
				.filter((entity) => entity.GetTag(GameTag.QUEST) === 1)
				.map((entity) => ({
					CardId: entity.CardId,
					RewardDbfId: entity.GetTag(GameTag.QUEST_REWARD_DATABASE_ID, 0),
					ProgressCurrent: entity.GetTag(GameTag.QUEST_PROGRESS, 0),
					ProgressTotal: entity.GetTag(GameTag.QUEST_PROGRESS_TOTAL, 0),
				}));

			const eternalKnightBonus = BattlegroundsActivePlayerBoardParser.GetPlayerEnchantmentValue(
				player.PlayerId,
				CardIds.EternalKnightPlayerEnchantEnchantment,
				gameState,
			);
			const tavernSpellsCastThisGame =
				gameState.CurrentEntities.get(player.Id)?.GetTag(GameTag.TAVERN_SPELLS_PLAYED_THIS_GAME, 0) ?? 0;
			const spellsCastThisGame =
				gameState.CurrentEntities.get(player.Id)?.GetTag(GameTag.NUM_SPELLS_PLAYED_THIS_GAME, 0) ?? 0;
			const undeadAttackBonus = BattlegroundsActivePlayerBoardParser.GetPlayerEnchantmentValue(
				player.PlayerId,
				CardIds.UndeadBonusAttackPlayerEnchantDntEnchantment,
				gameState,
			);
			const hauntedCarapaceAttackBonus = BattlegroundsActivePlayerBoardParser.GetPlayerEnchantmentValue(
				player.PlayerId,
				CardIds.HauntedCarapacePlayerEnchantDntEnchantment_BG33_112pe,
				gameState,
			);
			const hauntedCarapaceHealthBonus = BattlegroundsActivePlayerBoardParser.GetPlayerEnchantmentValue(
				player.PlayerId,
				CardIds.HauntedCarapacePlayerEnchantDntEnchantment_BG33_112pe,
				gameState,
				GameTag.TAG_SCRIPT_DATA_NUM_2,
			);
			const goldrinnBuffAtk = BattlegroundsActivePlayerBoardParser.GetPlayerEnchantmentValue(
				player.PlayerId,
				CardIds.GoldrinnPlayerEnchantEnchantment_BGS_018pe,
				gameState,
			);
			const goldrinnBuffHealth = BattlegroundsActivePlayerBoardParser.GetPlayerEnchantmentValue(
				player.PlayerId,
				CardIds.GoldrinnPlayerEnchantEnchantment_BGS_018pe,
				gameState,
				GameTag.TAG_SCRIPT_DATA_NUM_2,
			);
			const frostlingBonus = BattlegroundsActivePlayerBoardParser.GetPlayerTag(
				player.Id,
				GameTag.BACON_ELEMENTALS_PLAYED_THIS_GAME,
				gameState,
			);
			const piratesPlayedThisGame = BattlegroundsActivePlayerBoardParser.GetPlayerTag(
				player.Id,
				GameTag.BACON_PIRATES_PLAYED_THIS_GAME,
				gameState,
			);
			const piratesSummonedThisGame = BattlegroundsActivePlayerBoardParser.GetPlayerTag(
				player.Id,
				GameTag.BACON_PIRATES_SUMMONED_THIS_GAME,
				gameState,
			);
			const beastsSummonedThisGame = BattlegroundsActivePlayerBoardParser.GetPlayerTag(
				player.Id,
				GameTag.BACON_BEASTS_SUMMONED_THIS_GAME,
				gameState,
			);
			const magnetizedThisGame = BattlegroundsActivePlayerBoardParser.GetPlayerTag(
				player.Id,
				GameTag.BACON_NUM_MAGNETIZE_THIS_GAME,
				gameState,
			);
			const astralAutomatonBonus = BattlegroundsActivePlayerBoardParser.GetPlayerEnchantmentValue(
				player.PlayerId,
				CardIds.AstralAutomatonPlayerEnchantDntEnchantment_BG_TTN_401pe,
				gameState,
			);
			const bloodGemEnchant =
				currentEntities
					.filter((entity) => entity.GetEffectiveController() === player.PlayerId)
					.filter((entity) => entity.GetTag(GameTag.ZONE) === (Zone.PLAY as number))
					.filter((entity) => entity.CardId === CardIds.BloodGemPlayerEnchantEnchantment)[0] ?? null;
			const bloodGemAttackBonus = bloodGemEnchant?.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_1, 0) ?? 0;
			const bloodGemHealthBonus = bloodGemEnchant?.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_2, 0) ?? 0;
			const choralEnchantments = [...(stateFacade.GsState?.GameState?.CurrentEntities?.values() ?? [])]
				.filter((e) => e.CardId === CardIds.ChoralMrrrglr_ChorusEnchantment)
				.filter((e) => board.map((b) => b.Id).includes(e.GetTag(GameTag.ATTACHED)));
			const choralEnchantment = choralEnchantments[0] ?? null;
			const choralSource =
				choralEnchantment == null
					? null
					: (gameState.CurrentEntities.get(choralEnchantment.GetTag(GameTag.ATTACHED)) ?? null);
			const isChoralPremium = choralSource?.GetTag(GameTag.PREMIUM) === 1;
			const beetleArmy = BattlegroundsPlayerBoardParser.GetTupleEnchantmentValue(
				playerId,
				CardIds.BeetleArmyPlayerEnchantDntEnchantment_BG31_808pe,
				currentEntities,
			);
			const sanlaynScribesDeadThisGame = BattlegroundsPlayerBoardParser.GetTupleEnchantmentValue(
				playerId,
				CardIds.SanlaynScribePlayerEnchantDntEnchantment_BGDUO31_208pe,
				currentEntities,
			);
			const battlecriesTriggeredThisGame = BattlegroundsActivePlayerBoardParser.GetPlayerTag(
				player.Id,
				GameTag.BATTLECRIES_TRIGGERED_THIS_GAME,
				gameState,
			);
			const friendlyMinionsDeadLastCombat = BattlegroundsActivePlayerBoardParser.GetPlayerTag(
				player.Id,
				GameTag.NUM_FRIENDLY_MINIONS_THAT_DIED_LAST_TURN,
				gameState,
			);
			const elementalHealthBuff = BattlegroundsActivePlayerBoardParser.GetPlayerTag(
				player.Id,
				GameTag.BACON_ELEMENTAL_BUFFHEALTHVALUE,
				gameState,
			);
			const elementalAttackBuff = BattlegroundsActivePlayerBoardParser.GetPlayerTag(
				player.Id,
				GameTag.BACON_ELEMENTAL_BUFFATKVALUE,
				gameState,
			);
			const tavernSpellHealthBuff = BattlegroundsActivePlayerBoardParser.GetPlayerTag(
				player.Id,
				GameTag.TAVERN_SPELL_HEALTH_INCREASE,
				gameState,
			);
			const tavernSpellAttackBuff = BattlegroundsActivePlayerBoardParser.GetPlayerTag(
				player.Id,
				GameTag.TAVERN_SPELL_ATTACK_INCREASE,
				gameState,
			);
			const goldSpentThisGame = BattlegroundsActivePlayerBoardParser.GetPlayerTag(
				player.Id,
				GameTag.NUM_RESOURCES_SPENT_THIS_GAME,
				gameState,
			);
			const deepBluesPlayed = BattlegroundsActivePlayerBoardParser.GetPlayerEnchantmentValue(
				player.Id,
				CardIds.DeepBlueCroonerPlayerEnchantDntEnchantment,
				gameState,
			);
			const volumizerAttackBuff = BattlegroundsActivePlayerBoardParser.GetPlayerTag(
				player.Id,
				GameTag.BACON_VOLUMIZER_ATTACK_BUFF,
				gameState,
			);
			const volumizerHealthBuff = BattlegroundsActivePlayerBoardParser.GetPlayerTag(
				player.Id,
				GameTag.BACON_VOLUMIZER_HEALTH_BUFF,
				gameState,
			);
			const whelpAttackBuff = BattlegroundsActivePlayerBoardParser.GetPlayerEnchantmentValue(
				player.Id,
				CardIds.WhelpBuffPlayerEnchantDntEnchantment_BG34_402pe,
				gameState,
			);
			const whelpHealthBuff = BattlegroundsActivePlayerBoardParser.GetPlayerEnchantmentValue(
				player.Id,
				CardIds.WhelpBuffPlayerEnchantDntEnchantment_BG34_402pe,
				gameState,
				GameTag.TAG_SCRIPT_DATA_NUM_2,
			);
			const cardsPlayedThisTurn = BattlegroundsPlayerBoardParser.GetPlayerTag(
				playerId,
				GameTag.NUM_CARDS_PLAYED_THIS_TURN,
				currentEntities,
			);
			const mrrgltonsPlayedThisGame = BattlegroundsPlayerBoardParser.GetPlayerTag(
				playerId,
				GameTag.BACON_MRRGLTON_PLAYED_THIS_GAME,
				currentEntities,
			);
			const backToBackCastThisGame = BattlegroundsPlayerBoardParser.GetPlayerTag(
				playerId,
				GameTag.BACON_BACK_TO_BACK_CAST_THIS_GAME,
				currentEntities,
			);
			const tavernSpellsCastThisTurn = BattlegroundsActivePlayerBoardParser.GetPlayerTag(
				player.Id,
				GameTag.SPELLS_PLAYED_THIS_TURN,
				gameState,
			);
			const deathrattlesTriggeredThisGame = BattlegroundsActivePlayerBoardParser.GetPlayerTag(
				player.Id,
				GameTag.DEATHRATTLES_TRIGGERED_THIS_GAME,
				gameState,
			);
			const trinkets = BattlegroundsPlayerBoardParser.BuildTrinkets(player.PlayerId, gameState);

			let heroPowerInfo: any = heroPower?.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_1) ?? 0;
			const heroPowerInfo2 = heroPower?.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_2) ?? 0;
			if (heroPowerUsed && heroPower?.CardId === CardIds.EmbraceYourRage && heroPowerInfo === -1) {
				const createdEntity =
					[...(stateFacade.GsState?.GameState?.CurrentEntities?.values() ?? [])]
						.filter((e) => e.GetTag(GameTag.CREATOR) === heroPower.Entity)
						.filter((e) => e.GetCardType() === (CardType.MINION as number))
						.reverse()[0] ?? null;
				heroPowerInfo = createdEntity?.CardId ?? null;
			}

			return {
				Hero: hero,
				HeroPowers: [],
				HeroPowerCardId: heroPower?.CardId ?? null,
				HeroPowerEntityId: heroPower?.Entity ?? -1,
				HeroPowerUsed: heroPowerUsed,
				HeroPowerInfo: heroPowerInfo,
				HeroPowerInfo2: heroPowerInfo2,
				HeroPowerCreatedEntity: heroPowerCreatedEntity,
				CardId: cardId,
				PlayerId: playerId,
				PlayerEntityId: player.Id,
				Board: finalBoard,
				QuestEntities: questEntities,
				QuestRewards: questRewards,
				QuestRewardEntities: questRewardEntities,
				Secrets: secrets,
				Hand: hand as BgsPlayerBoardEntity[],
				Trinkets: trinkets,
				GlobalInfo: {
					EternalKnightsDeadThisGame: eternalKnightBonus,
					TavernSpellsCastThisGame: tavernSpellsCastThisGame,
					UndeadAttackBonus: undeadAttackBonus,
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
					ChoralAttackBuff:
						(choralEnchantment?.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_1, 0) ?? 0) / (isChoralPremium ? 2 : 1),
					ChoralHealthBuff:
						(choralEnchantment?.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_2, 0) ?? 0) / (isChoralPremium ? 2 : 1),
					BeetleAttackBuff: beetleArmy[0],
					BeetleHealthBuff: beetleArmy[1],
					ElementalHealthBuff: elementalHealthBuff,
					ElementalAttackBuff: elementalAttackBuff,
					TavernSpellHealthBuff: tavernSpellHealthBuff,
					TavernSpellAttackBuff: tavernSpellAttackBuff,
					BattlecriesTriggeredThisGame: battlecriesTriggeredThisGame,
					FriendlyMinionsDeadLastCombat: friendlyMinionsDeadLastCombat,
					SpellsCastThisGame: spellsCastThisGame,
					SanlaynScribesDeadThisGame: sanlaynScribesDeadThisGame?.[0] ?? 0,
					GoldSpentThisGame: goldSpentThisGame,
					GoldrinnBuffAtk: goldrinnBuffAtk,
					GoldrinnBuffHealth: goldrinnBuffHealth,
					DeepBluesPlayed: deepBluesPlayed,
					VolumizerAttackBuff: volumizerAttackBuff,
					VolumizerHealthBuff: volumizerHealthBuff,
					WhelpAttackBuff: whelpAttackBuff,
					WhelpHealthBuff: whelpHealthBuff,
					DeathrattlesTriggeredThisGame: deathrattlesTriggeredThisGame,
					TavernSpellsCastThisTurn: tavernSpellsCastThisTurn,
					MrrgltonsPlayedThisGame: mrrgltonsPlayedThisGame,
					CardsPlayedThisTurn: cardsPlayedThisTurn,
					BackToBackCastThisGame: backToBackCastThisGame,
				},
			};
		}
		return null;
	}

	static GetPlayerEnchantmentValue(
		playerId: number,
		enchantment: string,
		gameState: GameState,
		gameTag: GameTag = GameTag.TAG_SCRIPT_DATA_NUM_1,
	): number {
		return (
			[...gameState.CurrentEntities.values()]
				.filter((entity) => entity.GetEffectiveController() === playerId)
				.filter((entity) => entity.GetTag(GameTag.ZONE) === (Zone.PLAY as number))
				.find((entity) => entity.CardId === enchantment)
				?.GetTag(gameTag) ?? 0
		);
	}

	static GetPlayerTag(playerEntityId: number, tag: GameTag, gameState: GameState): number {
		return gameState.CurrentEntities.get(playerEntityId)?.GetTag(tag, 0) ?? 0;
	}

	private static GetEntitySpawnedFromHand(
		id: number,
		board: FullEntity[],
		stateFacade: StateFacade,
	): FullEntity | null {
		const entityInHand = stateFacade.GsState?.GameState?.CurrentEntities?.get(id);
		if (entityInHand == null) return null;
		const clone = entityInHand.Clone();

		BattlegroundsActivePlayerBoardParser.OverrideTagWithHistory(clone, GameTag.HEALTH);
		BattlegroundsActivePlayerBoardParser.OverrideTagWithHistory(clone, GameTag.ATK);
		BattlegroundsActivePlayerBoardParser.OverrideTagWithHistory(clone, GameTag.LITERALLY_UNPLAYABLE);
		BattlegroundsActivePlayerBoardParser.OverrideTagWithHistory(clone, GameTag.UNPLAYABLE_VISUALS);

		return clone;
	}

	private static OverrideTagWithHistory(entity: FullEntity, tag: GameTag): void {
		const tagsBeforeCutoff: { Name: number; Value: number }[] = [];
		for (const t of entity.TagsHistory) {
			if (t.Name === (GameTag.SHOW_ENTITY_START as number)) break;
			tagsBeforeCutoff.push(t);
		}
		const tags = tagsBeforeCutoff.filter((t) => t.Name === (tag as number));
		let tagInHand: number | undefined;
		if (tags.length === 1) {
			tagInHand = tags[0].Value;
		} else {
			tagInHand = tags.length > 1 ? tags[1]?.Value : undefined;
		}
		entity.SetTag(tag, tagInHand ?? entity.GetTag(tag));
	}
}
