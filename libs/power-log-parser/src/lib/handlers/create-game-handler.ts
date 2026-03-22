import { GameEntity, Node, Tag } from '../models';
import { Regexes } from '../regexes';
import type { ParserState } from '../state/parser-state';

export class CreateGameHandler {
	static Handle(timestamp: string, data: string, state: ParserState, indentLevel: number): boolean {
		const match = Regexes.GameEntityRegex.exec(data);
		if (match) {
			const id = match[1];
			const gEntity = new GameEntity();
			gEntity.Id = parseInt(id, 10);
			gEntity.Tags = [];
			gEntity.TimeStamp = timestamp;
			state.CurrentGame.AddData(gEntity);
			const newNode = new Node(GameEntity, gEntity, indentLevel, state.Node, data);
			state.CreateNewNode(newNode);
			state.Node = newNode;
			return true;
		}
		return false;
	}
}
