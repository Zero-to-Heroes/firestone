import { ChoiceType } from '@firestone-hs/reference-data';
import type { Helper } from '../helper';
import { Action, Choice, Choices, Game, Node, NodeType } from '../models';
import { Regexes } from '../regexes';
import type { ParserState } from '../state/parser-state';

export class ChoicesHandler {
	static Handle(timestamp: string, data: string, state: ParserState, helper: Helper): void {
		if (state.CurrentGame == null || state.Node == null) {
			return;
		}

		data = data.trim();

		let match = Regexes.ChoicesChoiceRegex.exec(data);
		if (match) {
			state.UpdateCurrentNode(NodeType.Game, NodeType.Action);
			const rawId = match[1];
			const parsedId = parseInt(data, 10);
			const id = isNaN(parsedId) ? 0 : parsedId;
			const rawPlayer = match[2];
			const rawTaskList = match[3];
			const rawType = match[4];
			const min = match[5];
			const max = match[6];
			const player = helper.ParseEntity(rawPlayer);
			const type = helper.ParseEnum(ChoiceType, rawType);
			const parsedTaskList = parseInt(rawTaskList, 10);
			const taskList = isNaN(parsedTaskList) ? -1 : parsedTaskList;
			const choices = new Choices();
			choices.ChoiceList = [];
			choices.Id = id;
			choices.Max = parseInt(max, 10);
			choices.Min = parseInt(min, 10);
			choices.PlayerId = player;
			choices.TaskList = taskList;
			choices.Type = type;
			choices.TimeStamp = timestamp;
			state.Choices = choices;

			if (state.Node.Type === NodeType.Game) {
				(state.Node.Object as Game).AddData(state.Choices);
			} else if (state.Node.Type === NodeType.Action) {
				(state.Node.Object as Action).Data.push(state.Choices);
			} else {
				throw new Error('Invalid node ' + state.Node.Type + ' -- ' + data);
			}
			return;
		}

		match = Regexes.ChoicesSourceRegex.exec(data);
		if (match) {
			const rawEntity = match[1];
			const entity = helper.ParseEntity(rawEntity);
			state.Choices!.Source = entity;
			return;
		}

		match = Regexes.ChoicesEntitiesRegex.exec(data);
		if (match) {
			const index = match[1];
			const rawEntity = match[2];
			const entity = helper.ParseEntity(rawEntity);
			const choice = new Choice();
			choice.Entity = entity;
			choice.Index = parseInt(index, 10);
			state.Choices!.ChoiceList.push(choice);
		}

		match = Regexes.ChoicesWaitingForInput.exec(data);
		if (match) {
			state.CreateNewNode(new Node(NodeType.Choices, state.Choices, 0, null, data));
		}
	}
}
