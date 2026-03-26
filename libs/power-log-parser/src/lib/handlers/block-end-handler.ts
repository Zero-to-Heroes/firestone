import { Action, Game, NodeType } from '../models';
import type { ParserState } from '../state/parser-state';

export class BlockEndHandler {
	static Handle(data: string, state: ParserState): boolean {
		if (data === 'BLOCK_END') {
			if (state.Node!.Type !== NodeType.Game) {
				state.UpdateCurrentNode(NodeType.Game, NodeType.Action);
				state.EndAction();
			}
			state.Node = state.Node!.Parent ?? state.Node;
			return true;
		}
		return false;
	}
}
