import { CardType, GameTag, GameType, ScenarioId, Zone } from '@firestone-hs/reference-data';
import {
	BaseEntity,
	ChangeEntity,
	ChosenEntities,
	Choices,
	FullEntity,
	Game,
	GameEntity,
	HearthstoneReplay,
	IEntityData,
	MetaData,
	Node,
	NodeType,
	Option,
	Options,
	Player,
	PlayerEntity,
	SendChoices,
	ShowEntity,
	SubSpell,
	Tag,
} from '../models';
import { GameEventProvider } from '../game-event';
import { Logger } from '../logger';
import { GameState } from './game-state';
import type { StateFacade } from './state-facade';

export enum StateType {
	GameState = 'GameState',
	PowerTaskList = 'PowerTaskList',
}

export interface INodeParser {
	NewNode(node: Node, stateType: StateType): void;
	CloseNode(node: Node, stateType: StateType): void;
	EnqueueGameEvent(providers: GameEventProvider[]): void;
	ClearQueue(): void;
	Reset(state: ParserState, helper: StateFacade): void;
}

export class ParserState {
	GameState: GameState = new GameState();

	NodeParser!: INodeParser;
	StateFacade!: StateFacade;
	Replay!: HearthstoneReplay;
	CurrentGame!: Game;
	GameData: any | null = null;
	SendChoices: SendChoices | null = null;
	Choices: Choices | null = null;
	Options: Options | null = null;
	CurrentOption: Option | null = null;
	LastOption: any | null = null;
	CurrentSubSpell: SubSpell | null = null;
	FirstPlayerEntityId: number = -1;
	CurrentPlayerId: number = -1;
	CurrentChosenEntites: ChosenEntities | null = null;
	Ended: boolean = false;
	NumberOfCreates: number = 0;
	ReconnectionOngoing: boolean = false;
	Spectating: boolean = false;

	StateType: StateType;

	private _node: Node | null = null;
	get Node(): Node | null {
		return this._node;
	}
	set Node(value: Node | null) {
		if (value !== this._node) {
			if (
				this._node != null &&
				(this._node.Type === NodeType.FullEntity ||
					this._node.Type === NodeType.ShowEntity ||
					this._node.Type === NodeType.ChangeEntity)
			) {
				this.EndAction();
				if (this._node.Type === NodeType.ShowEntity) {
					this.GameState.ShowEntity(this._node.Object as ShowEntity);
				} else if (this._node.Type === NodeType.FullEntity) {
					this.GameState.FullEntity(this._node.Object as FullEntity, false);
				} else if (this._node.Type === NodeType.ChangeEntity) {
					this.GameState.ChangeEntity(this._node.Object as ChangeEntity);
				}
			}
			if (this._node != null && this._node.Type === NodeType.PlayerEntity) {
				this.NodeParser.CloseNode(this._node, this.StateType);
				this.GameState.PlayerEntity(this._node.Object as PlayerEntity);
			}
			if (this._node != null && this._node.Type === NodeType.GameEntity) {
				this.NodeParser.CloseNode(this._node, this.StateType);
				this.GameState.GameEntity(this._node.Object as GameEntity);
			}
			if (this._node != null && this._node.Type === NodeType.MetaData) {
				this.EndAction();
			}
			this._node = value;
		}
	}

	private _localPlayer: Player | null = null;
	get LocalPlayer(): Player | null {
		return this._localPlayer;
	}

	private _opponentPlayer: Player | null = null;
	get OpponentPlayer(): Player | null {
		return this._opponentPlayer;
	}

	constructor(type: StateType, nodeParser: INodeParser, stateFacade: StateFacade) {
		Logger.Log('Calling reset from ParserState constructor', type);
		this.StateType = type;
		this.StateFacade = stateFacade;
		this.NodeParser = nodeParser;
	}

	SetLocalPlayer(value: Player, timestamp: string, data: string, sendEvent: boolean): void {
		this._localPlayer = value;
		value.IsMainPlayer = true;
		const playerEntity = this.getPlayers().find((player) => player.PlayerId === value.PlayerId);
		if (playerEntity) {
			playerEntity.IsMainPlayer = value.IsMainPlayer;
		}
		if (sendEvent) {
			const localPlayer = this._localPlayer;
			this.NodeParser.EnqueueGameEvent([
				GameEventProvider.Create(
					timestamp,
					'LOCAL_PLAYER',
					() => ({
						Type: 'LOCAL_PLAYER',
						Value: localPlayer,
					}),
				false,
				new Node(NodeType.Placeholder, null, 0, null, data),
			),
		]);
	}
}

