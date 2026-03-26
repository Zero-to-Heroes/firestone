import { Action, Game } from '../models';
import type { ParserState } from '../state/parser-state';

export class BlockEndHandler {
	static Handle(data: string, state: ParserState): boolean {
		if (data === 'BLOCK_END') {
			if (state.Node!.Type !== Game) {
				state.UpdateCurrentNode(Game, Action);
				state.EndAction();
			}
			state.Node = state.Node!.Parent ?? state.Node;
			return true;
		}
		return false;
	}
}
