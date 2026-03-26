import type { Helper } from '../helper';
import { Action, ChangeEntity, Game, Node, NodeType, Tag } from '../models';
import { Regexes } from '../regexes';
import type { ParserState } from '../state/parser-state';

export class ChangeEntityHandler {
	static Handle(
		timestamp: string,
		data: string,
		state: ParserState,
		indentLevel: number,
		helper: Helper,
	): boolean {
		const match = Regexes.ActionChangeEntityRegex.exec(data);
		if (match) {
			const rawEntity = match[1];
			const cardId = match[2];
			const entity = helper.ParseEntity(rawEntity);

			const changeEntity = new ChangeEntity();
			changeEntity.CardId = cardId;
			changeEntity.Entity = entity;
			changeEntity.Tags = [];
			changeEntity.TimeStamp = timestamp;

			state.UpdateCurrentNode(NodeType.Game, NodeType.Action);
			if (state.Node!.Type === NodeType.Game) {
				(state.Node!.Object as Game).AddData(changeEntity);
			} else if (state.Node!.Type === NodeType.Action) {
				(state.Node!.Object as Action).Data.push(changeEntity);
			} else {
				throw new Error('Invalid node ' + state.Node!.Type);
			}
			const newNode = new Node(NodeType.ChangeEntity, changeEntity, indentLevel, state.Node, data);
			state.CreateNewNode(newNode);
			state.Node = newNode;
			return true;
		}
		return false;
	}
}
