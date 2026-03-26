import { ActionParser } from '../action-parser';
import { GameEventProvider } from '../game-event';
import { FullEntity, Node } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class FullEntityParser implements ActionParser {
	readonly ParserName = 'FullEntityParser';

	private GameState: GameState;
	private ParserState: ParserState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, stateFacade: StateFacade) {
		this.ParserState = parserState;
		this.GameState = parserState.GameState;
		this.StateFacade = stateFacade;
	}

	AppliesOnNewNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	AppliesOnCloseNode(node: Node, stateType: StateType): boolean {
		return stateType === StateType.PowerTaskList && node.Type === FullEntity;
	}

	CreateGameEventProviderFromNew(_node: Node): GameEventProvider[] | null {
		return null;
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		const obj = node.Object as FullEntity;
		const entityId = obj.Entity;
		const entity = this.GameState.CurrentEntities.get(entityId);
		if (entity == null) {
			return null;
		}

		entity.Hidden = false;
		return null;
	}
}
