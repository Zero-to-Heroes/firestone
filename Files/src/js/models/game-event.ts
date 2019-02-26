export class GameEvent {

	public static readonly MATCH_METADATA = 'MATCH_METADATA';
	public static readonly PLAYER = 'PLAYER';
	public static readonly LOCAL_PLAYER = 'LOCAL_PLAYER';
	public static readonly OPPONENT = 'OPPONENT';
	public static readonly MULLIGAN_INPUT = 'MULLIGAN_INPUT';
	public static readonly MULLIGAN_INITIAL_OPTION = 'MULLIGAN_INITIAL_OPTION';
	public static readonly MULLIGAN_DONE = 'MULLIGAN_DONE';
	public static readonly TURN_START = 'TURN_START';
	public static readonly GAME_RESULT = 'GAME_RESULT';
	public static readonly MAYBE_DUNGEON_INFO_PICK = 'MAYBE_DUNGEON_INFO_PICK';
	public static readonly GAME_START = 'GAME_START';
	public static readonly NEW_LOG_LINE = 'NEW_LOG_LINE';
	public static readonly WINNER = 'WINNER';
	public static readonly GAME_END = 'GAME_END';
	public static readonly CARD_PLAYED = 'CARD_PLAYED';
	public static readonly CARD_DRAW_FROM_DECK = 'CARD_DRAW_FROM_DECK';
	public static readonly CARD_BACK_TO_DECK = 'CARD_BACK_TO_DECK';
	public static readonly CARD_ON_BOARD_AT_GAME_START = 'CARD_ON_BOARD_AT_GAME_START';
	public static readonly PASSIVE_BUFF = 'PASSIVE_BUFF';
	public static readonly RUMBLE_RUN_STEP = 'RUMBLE_RUN_STEP';
	public static readonly DUNGEON_RUN_STEP = 'DUNGEON_RUN_STEP';
	public static readonly MONSTER_HUNT_STEP = 'MONSTER_HUNT_STEP';

	readonly type: string;
	readonly data: any[];

	constructor(type: string, ...data: any[]) {
		this.type = type;
		this.data = data;
	}

}
