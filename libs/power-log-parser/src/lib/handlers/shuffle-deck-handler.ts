import { Action, Game, Node, NodeType, ShuffleDeck } from '../models';
import { Regexes } from '../regexes';
import type { ParserState } from '../state/parser-state';

export class ShuffleDeckHandler {
	static Handle(timestamp: string, data: string, state: ParserState, indentLevel: number): boolean {
		const match = Regexes.ActionShuffleDeckRegex.exec(data);
		if (match) {
			const playerId = match[1];

			const shuffleNode = new ShuffleDeck();
			shuffleNode.PlayerId = parseInt(playerId, 10);
			shuffleNode.TimeStamp = timestamp;

			state.UpdateCurrentNode(NodeType.Game, NodeType.Action);
			state.CreateNewNode(new Node(NodeType.ShuffleDeck, shuffleNode, indentLevel, state.Node, data));

			if (state.Node!.Type === NodeType.Game) {
				(state.Node!.Object as Game).AddData(shuffleNode);
			} else if (state.Node!.Type === NodeType.Action) {
				(state.Node!.Object as Action).Data.push(shuffleNode);
			} else {
				throw new Error('Invalid node ' + state.Node!.Type);
			}

			return true;
		}
		return false;
	}
}
