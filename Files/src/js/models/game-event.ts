export class GameEvent {

	public static readonly PLAYER = 'PLAYER';
	public static readonly LOCAL_PLAYER = 'LOCAL_PLAYER';
	public static readonly OPPONENT = 'OPPONENT';
	public static readonly GAME_RESULT = 'GAME_RESULT';
	public static readonly MAYBE_DUNGEON_INFO_PICK = 'MAYBE_DUNGEON_INFO_PICK';
	public static readonly GAME_START = 'GAME_START';
	public static readonly NEW_LOG_LINE = 'NEW_LOG_LINE';

	type: string;
	data: any[];

	constructor(type: string, ...data: any[]) {
		this.type = type;
		this.data = data;
	}

}
