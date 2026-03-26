import type { Helper } from '../helper';
import { Action, Game, Node, ShowEntity, Tag } from '../models';
import { Regexes } from '../regexes';
import type { ParserState } from '../state/parser-state';

export class ShowEntityHandler {
	static Handle(
		timestamp: string,
		data: string,
		state: ParserState,
		indentLevel: number,
		helper: Helper,
	): boolean {
		const match = Regexes.ActionShowEntityRegex.exec(data);
		if (match) {
			const rawEntity = match[1];
			const cardId = match[2];
			const entity = helper.ParseEntity(rawEntity);

			const showEntity = new ShowEntity();
			showEntity.CardId = cardId;
			showEntity.Entity = entity;
			showEntity.Tags = [];
			showEntity.TimeStamp = timestamp;
			showEntity.SubSpellInEffect = state.CurrentSubSpell?.GetActiveSubSpell() ?? null;

			state.UpdateCurrentNode(Game, Action);
			if (state.Node!.Type === Game) {
				(state.Node!.Object as Game).AddData(showEntity);
			} else if (state.Node!.Type === Action) {
				(state.Node!.Object as Action).Data.push(showEntity);
			} else {
				throw new Error('Invalid node ' + state.Node!.Type + ' while parsing ' + data);
			}
			const newNode = new Node(ShowEntity, showEntity, indentLevel, state.Node, data);
			state.CreateNewNode(newNode);
			state.Node = newNode;
			return true;
		}
		return false;
	}
}