	SetOpponentPlayer(value: Player, timestamp: string, data: string, sendEvent: boolean): void {
		this._opponentPlayer = value;
		value.IsMainPlayer = false;
		const playerEntity = this.getPlayers().find((player) => player.PlayerId === value.PlayerId);
		if (playerEntity) {
			playerEntity.IsMainPlayer = value.IsMainPlayer;
		}
		if (sendEvent) {
			const opponentPlayer = this._opponentPlayer;
			this.NodeParser.EnqueueGameEvent([
				GameEventProvider.Create(
					timestamp,
					'OPPONENT_PLAYER',
					() => ({
						Type: 'OPPONENT_PLAYER',
						Value: {
							OpponentPlayer: opponentPlayer,
						},
					}),
					false,
					new Node(NodeType.Placeholder, null, 0, null, data),
				),
			]);
		}
	}

	Reset(helper: StateFacade): void {
		this.GameState.Reset(this);
		this.NodeParser.Reset(this, helper);
		this.Replay = new HearthstoneReplay();
		this.Replay.Games = [];
		this.CurrentGame = new Game();
		this._localPlayer = null;
		this._opponentPlayer = null;
		this._node = null;
		this.Node = null;
		this.GameData = null;
		this.SendChoices = null;
		this.Choices = null;
		this.Options = null;
		this.CurrentOption = null;
		this.LastOption = null;
		this.FirstPlayerEntityId = -1;
		this.CurrentPlayerId = -1;
		this.CurrentChosenEntites = null;
		this.Ended = false;
		this.ReconnectionOngoing = false;
		this.NumberOfCreates = 0;
		Logger.Log(`resetting game state, ended is now Ended=${this.Ended}`, this.StateType);

		this._isBattlegrounds = null;
		this._cachedPlayers = [];
	}

	PartialReset(): void {
		const gameEntity = this.CurrentGame.Data.find((d) => d instanceof GameEntity) as GameEntity | undefined;
		const playerEntities = this.getPlayers();
		const keysToKeep = new Set<number>([gameEntity!.Id]);
		for (const player of playerEntities) {
			keysToKeep.add(player.Id);
		}
		const filteredEntities = new Map<number, FullEntity>();
		for (const [key, value] of this.GameState.CurrentEntities) {
			if (keysToKeep.has(key)) {
				filteredEntities.set(key, value);
			}
		}
		this.GameState.CurrentEntities = filteredEntities;
	}

	CreateNewNode(newNode: Node): void {
		this.NodeParser.NewNode(newNode, this.StateType);
	}

	EndAction(): void {
		if (this.Node!.Type !== NodeType.Game) {
			this.NodeParser.CloseNode(this.Node!, this.StateType);
		}
	}

	EndCurrentGame(): void {
		this.Ended = true;
		Logger.Log(`Game Ended in type=${this.StateType}`, `Ended=${this.Ended}`);
	}

	UpdateCurrentNode(...types: NodeType[]): void {
		while (this.Node?.Parent != null && types.every((x) => x !== this.Node!.Type)) {
			this.Node = this.Node.Parent;
		}
	}

	private _cachedPlayers: PlayerEntity[] = [];
	getPlayers(): PlayerEntity[] {
		if (this._cachedPlayers.length > 0) {
			return this._cachedPlayers;
		}
		const players: PlayerEntity[] = [];
		const dataCopy = [...this.CurrentGame.Data];
		for (const x of dataCopy) {
			if (x instanceof PlayerEntity) {
				players.push(x);
			}
		}
		return players;
	}

	GetPlayerForController(controllerId: number): PlayerEntity | null {
		const players = this.getPlayers();
		for (const player of players) {
			if (player.PlayerId === controllerId) return player;
		}
		return null;
	}

	/** True once DebugPrintGame has assigned a non-blank name (bots with AccountHi 0 skip the wait). */
	private playerHasDebugName(player: PlayerEntity): boolean {
		if (player.AccountHi === '0') {
			return true;
		}
		return player.Name != null && player.Name.trim().length > 0;
	}

