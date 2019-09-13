export class GameEvent {
	public static readonly SCENE_CHANGED = 'SCENE_CHANGED'; // Not strictly a game event, but needed for requirements procesing
	public static readonly GAME_STATS_UPDATED = 'GAME_STATS_UPDATED'; // Not strictly a game event, but needed for req processing
	public static readonly MATCH_METADATA = 'MATCH_METADATA';
	public static readonly PLAYER = 'PLAYER';
	public static readonly LOCAL_PLAYER = 'LOCAL_PLAYER';
	public static readonly OPPONENT = 'OPPONENT';
	public static readonly MULLIGAN_INPUT = 'MULLIGAN_INPUT';
	public static readonly MULLIGAN_INITIAL_OPTION = 'MULLIGAN_INITIAL_OPTION';
	public static readonly MULLIGAN_DONE = 'MULLIGAN_DONE';
	public static readonly MAIN_STEP_READY = 'MAIN_STEP_READY';
	public static readonly TURN_START = 'TURN_START';
	public static readonly GAME_RESULT = 'GAME_RESULT';
	public static readonly MAYBE_DUNGEON_INFO_PICK = 'MAYBE_DUNGEON_INFO_PICK';
	public static readonly GAME_START = 'GAME_START';
	public static readonly NEW_LOG_LINE = 'NEW_LOG_LINE';
	public static readonly WINNER = 'WINNER';
	public static readonly TIE = 'TIE';
	public static readonly GAME_END = 'GAME_END';
	public static readonly CARD_PLAYED = 'CARD_PLAYED';
	public static readonly DISCARD_CARD = 'DISCARD_CARD';
	public static readonly MINION_DIED = 'MINION_DIED';
	public static readonly RECRUIT_CARD = 'RECRUIT_CARD';
	public static readonly FIRST_PLAYER = 'FIRST_PLAYER';
	public static readonly SECRET_PLAYED_FROM_DECK = 'SECRET_PLAYED_FROM_DECK';
	public static readonly MINION_SUMMONED = 'MINION_SUMONED';
	public static readonly CARD_CHANGED_ON_BOARD = 'CARD_CHANGED_ON_BOARD';
	public static readonly SECRET_PLAYED = 'SECRET_PLAYED';
	public static readonly CARD_DRAW_FROM_DECK = 'CARD_DRAW_FROM_DECK';
	public static readonly RECEIVE_CARD_IN_HAND = 'RECEIVE_CARD_IN_HAND';
	public static readonly END_OF_ECHO_IN_HAND = 'END_OF_ECHO_IN_HAND';
	public static readonly CREATE_CARD_IN_DECK = 'CREATE_CARD_IN_DECK';
	public static readonly CARD_BACK_TO_DECK = 'CARD_BACK_TO_DECK';
	public static readonly CARD_REMOVED_FROM_DECK = 'CARD_REMOVED_FROM_DECK';
	public static readonly CARD_REMOVED_FROM_HAND = 'CARD_REMOVED_FROM_HAND';
	public static readonly BURNED_CARD = 'BURNED_CARD';
	public static readonly CARD_ON_BOARD_AT_GAME_START = 'CARD_ON_BOARD_AT_GAME_START';
	public static readonly PASSIVE_BUFF = 'PASSIVE_BUFF';
	public static readonly MINION_ON_BOARD_ATTACK_UPDATED = 'MINION_ON_BOARD_ATTACK_UPDATED';
	public static readonly ARMOR_CHANGED = 'ARMOR_CHANGED';
	public static readonly FATIGUE_DAMAGE = 'FATIGUE_DAMAGE';
	public static readonly DAMAGE = 'DAMAGE';
	public static readonly HEALING = 'HEALING';
	public static readonly RUMBLE_RUN_STEP = 'RUMBLE_RUN_STEP';
	public static readonly DUNGEON_RUN_STEP = 'DUNGEON_RUN_STEP';
	public static readonly MONSTER_HUNT_STEP = 'MONSTER_HUNT_STEP';

	readonly type: string;
	readonly cardId: string;
	readonly controllerId: number; // matches a PlayerId
	readonly localPlayer: GameEventPlayer;
	readonly opponentPlayer: GameEventPlayer;
	readonly entityId: number;
	readonly gameState: any = {};

	readonly additionalData: any;

	public static build(type: string, gameEvent: any, additionalProps?: any): GameEvent {
		return Object.assign(new GameEvent(), {
			type: type,
			cardId: gameEvent.Value.CardId,
			controllerId: gameEvent.Value.ControllerId,
			localPlayer: gameEvent.Value.LocalPlayer,
			opponentPlayer: gameEvent.Value.OpponentPlayer,
			entityId: parseInt(gameEvent.Value.EntityId || 0),
			gameState: gameEvent.Value.GameState,
			additionalData: additionalProps,
		} as GameEvent);
	}

	public parse(): [string, number, any, number] {
		return [this.cardId, this.controllerId, this.localPlayer, this.entityId];
	}
}

export interface GameEventPlayer {
	Id: number;
	AccountHi: string;
	AccountLo: string;
	PlayerId: number;
	Name: string;
	CardID: string;
	standardRank: number;
	standardLegendRank: number;
	wildRank: number;
	wildLegendRank: number;
	cardBackId: number;
	deck: { deckstring: string; deck };
}
