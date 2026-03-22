import { BlockType, GameTag } from '@firestone-hs/reference-data';
import type { Helper } from '../helper';
import { Action, Game, GameData, Node } from '../models';
import { Regexes } from '../regexes';
import type { ParserState } from '../state/parser-state';

export class BlockStartHandler {
	static Handle(
		timestamp: string,
		data: string,
		state: ParserState,
		indentLevel: number,
		helper: Helper,
	): boolean {
		if (!data.includes('BLOCK_START')) {
			return false;
		}
		const match = Regexes.ActionStartRegex.exec(data);
		if (match) {
			const rawType = match[1];
			const rawEntity = match[2];
			const effectId = match[3];
			const effectIndex = match[4];
			const rawTarget = match[5];
			const subOption = parseInt(match[6], 10);
			const rawTriggerKeyword = match[7];

			state.GameState.UpdateEntityName(rawEntity);

			const entity = helper.ParseEntity(rawEntity);
			const target = helper.ParseEntity(rawTarget);
			const type = helper.ParseEnum(BlockType, rawType);
			const triggerKeyword = helper.ParseEnum(GameTag, rawTriggerKeyword);
			const action = new Action();
			action.Data = [];
			action.Entity = entity;
			action.Target = target;
			action.TimeStamp = timestamp;
			action.Type = type;
			action.SubOption = subOption;
			action.TriggerKeyword = triggerKeyword;
			action.DebugCreationLine = data;

			if (effectIndex != null && effectIndex.length > 0) {
				action.EffectIndex = parseInt(effectIndex, 10);
			}

			if (type === (BlockType.PLAY as number)) {
				state.UpdateCurrentNode(Game);
			} else if (type !== (BlockType.TRIGGER as number) && state.Node?.Type === Action) {
				const parentAction = state.Node.Object as Action;
				if (parentAction.Type === (BlockType.ATTACK as number)) {
					state.UpdateCurrentNode(Game);
				}
			}

			state.UpdateCurrentNode(Game, Action);
			if (state.Node!.Type === Game) {
				(state.Node!.Object as Game).AddData(action);
			} else if (state.Node!.Type === Action) {
				(state.Node!.Object as Action).Data.push(action);
			} else {
				throw new Error('Invalid node ' + state.Node!.Type);
			}
			const newNode = new Node(Action, action, indentLevel, state.Node, data);
			state.CreateNewNode(newNode);
			state.Node = newNode;
			return true;
		}

		return false;
	}
}