	TryAssignLocalPlayer(timestamp: string, data: string): void {
		if (this.IsMercenaries()) {
			if (this.getPlayers().length === 3 && this.CurrentGame.ScenarioID === (ScenarioId.LETTUCE_PVP as number)) {
				this.CurrentGame.ScenarioID = ScenarioId.LETTUCE_PVP_VS_AI as number;
			}

			let localPlayerPlayerId = -1;
			let opponentPlayerPlayerId = -1;

			if (this.IsMercenariesPvE() && this.getPlayers().length === 3) {
				localPlayerPlayerId = this.getPlayers()[2].PlayerId;
				opponentPlayerPlayerId = this.getPlayers()[1].PlayerId;
			} else {
				const allFullEntities = this.CurrentGame
					.FilterGameData(FullEntity)
					.filter((d): d is FullEntity => d instanceof FullEntity);

				const localMerc = allFullEntities.find(
					(d) => d.GetTag(GameTag.LETTUCE_MERCENARY) === 1 && (d.CardId?.length ?? 0) > 0,
				);
				localPlayerPlayerId = localMerc?.GetEffectiveController() ?? -1;

				const opponentMerc = allFullEntities.find(
					(d) =>
						d.GetTag(GameTag.LETTUCE_MERCENARY) === 1 &&
						((d.CardId?.length ?? 0) === 0 || d.GetZone() === (Zone.PLAY as number)) &&
						d.GetEffectiveController() !== localPlayerPlayerId,
				);
				opponentPlayerPlayerId = opponentMerc?.GetEffectiveController() ?? -1;
			}

			for (const player of this.getPlayers()) {
				if (player.PlayerId === opponentPlayerPlayerId && data.includes('PlayerID=' + opponentPlayerPlayerId)) {
					const newPlayer = Player.from(player);
					this.SetOpponentPlayer(newPlayer, timestamp, data, this.StateType === StateType.GameState);
					return;
				} else if (
					player.PlayerId === localPlayerPlayerId &&
					data.includes('PlayerID=' + localPlayerPlayerId)
				) {
					const newPlayer = Player.from(player);
					this.FirstPlayerEntityId = player.Id;
					this.SetLocalPlayer(newPlayer, timestamp, data, this.StateType === StateType.GameState);
					return;
				}
			}
			return;
		}

		if (this.LocalPlayer != null && this.OpponentPlayer != null) {
			return;
		}

		for (const player of this.getPlayers()) {
			if (!this.playerHasDebugName(player)) {
				return;
			}
			const playerEntityIdTag = player.Tags.find((t) => t.Name === (GameTag.HERO_ENTITY as number));
			if (playerEntityIdTag == null) {
				return;
			}
		}

		let showEntities: IEntityData[] = this.CurrentGame
			.FilterGameData(ShowEntity)
			.filter((d): d is ShowEntity => d instanceof ShowEntity)
			.filter((d) => d.GetZone() === (Zone.HAND as number));

		if (showEntities.length === 0) {
			Logger.Log('No show entity, fallback to fullentity in hand', '');
			showEntities = this.CurrentGame
				.FilterGameData(FullEntity)
				.filter((d): d is FullEntity => d instanceof FullEntity)
				.filter((d) => d.GetZone() === (Zone.HAND as number))
				.filter((d) => d.GetTag(GameTag.CREATOR) !== this.GameState.GetGameEntity()?.Id);

			if (showEntities.length === 0) {
				Logger.Log('No full entity in hand, fallback to fullentity', '');
				showEntities = this.CurrentGame.FilterGameData(FullEntity) as unknown as IEntityData[];
			}
		}

		for (const entity of showEntities) {
			if (
				entity.CardId != null &&
				entity.CardId.length > 0 &&
				this.GetTagFromList(entity.Tags, GameTag.CARDTYPE) !== (CardType.ENCHANTMENT as number) &&
				this.GetTagFromList(entity.Tags, GameTag.ZONE) !== (Zone.DECK as number)
			) {
				const entityId = entity.Entity;
				const fullEntity = this.GetEntity(entityId);
				if (!fullEntity) continue;
				const controllerId = fullEntity.GetEffectiveController();
				for (const player of this.getPlayers()) {
					if (player.GetEffectiveController() === controllerId) {
						const newPlayer = Player.from(player);
						const playerEntityIdTag = player.Tags.find(
							(t) => t.Name === (GameTag.HERO_ENTITY as number),
						)!;
						const playerEntity = this.CurrentGame.Data.filter(
							(d): d is FullEntity => d instanceof FullEntity,
						).find((e) => e.Id === playerEntityIdTag.Value)!;
						newPlayer.CardID = playerEntity.CardId;
						this.SetLocalPlayer(newPlayer, timestamp, data, this.StateType === StateType.GameState);
					}
				}
				if (this.LocalPlayer != null) {
					for (const player of this.getPlayers()) {
						if (player.Id === this.LocalPlayer.Id) {
							continue;
						}
						const newPlayer = Player.from(player);
						const playerEntityIdTag = player.Tags.find(
							(t) => t.Name === (GameTag.HERO_ENTITY as number),
						)!;
						const playerEntity = this.CurrentGame.Data.filter(
							(d): d is FullEntity => d instanceof FullEntity,
						).find((e) => e.Id === playerEntityIdTag.Value)!;
						newPlayer.CardID = playerEntity.CardId;
						this.SetOpponentPlayer(newPlayer, timestamp, data, this.StateType === StateType.GameState);
					}
					return;
				}
			}
		}

		if (this._localPlayer == null && this._opponentPlayer == null) {
			Logger.Log(
				'ERROR TO LOG: Could not assign local player ' + data,
				this.getPlayers()
					?.map((player) => player.Name)
					.join(', ') ?? '',
			);
		}
	}

