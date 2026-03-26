import { GameFormat, GameType } from '@firestone-hs/reference-data';
import type { Helper } from '../helper';
import { GameEventProvider, GameEvent } from '../game-event';
import { Node, NodeType } from '../models';
import { Regexes } from '../regexes';
import type { ParserState, StateType } from '../state/parser-state';
import { StateType as ST } from '../state/parser-state';
import type { GameMetaData } from '../state/game-meta-data';

export class MetaDataHandler {
	static Handle(
		timestamp: string,
		data: string,
		state: ParserState,
		stateType: StateType,
		metadata: GameMetaData,
		helper: Helper,
	): boolean {
		if (data.includes('BuildNumber=')) {
			const match = Regexes.BuildNumber.exec(data);
			if (match) {
				metadata.BuildNumber = parseInt(match[1], 10);
				state.CurrentGame.BuildNumber = metadata.BuildNumber;
				return true;
			}
		}

		if (data.includes('GameType=')) {
			const match = Regexes.GameType.exec(data);
			if (match) {
				const rawGameType = match[1];
				const gameType = helper.ParseEnum(GameType, rawGameType);
				metadata.GameType = gameType;
				state.CurrentGame.GameType = metadata.GameType;
				return true;
			}
		}

		if (data.includes('FormatType=')) {
			const match = Regexes.FormatType.exec(data);
			if (match) {
				const rawFormatType = match[1];
				const formatType = helper.ParseEnum(GameFormat, rawFormatType);
				metadata.FormatType = formatType;
				state.CurrentGame.FormatType = metadata.FormatType;
				return true;
			}
		}

		if (data.includes('ScenarioID=')) {
			const match = Regexes.ScenarioID.exec(data);
			if (match) {
				metadata.ScenarioID = parseInt(match[1], 10);
				state.CurrentGame.ScenarioID = metadata.ScenarioID;
				if (stateType === ST.GameState) {
					state.NodeParser.EnqueueGameEvent([
						GameEventProvider.Create(
							timestamp,
							'MATCH_METADATA',
							() => {
								state.CurrentGame.BuildNumber = metadata.BuildNumber;
								state.CurrentGame.GameType = metadata.GameType;
								state.CurrentGame.FormatType = metadata.FormatType;
								state.GameState.MetaData = metadata;
								return {
									Type: 'MATCH_METADATA',
									Value: {
										MetaData: metadata,
										Spectating: state.Spectating,
									},
								};
							},
							false,
							new Node(NodeType.Placeholder, null, 0, null, data),
						),
					]);
				}
				return true;
			}
		}
		return false;
	}
}
