import { GameTag } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider } from '../game-event';
import { Node, NodeType, TagChange } from '../models';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

const STATE_COMPLETE = 3;

export class GameCleanupParser implements ActionParser {
	readonly ParserName = 'GameCleanupParser';

	private ParserState: ParserState;

	constructor(parserState: ParserState, _stateFacade: StateFacade) {
		this.ParserState = parserState;
	}

	AppliesOnNewNode(node: Node, stateType: StateType): boolean {
		return (
			stateType === StateType.GameState &&
			node.Type === NodeType.TagChange &&
			(node.Object as TagChange).Name === (GameTag.STATE as number) &&
			(node.Object as TagChange).Value === STATE_COMPLETE
		);
	}

	AppliesOnCloseNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		console.debug('Ending current game in GS', node.CreationLogLine);
		this.ParserState.EndCurrentGame();
		return null;
	}

	CreateGameEventProviderFromClose(_node: Node): GameEventProvider[] | null {
		return null;
	}
}