	GetTagFromList(tags: Tag[], tag: GameTag): number {
		const ret = tags.find((t) => t.Name === (tag as number));
		return ret == null ? -1 : ret.Value;
	}

	GetEntity(id: number): BaseEntity | undefined {
		return this.CurrentGame
			.FilterGameData(FullEntity, PlayerEntity)
			.filter((data): data is BaseEntity => data instanceof BaseEntity)
			.find((e) => e.Id === id);
	}

	private _isBattlegrounds: boolean | null = null;
	IsBattlegrounds(): boolean {
		if (this._isBattlegrounds != null) {
			return this._isBattlegrounds;
		}
		if (this.CurrentGame.GameType === -1) {
			return false;
		}
		this._isBattlegrounds =
			this.CurrentGame.GameType === (GameType.GT_BATTLEGROUNDS as number) ||
			this.CurrentGame.GameType === (GameType.GT_BATTLEGROUNDS_FRIENDLY as number) ||
			this.CurrentGame.GameType === (GameType.GT_BATTLEGROUNDS_DUO as number) ||
			this.CurrentGame.GameType === (GameType.GT_BATTLEGROUNDS_DUO_FRIENDLY as number);
		return this._isBattlegrounds;
	}

	IsBattlegroundsDuos(): boolean {
		return (
			this.CurrentGame.GameType === (GameType.GT_BATTLEGROUNDS_DUO as number) ||
			this.CurrentGame.GameType === (GameType.GT_BATTLEGROUNDS_DUO_FRIENDLY as number)
		);
	}

	InRecruitPhase(): boolean {
		return this.GameState.GetGameEntity()!.GetTag(GameTag.BOARD_VISUAL_STATE) === 1;
	}

	InCombatPhase(): boolean {
		return this.GameState.GetGameEntity()!.GetTag(GameTag.BOARD_VISUAL_STATE) === 2;
	}

	IsMercenaries(): boolean {
		return (
			this.IsMercenariesPvE() ||
			[GameType.GT_MERCENARIES_PVP as number].includes(this.CurrentGame.GameType)
		);
	}

	IsMercenariesPvE(): boolean {
		return [
			GameType.GT_MERCENARIES_AI_VS_AI as number,
			GameType.GT_MERCENARIES_FRIENDLY as number,
			GameType.GT_MERCENARIES_PVE as number,
			GameType.GT_MERCENARIES_PVE_COOP as number,
		].includes(this.CurrentGame.GameType);
	}

	IsReconnecting(gameSeedForCurrentLogs: number): boolean {
		Logger.Log(
			'Is reconnecting?',
			`statType=${this.StateType}, ended=${this.Ended}, creates=${this.NumberOfCreates}, spectating=${this.Spectating}, gameSeed=${this.CurrentGame?.GameSeed}, currentGameSeed=${gameSeedForCurrentLogs}`,
		);
		return (
			gameSeedForCurrentLogs !== 0 &&
			this.CurrentGame != null &&
			this.CurrentGame.GameSeed !== 0 &&
			this.CurrentGame.GameSeed === gameSeedForCurrentLogs
		);
	}

	ClearActiveSubSpell(): void {
		let current = this.CurrentSubSpell;
		let parent: SubSpell | null = null;
		if (current?.Spell == null) {
			this.CurrentSubSpell = null;
		}
		while (current?.Spell != null) {
			parent = current;
			current = current.Spell;
		}
		if (parent != null) {
			parent.Spell = null;
		}
	}
}
