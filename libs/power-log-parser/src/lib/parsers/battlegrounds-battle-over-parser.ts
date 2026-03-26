import { BlockType, CardIds, CardType, GameTag, PlayState, Zone } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider } from '../game-event';
import { Action, FullEntity, Node, NodeType, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class BattlegroundsBattleOverParser implements ActionParser {
	readonly ParserName = 'BattlegroundsBattleOverParser';

	private GameState: GameState;
	private ParserState: ParserState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, helper: StateFacade) {
		this.ParserState = parserState;
		this.GameState = parserState.GameState;
		this.StateFacade = helper;
	}

	AppliesOnNewNode(node: Node, stateType: StateType): boolean {
		return (
			stateType === StateType.PowerTaskList &&
			this.StateFacade.IsBattlegrounds() &&
			!this.GameState.BattleResultSent &&
			node.Type === NodeType.TagChange &&
			(node.Object as TagChange).Name === (GameTag.BOARD_VISUAL_STATE as number) &&
			(node.Object as TagChange).Value === 1
		);
	}

	AppliesOnCloseNode(node: Node, stateType: StateType): boolean {
		return (
			stateType === StateType.PowerTaskList &&
			this.StateFacade.IsBattlegrounds() &&
			node.Type === NodeType.Action &&
			(node.Object as Action).Type === (BlockType.TRIGGER as number) &&
			(node.Object as Action).EffectIndex === 14
		);
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		this.GameState.BattleResultSent = true;
		const tagChange = node.Object as TagChange;
		let opponentCardId: string | null = this.GameState.BgsCurrentBattleOpponent;
		let opponentPlayerId = this.GameState.BgsCurrentBattleOpponentPlayerId;
		const mainPlayer = this.StateFacade.LocalPlayer!;
		if (opponentCardId == null || this.isBaconGhost(opponentCardId)) {
			const playerEntity = [...this.GameState.CurrentEntities.values()]
				.filter((entity) => entity.GetTag(GameTag.CARDTYPE) === (CardType.HERO as number))
				.filter((entity) => entity.GetTag(GameTag.ZONE) === (Zone.PLAY as number))
				.filter((entity) => entity.GetEffectiveController() === mainPlayer.PlayerId)
				.filter(
					(entity) =>
						!entity.IsBaconBartender() &&
						!entity.IsBaconGhost() &&
						!entity.IsBaconEnchantment(),
				)
				.sort((a, b) => a.Id - b.Id)
				.pop();
			const nextOpponentPlayerId = playerEntity!.GetTag(GameTag.NEXT_OPPONENT_PLAYER_ID);

			const nextOpponentCandidates = [...this.GameState.CurrentEntities.values()]
				.filter((entity) => entity.GetTag(GameTag.CARDTYPE) === (CardType.HERO as number))
				.filter((entity) => entity.GetTag(GameTag.PLAYER_ID) === nextOpponentPlayerId)
				.filter(
					(entity) =>
						!entity.IsBaconBartender() &&
						!entity.IsBaconGhost() &&
						!entity.IsBaconEnchantment(),
				);
			const nextOpponent = nextOpponentCandidates.length === 0 ? null : nextOpponentCandidates[0];

			opponentCardId = nextOpponent?.CardId ?? null;
			opponentPlayerId = nextOpponent?.GetTag(GameTag.PLAYER_ID) ?? 0;
		}

		return [
			GameEventProvider.Create(
				tagChange.TimeStamp,
				'BATTLEGROUNDS_BATTLE_RESULT',
				() => ({
					Type: 'BATTLEGROUNDS_BATTLE_RESULT',
					Value: {
						Opponent: opponentCardId,
						OpponentPlayerId: opponentPlayerId,
						Result: 'tied',
					},
				}),
				true,
				node,
			),
		];
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		const action = node.Object as Action;
		const actionEntity = this.GameState.CurrentEntities.get(action.Entity)!;
		if (actionEntity.CardId !== 'TB_BaconShop_8P_PlayerE') {
			return null;
		}

		const isAttackNode =
			action.Data.filter((data) => data instanceof TagChange)
				.map((data) => data as unknown as TagChange)
				.filter(
					(tag) =>
						tag.Name === (GameTag.HIGHLIGHT_ATTACKING_MINION_DURING_COMBAT as number) &&
						tag.Value === 0,
				).length > 0;
		if (!isAttackNode) {
			return null;
		}

		this.GameState.BattleResultSent = true;
		const attackAction = action.Data.filter((data) => data instanceof Action)
			.map((data) => data as unknown as Action)
			.find((act) => act.Type === (BlockType.ATTACK as number));

		let opponentPlayerId = this.StateFacade.OpponentPlayer!.PlayerId;
		if (attackAction == null) {
			let battleResult = 'tied';
			const gsPlayer = this.StateFacade.GsState!.GameState.CurrentEntities.get(
				this.StateFacade.LocalPlayer!.Id,
			)!;
			if (gsPlayer.GetTag(GameTag.PLAYSTATE) === (PlayState.LOST as number)) {
				battleResult = 'lost';
			} else if (gsPlayer.GetTag(GameTag.PLAYSTATE) === (PlayState.WON as number)) {
				battleResult = 'won';
			}

			let opponentHero: FullEntity | undefined = [...this.GameState.CurrentEntities.values()]
				.filter((data) => data.GetEffectiveController() === opponentPlayerId)
				.filter((data) => data.GetTag(GameTag.CARDTYPE) === (CardType.HERO as number))
				.filter((data) => data.GetTag(GameTag.ZONE) === (Zone.PLAY as number))
				.find(() => true);
			let cardId = opponentHero?.CardId ?? null;
			if (cardId != null && this.isBaconGhost(cardId)) {
				const player = this.GameState.CurrentEntities.get(this.StateFacade.LocalPlayer!.Id)!;
				opponentPlayerId = player.GetTag(GameTag.NEXT_OPPONENT_PLAYER_ID);
				opponentHero = [...this.GameState.CurrentEntities.values()]
					.filter((entity) => entity.GetTag(GameTag.PLAYER_ID) === opponentPlayerId)
					.filter(
						(entity) =>
							!entity.IsBaconBartender() &&
							!entity.IsBaconGhost() &&
							!entity.IsBaconEnchantment(),
					)
					.find(() => true);
				cardId = opponentHero?.CardId ?? null;
			}

			return [
				GameEventProvider.Create(
					action.TimeStamp,
					'BATTLEGROUNDS_BATTLE_RESULT',
					() => ({
						Type: 'BATTLEGROUNDS_BATTLE_RESULT',
						Value: {
							Opponent: cardId,
							OpponentPlayerId: opponentPlayerId,
							Result: battleResult,
						},
					}),
					true,
					node,
				),
			];
		}

		const winner = this.GameState.CurrentEntities.get(attackAction.Entity)!;
		const result =
			winner.GetEffectiveController() === this.StateFacade.LocalPlayer!.PlayerId ? 'won' : 'lost';
		const damageTag = attackAction.Data.filter((data) => data instanceof TagChange)
			.map((data) => data as unknown as TagChange)
			.find((tag) => tag.Name === (GameTag.PREDAMAGE as number));
		const attackerEntityId = attackAction.Data.filter((data) => data instanceof TagChange)
			.map((data) => data as unknown as TagChange)
			.find(
				(tag) => tag.Name === (GameTag.ATTACKING as number) && tag.Value === 1,
			)!.Entity;
		const defenderEntityId = attackAction.Data.filter((data) => data instanceof TagChange)
			.map((data) => data as unknown as TagChange)
			.find(
				(tag) => tag.Name === (GameTag.DEFENDING as number) && tag.Value === 1,
			)!.Entity;
		const opponentEntityId =
			this.GameState.CurrentEntities.get(attackerEntityId)!.GetEffectiveController() ===
			this.StateFacade.LocalPlayer!.PlayerId
				? defenderEntityId
				: attackerEntityId;
		let opponentCardId = this.GameState.CurrentEntities.get(opponentEntityId)!.CardId;
		opponentPlayerId = this.GameState.CurrentEntities.get(opponentEntityId)!.GetTag(GameTag.PLAYER_ID);
		const mainPlayer = this.StateFacade.LocalPlayer!;
		if (opponentCardId === CardIds.Kelthuzad_TB_BaconShop_HERO_KelThuzad) {
			const playerEntity = [...this.GameState.CurrentEntities.values()]
				.filter((entity) => entity.GetTag(GameTag.CARDTYPE) === (CardType.HERO as number))
				.filter((entity) => entity.GetTag(GameTag.ZONE) === (Zone.PLAY as number))
				.filter((entity) => entity.GetEffectiveController() === mainPlayer.PlayerId)
				.filter(
					(entity) =>
						!entity.IsBaconBartender() &&
						!entity.IsBaconGhost() &&
						!entity.IsBaconEnchantment(),
				)
				.sort((a, b) => a.Id - b.Id)
				.pop();
			const nextOpponentPlayerId = playerEntity?.GetTag(GameTag.NEXT_OPPONENT_PLAYER_ID);

			const nextOpponentCandidates = [...this.GameState.CurrentEntities.values()]
				.filter((entity) => entity.GetTag(GameTag.CARDTYPE) === (CardType.HERO as number))
				.filter((entity) => entity.GetTag(GameTag.PLAYER_ID) === nextOpponentPlayerId)
				.filter(
					(entity) =>
						!entity.IsBaconBartender() &&
						!entity.IsBaconGhost() &&
						!entity.IsBaconEnchantment(),
				);
			const nextOpponent = nextOpponentCandidates.length === 0 ? null : nextOpponentCandidates[0];

			opponentCardId = nextOpponent?.CardId ?? opponentCardId;
			opponentPlayerId = nextOpponentPlayerId ?? 0;
		}
		const damage = damageTag != null ? damageTag.Value : 0;

		return [
			GameEventProvider.Create(
				action.TimeStamp,
				'BATTLEGROUNDS_BATTLE_RESULT',
				() => ({
					Type: 'BATTLEGROUNDS_BATTLE_RESULT',
					Value: {
						Opponent: opponentCardId,
						OpponentPlayerId: opponentPlayerId,
						Result: result,
						Damage: damage,
					},
				}),
				true,
				node,
			),
		];
	}

	private isBaconGhost(cardId: string): boolean {
		return (
			cardId === CardIds.LadyDeathwhisper_TB_BaconShop_HERO_Deathwhisper ||
			cardId === CardIds.Kelthuzad_TB_BaconShop_HERO_KelThuzad
		);
	}
}
