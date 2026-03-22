import type { Helper } from '../helper';
import { Action, Game, HideEntity, Node } from '../models';
import { Regexes } from '../regexes';
import type { ParserState } from '../state/parser-state';

export class HideEntityHandler {
	static Handle(
		timestamp: string,
		data: string,
		state: ParserState,
		indentLevel: number,
		helper: Helper,
	): boolean {
		const match = Regexes.ActionHideEntityRegex.exec(data);
		if (match) {
			const rawEntity = match[1];
			const tagName = match[2];
			const value = match[3];
			const entity = helper.ParseEntity(rawEntity);
			const zone = helper.ParseTag(tagName, value);

			const hideEntity = new HideEntity();
			hideEntity.Entity = entity;
			hideEntity.Zone = zone.Value;
			hideEntity.TimeStamp = timestamp;

			state.UpdateCurrentNode(Game, Action);

			if (state.Node!.Type === Game) {
				(state.Node!.Object as Game).AddData(hideEntity);
			} else if (state.Node!.Type === Action) {
				(state.Node!.Object as Action).Data.push(hideEntity);
			} else {
				throw new Error('Invalid node: ' + state.Node!.Type);
			}

			const newNode = new Node(HideEntity, hideEntity, indentLevel, state.Node, data);
			state.CreateNewNode(newNode);
			state.Node = newNode;
			return true;
		}
		return false;
	}
}
