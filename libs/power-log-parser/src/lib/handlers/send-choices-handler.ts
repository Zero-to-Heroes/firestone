import { ChoiceType } from '@firestone-hs/reference-data';
import type { Helper } from '../helper';
import { Action, Choice, Game, NodeType, SendChoices } from '../models';
import { Regexes } from '../regexes';
import type { ParserState } from '../state/parser-state';

export class SendChoicesHandler {
	static Handle(timestamp: string, data: string, state: ParserState, helper: Helper): void {
		if (state.CurrentGame == null || state.Node == null) {
			return;
		}

		data = data.trim();
		let match = Regexes.SendChoicesChoicetypeRegex.exec(data);
		if (match) {
			const id = match[1];
			const rawType = match[2];
			const type = helper.ParseEnum(ChoiceType, rawType);
			const sendChoices = new SendChoices();
			sendChoices.Choices = [];
			sendChoices.Entity = parseInt(id, 10);
			sendChoices.Type = type;
			sendChoices.TimeStamp = timestamp;
			state.SendChoices = sendChoices;

			if (state.Node.Type === NodeType.Game) {
				(state.Node.Object as Game).AddData(state.SendChoices);
			} else if (state.Node.Type === NodeType.Action) {
				(state.Node.Object as Action).Data.push(state.SendChoices);
			} else {
				throw new Error('Invalid node ' + state.Node.Type + ' -- ' + data);
			}
			return;
		}
		match = Regexes.SendChoicesEntitiesRegex.exec(data);
		if (match) {
			const index = helper.ParseEntity(match[1]);
			const id = helper.ParseEntity(match[2]);
			const choice = new Choice();
			choice.Entity = id;
			choice.Index = index;
			state.SendChoices!.Choices.push(choice);
		}
	}
}
