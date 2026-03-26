import type { Helper } from '../helper';
import { Action, FullEntity, Game, Node, Tag } from '../models';
import { Regexes } from '../regexes';
import type { ParserState } from '../state/parser-state';

export class FullEntityHandler {
	static Handle(
		timestamp: string,
		data: string,
		state: ParserState,
		indentLevel: number,
		helper: Helper,
	): boolean {
		let match = Regexes.ActionFullEntityUpdatingRegex.exec(data);
		if (!match) {
			match = Regexes.ActionFullEntityCreatingRegex.exec(data);
		}
		if (match) {
			const rawEntity = match[1];
			const cardId = match[2] ?? '';
			const entity = helper.ParseEntity(rawEntity);
			state.GameState.UpdateEntityName(rawEntity);

			const fullEntity = new FullEntity();
			fullEntity.CardId = cardId;
			fullEntity.Id = entity;
			fullEntity.Tags = [];
			fullEntity.TimeStamp = timestamp;
			fullEntity.SubSpellInEffect = state.CurrentSubSpell?.GetActiveSubSpell() ?? null;

			state.UpdateCurrentNode(Game, Action);

			const newNode = new Node(FullEntity, fullEntity, indentLevel, state.Node, data);
			if (state.Node!.Type === Game) {
				(state.Node!.Object as Game).AddData(fullEntity);
			} else if (state.Node!.Type === Action) {
				(state.Node!.Object as Action).Data.push(fullEntity);
			} else {
				throw new Error('Invalid node ' + state.Node!.Type);
			}
			state.CreateNewNode(newNode);
			state.Node = newNode;
			return true;
		}
		return false;
	}
}
