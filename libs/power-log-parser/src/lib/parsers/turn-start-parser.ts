import { GameTag, Step, Zone } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider } from '../game-event';
import { FullEntity, GameEntity, Node, NodeType, TagChange } from '../models';
import { Logger } from '../logger';
import { Utility } from '../utility';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

interface Hero {
	CardId: string;
	PlayerId: number;
	EntityId: number;
	Health: number;
	Armor: number;
}

export class TurnStartParser implements ActionParser {
	readonly ParserName = 'TurnStartParser';

	private GameState: GameState;
	private ParserState: ParserState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, stateFacade: StateFacade) {
		this.ParserState = parserState;
		this.GameState = parserState.GameState;
		this.StateFacade = stateFacade;
	}

	AppliesOnNewNode(node: Node, stateType: StateType): boolean {
		const isNormalTurnChange =
			!this.ParserState.IsMercenaries() &&
			node.Type === NodeType.TagChange &&
			(node.Object as TagChange).Name === (GameTag.TURN as number) &&
			this.GameState.GetGameEntity()?.Entity === (node.Object as TagChange).Entity;
		const isMercenariesTurnChange =
			this.ParserState.IsMercenaries() &&
			node.Type === NodeType.TagChange &&
			(node.Object as TagChange).Name === (GameTag.STEP as number) &&
			(node.Object as TagChange).Value === (Step.MAIN_PRE_ACTION as number) &&
			this.GameState.GetGameEntity()?.Entity === (node.Object as TagChange).Entity &&
			!this.IsSelectingMercs();
		return stateType === StateType.PowerTaskList && (isNormalTurnChange || isMercenariesTurnChange);
	}

	AppliesOnCloseNode(node: Node, stateType: StateType): boolean {
		const isGameNode = node.Type === NodeType.GameEntity;
		return (
			stateType === StateType.PowerTaskList &&
			(this.ParserState.ReconnectionOngoing || this.StateFacade.Spectating) &&
			isGameNode
		);
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		const newTurnValue =
			tagChange.Name === (GameTag.TURN as number)
				? tagChange.Value
				: this.GameState.CurrentTurn + 1;
		this.GameState.CurrentTurn = newTurnValue;
		const result: GameEventProvider[] = [];
		this.GameState.ClearPlagiarize();
		this.GameState.OnNewTurn();

		const timestamp = Utility.GetUtcTimestamp(tagChange.TimeStamp);
		const currentPlayer = this.GameState.GetActivePlayerId();
		result.push(
			GameEventProvider.Create(
				tagChange.TimeStamp,
				'TURN_START',
				() => ({
					Type: 'TURN_START',
					Value: {
						Turn: newTurnValue,
						ActivePlayerId: currentPlayer,
						LocalPlayer: this.StateFacade.LocalPlayer,
						OpponentPlayer: this.StateFacade.OpponentPlayer,
						Timestamp: timestamp,
					},
				}),
				false,
				node,
			),
		);

		if (this.StateFacade.IsBattlegrounds()) {
			const visualBoardState = this.GameState.GetGameEntity()?.GetTag(GameTag.BOARD_VISUAL_STATE);
			if (newTurnValue % 2 === 0) {
				Logger.Log('Prep BATTLEGROUNDS_COMBAT_START', '');
				this.GameState.BattleResultSent = false;
				const heroes = this.BuildHeroes(this.GameState);
				result.push(
					GameEventProvider.Create(
						tagChange.TimeStamp,
						'BATTLEGROUNDS_COMBAT_START',
						() => ({
							Type: 'BATTLEGROUNDS_COMBAT_START',
							Value: {
								Turn: newTurnValue,
								Heroes: heroes,
								VisualBoardState: visualBoardState,
							},
						}),
						false,
						node,
					),
				);
			} else {
				Logger.Log('Prep BATTLEGROUNDS_RECRUIT_PHASE', '');
				const heroes = this.BuildHeroes(this.GameState);
				result.push(
					GameEventProvider.Create(
						tagChange.TimeStamp,
						'BATTLEGROUNDS_RECRUIT_PHASE',
						() => ({
							Type: 'BATTLEGROUNDS_RECRUIT_PHASE',
							Value: {
								Turn: newTurnValue,
								Heroes: heroes,
								VisualBoardState: visualBoardState,
							},
						}),
						false,
						node,
					),
				);
			}

			if (newTurnValue % 2 !== 0) {
				if (!this.GameState.BgsHasSentNextOpponent) {
					result.push(
						GameEventProvider.Create(
							tagChange.TimeStamp,
							'BATTLEGROUNDS_NEXT_OPPONENT',
							() => ({
								Type: 'BATTLEGROUNDS_NEXT_OPPONENT',
								Value: {
									IsSameOpponent: true,
								},
							}),
							true,
							node,
						),
					);
					this.GameState.BgsHasSentNextOpponent = true;
				}
			}
		}
		return result;
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		const gameEntity = node.Object as GameEntity;
		const currentTurn = gameEntity.GetTag(GameTag.TURN);
		this.GameState.CurrentTurn = currentTurn;

		const result: GameEventProvider[] = [];
		const timestamp = Utility.GetUtcTimestamp(gameEntity.TimeStamp);
		result.push(
			GameEventProvider.Create(
				gameEntity.TimeStamp,
				'TURN_START',
				() => ({
					Type: 'TURN_START',
					Value: {
						Turn: currentTurn,
						LocalPlayer: this.StateFacade.LocalPlayer,
						OpponentPlayer: this.StateFacade.OpponentPlayer,
						Timestamp: timestamp,
						ActivePlayerId: this.GameState.GetActivePlayerId(),
					},
				}),
				this.StateFacade.Spectating,
				node,
			),
		);

		if (this.StateFacade.IsBattlegrounds()) {
			const visualBoardState = this.GameState.GetGameEntity()?.GetTag(GameTag.BOARD_VISUAL_STATE);
			if (currentTurn % 2 === 0) {
				this.GameState.BattleResultSent = false;
				const heroes = this.BuildHeroes(this.GameState);
				result.push(
					GameEventProvider.Create(
						gameEntity.TimeStamp,
						'BATTLEGROUNDS_COMBAT_START',
						() => ({
							Type: 'BATTLEGROUNDS_COMBAT_START',
							Value: {
								Turn: currentTurn,
								Heroes: heroes,
								VisualBoardState: visualBoardState,
							},
						}),
						false,
						node,
					),
				);
			} else {
				const heroes = this.BuildHeroes(this.GameState);
				result.push(
					GameEventProvider.Create(
						gameEntity.TimeStamp,
						'BATTLEGROUNDS_RECRUIT_PHASE',
						() => ({
							Type: 'BATTLEGROUNDS_RECRUIT_PHASE',
							Value: {
								Turn: currentTurn,
								Heroes: heroes,
								VisualBoardState: visualBoardState,
							},
						}),
						false,
						node,
					),
				);
			}
		}
		return result;
	}

	private BuildHeroes(gameState: GameState): Hero[] {
		return [...gameState.CurrentEntities.values()]
			.filter((entity) => entity.IsHero())
			.filter((entity) => entity.GetZone() !== (Zone.REMOVEDFROMGAME as number))
			.map((entity) => ({
				CardId: entity.CardId,
				PlayerId: entity.GetTag(GameTag.PLAYER_ID, 0),
				EntityId: entity.Id,
				Health: entity.GetTag(GameTag.HEALTH, 0) - entity.GetTag(GameTag.DAMAGE, 0),
				Armor: entity.GetTag(GameTag.ARMOR, 0),
			}))
			.filter((hero) => hero.PlayerId > 0);
	}

	private IsSelectingMercs(): boolean {
		const playerEntityIds = this.ParserState.getPlayers().map((e) => e.Id);
		const playerEntities = [...this.GameState.CurrentEntities.values()].filter((e) =>
			playerEntityIds.includes(e.Id),
		);
		return playerEntities.some((p) => p.GetTag(GameTag.LETTUCE_MERCENARIES_TO_NOMINATE) >= 1);
	}
}
