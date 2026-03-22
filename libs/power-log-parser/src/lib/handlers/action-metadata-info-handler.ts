import type { Helper } from '../helper';
import { Info, MetaData, Node } from '../models';
import { Regexes } from '../regexes';
import type { ParserState } from '../state/parser-state';

export class ActionMetadataInfoHandler {
	static Handle(
		timestamp: string,
		data: string,
		state: ParserState,
		indentLevel: number,
		helper: Helper,
	): boolean {
		const match = Regexes.ActionMetaDataInfoRegex.exec(data);
		if (match) {
			const index = match[1];
			const rawEntity = match[2];
			const entity = helper.ParseEntity(rawEntity);
			const metaInfo = new Info();
			metaInfo.Id = entity;
			metaInfo.Index = parseInt(index, 10);
			metaInfo.Entity = entity;
			metaInfo.TimeStamp = timestamp;

			if (state.Node!.Type === MetaData) {
				(state.Node!.Object as MetaData).MetaInfo.push(metaInfo);
			} else {
				throw new Error('Invalid node ' + state.Node!.Type + ' while parsing ' + data);
			}
			state.CreateNewNode(new Node(Info, metaInfo, indentLevel, state.Node, data));
			return true;
		}
		return false;
	}
}
