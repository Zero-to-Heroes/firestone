import type { Helper } from '../helper';
import { Action, Choice, ChosenEntities, Game, Node, NodeType } from '../models';
import { Regexes } from '../regexes';
import type { ParserState } from '../state/parser-state';

export class EntityChosenHandler {
	static Handle(timestamp: string, data: string, state: ParserState, helper: Helper): void {
		if (state.CurrentGame == null || state.Node == null) {
			return;
		}

		data = data.trim();
		let match = Regexes.EntitiesChosenRegex.exec(data);
		if (match) {
			const rawEntity = match[1];
			const rawPlayer = match[2];
			const count = parseInt(match[3], 10);
			const entity = helper.ParseEntity(rawEntity);
			const player = helper.ParseEntity(rawPlayer);
			const cEntities = new ChosenEntities();
			cEntities.Entity = entity;
			cEntities.PlayerId = player;
			cEntities.Count = count;
			cEntities.Choices = [];
			cEntities.TimeStamp = timestamp;

			if (state.Node.Type === NodeType.Game) {
				(state.Node.Object as Game).AddData(cEntities);
			} else if (state.Node.Type === NodeType.Action) {
				(state.Node.Object as Action).Data.push(cEntities);
			} else {
				throw new Error('Invalid node ' + state.Node.Type + ' -- ' + data);
			}
			state.CurrentChosenEntites = cEntities;
			return;
		}
		match = Regexes.EntitiesChosenEntitiesRegex.exec(data);
		if (match) {
			const index = parseInt(match[1], 10);
			const rawEntity = match[2];
			const entity = helper.ParseEntity(rawEntity);
			const choice = new Choice();
			choice.Entity = entity;
			choice.Index = index;
			choice.TimeStamp = timestamp;
			state.CurrentChosenEntites?.Choices?.push(choice);
			state.UpdateCurrentNode(NodeType.Game, NodeType.Action);
			state.CreateNewNode(new Node(NodeType.Choice, choice, 0, null, data));
			return;
		}
		console.warn('Warning: Unhandled chosen entities: ' + data);
	}
}
