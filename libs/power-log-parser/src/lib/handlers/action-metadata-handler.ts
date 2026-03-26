import type { Helper } from '../helper';
import { MetaDataType } from '../enums';
import { Action, Game, Info, MetaData, Node, NodeType } from '../models';
import { Regexes } from '../regexes';
import type { ParserState } from '../state/parser-state';

export class ActionMetadataHandler {
	static Handle(
		timestamp: string,
		data: string,
		state: ParserState,
		indentLevel: number,
		helper: Helper,
	): boolean {
		const match = Regexes.ActionMetadataRegex.exec(data);
		if (match) {
			const rawMeta = match[1];
			const rawData = match[2];
			const info = match[3];
			const parsedData = helper.ParseEntity(rawData);
			const meta = helper.ParseEnum(MetaDataType, rawMeta);
			const metaData = new MetaData();
			metaData.Data = parsedData;
			metaData.Info = parseInt(info, 10);
			metaData.Meta = meta;
			metaData.MetaInfo = [];
			metaData.TimeStamp = timestamp;

			state.UpdateCurrentNode(NodeType.Action);
			if (state.Node!.Type === NodeType.Action) {
				(state.Node!.Object as Action).Data.push(metaData);
			} else if (state.Node!.Type === NodeType.Game) {
				(state.Node!.Object as Game).AddData(metaData);
			} else {
				throw new Error('Invalid node ' + state.Node!.Type + ' for ' + timestamp + ' ' + data);
			}
			const newNode = new Node(NodeType.MetaData, metaData, indentLevel, state.Node, data);
			state.CreateNewNode(newNode);
			state.Node = newNode;
			return true;
		}
		return false;
	}
}
