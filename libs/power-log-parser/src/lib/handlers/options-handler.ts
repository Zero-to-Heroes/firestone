import type { Helper } from '../helper';
import { GameEventProvider } from '../game-event';
import { Game, MetaData, Node, Option, Options, SubOption, Target } from '../models';
import { Regexes } from '../regexes';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class OptionsHandler {
	static Handle(
		timestamp: string,
		data: string,
		state: ParserState,
		stateType: StateType,
		stateFacade: StateFacade,
		helper: Helper,
	): void {
		if (state.CurrentGame == null || state.Node == null) {
			return;
		}

		if (stateType === StateType.PowerTaskList && state.ReconnectionOngoing) {
			state.ReconnectionOngoing = false;
			stateFacade.GsState!.ReconnectionOngoing = false;
			state.NodeParser.EnqueueGameEvent([
				GameEventProvider.Create(
					timestamp,
					'RECONNECT_OVER',
					() => ({
						Type: 'RECONNECT_OVER',
					}),
					false,
					new Node(null as any, null, 0, null, data),
				),
			]);
		}

		data = data.trim();
		let match = Regexes.OptionsEntityRegex.exec(data);
		if (match) {
			const id = match[1];
			const options = new Options();
			options.Id = parseInt(id, 10);
			options.OptionList = [];
			options.TimeStamp = timestamp;
			state.Options = options;

		if (false && stateType === StateType.GameState && !stateFacade.IsBattlegrounds()) {
			if (state.Node!.Type !== MetaData) {
				stateFacade.NotifyUpdateToRootNeeded();
				state.UpdateCurrentNode(Game);
				if (state.Node!.Type === Game) {
					(state.Node!.Object as Game).AddData(state.Options!);
				} else {
					throw new Error('Invalid node ' + state.Node!.Type + ' -- ' + data);
				}
			}
		} else {
				state.CurrentGame.AddData(state.Options);
			}
			return;
		}
		match = Regexes.OptionsOptionRegex.exec(data);
		if (match) {
			const index = match[1];
			const rawType = match[2];
			const rawEntity = match[3];
			const rawError = match[4];

			const entity = helper.ParseEntity(rawEntity);
			const type = parseInt(rawType, 10) || 0;
			const error = parseInt(rawError, 10) || 0;

			const option = new Option();
			option.Entity = entity;
			option.Index = parseInt(index, 10);
			option.Type = type;
			option.Error = error;
			option.OptionItems = [];
			state.Options!.OptionList.push(option);
			state.CurrentOption = option;
			state.LastOption = option;
			return;
		}

		match = Regexes.OptionsSuboptionRegex.exec(data);
		if (match) {
			const subOptionType = match[1];
			const index = match[2];
			const rawEntity = match[3];
			const entity = helper.ParseEntity(rawEntity);

			if (subOptionType === 'subOption') {
				const subOption = new SubOption();
				subOption.Entity = entity;
				subOption.Index = parseInt(index, 10);
				subOption.Targets = [];
				state.CurrentOption!.OptionItems.push(subOption);
				state.LastOption = subOption;
			} else if (subOptionType === 'target') {
				const target = new Target();
				target.Entity = entity;
				target.Index = parseInt(index, 10);
				if (state.LastOption instanceof Option) {
					state.LastOption.OptionItems.push(target);
					return;
				}
				if (state.LastOption instanceof SubOption) {
					state.LastOption.Targets.push(target);
				}
			} else {
				throw new Error('Unexpected suboption type: ' + subOptionType);
			}
		}
	}
}
