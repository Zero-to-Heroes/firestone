import { BlockType } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventHelper, GameEventProvider } from '../game-event';
import { Action, Node, NodeType } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class GameResetParser implements ActionParser {
	readonly ParserName = 'GameResetParser';

	private GameState: GameState;
	private ParserState: ParserState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, stateFacade: StateFacade) {
		this.ParserState = parserState;
		this.GameState = parserState.GameState;
		this.StateFacade = stateFacade;
	}

	AppliesOnNewNode(node: Node, stateType: StateType): boolean {
		return (
			stateType === StateType.PowerTaskList &&
			!this.StateFacade.IsBattlegrounds() &&
			node.Type === NodeType.Action &&
			(node.Object as Action).Type === (BlockType.GAME_RESET as number)
		);
	}

	AppliesOnCloseNode(node: Node, stateType: StateType): boolean {
		return (
			stateType === StateType.PowerTaskList &&
			!this.StateFacade.IsBattlegrounds() &&
			node.Type === NodeType.Action &&
			(node.Object as Action).Type === (BlockType.GAME_RESET as number)
		);
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		this.ParserState.PartialReset();
		return [
			GameEventProvider.Create(
				(node.Object as Action).TimeStamp,
				'GAME_RESET_START',
				GameEventHelper.CreateProvider('GAME_RESET_START', null as any, -1, -1, this.StateFacade),
				true,
				node,
			),
		];
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		const action = node.Object as Action;
		const actionEndTimestamp = action.Data[action.Data.length - 1].TimeStamp;
		return [
			GameEventProvider.Create(
				actionEndTimestamp,
				'GAME_RESET_END',
				GameEventHelper.CreateProvider('GAME_RESET_END', null as any, -1, -1, this.StateFacade),
				true,
				node,
			),
		];
	}
}
