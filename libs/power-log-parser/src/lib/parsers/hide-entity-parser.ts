import { ActionParser } from '../action-parser';
import { GameEventProvider } from '../game-event';
import { HideEntity, Node, NodeType } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class HideEntityParser implements ActionParser {
	readonly ParserName = 'HideEntityParser';

	private GameState: GameState;
	private ParserState: ParserState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, stateFacade: StateFacade) {
		this.ParserState = parserState;
		this.GameState = parserState.GameState;
		this.StateFacade = stateFacade;
	}

	AppliesOnNewNode(node: Node, stateType: StateType): boolean {
		return stateType === StateType.PowerTaskList && node.Type === NodeType.HideEntity;
	}

	AppliesOnCloseNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const hide = node.Object as HideEntity;
		const hiddenEntityId = hide.Entity;
		const hiddenEntity = this.GameState.CurrentEntities.get(hiddenEntityId);
		if (hiddenEntity == null) {
			return null;
		}

		hiddenEntity.Hidden = true;
		return null;
	}

	CreateGameEventProviderFromClose(_node: Node): GameEventProvider[] | null {
		return null;
	}
}
