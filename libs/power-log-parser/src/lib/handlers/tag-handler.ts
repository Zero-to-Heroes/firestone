import { GameTag } from '@firestone-hs/reference-data';
import type { Helper } from '../helper';
import { ChangeEntity, FullEntity, Game, GameEntity, NodeType, PlayerEntity, ShowEntity, Tag } from '../models';
import { Regexes } from '../regexes';
import type { ParserState } from '../state/parser-state';

export class TagHandler {
	static Handle(timestamp: string, data: string, state: ParserState, helper: Helper): boolean {
		if (data.includes('CACHED_TAG_FOR_DORMANT_CHANGE')) {
			return false;
		}

		if (state.Node!.Type === NodeType.Game) {
			return false;
		}

		const match = Regexes.ActionTagRegex.exec(data);
		if (match) {
			const tagName = match[1];
			const value = match[2];
			let tag: Tag | null = null;
			try {
				tag = helper.ParseTag(tagName, value);
			} catch (e: any) {
				console.debug('Warning when parsing Tag: ' + tagName + ' with value ' + value, e.message);
				return false;
			}

			if (tag.Name === (GameTag.CURRENT_PLAYER as number) && state.Node!.Object instanceof PlayerEntity) {
				state.FirstPlayerEntityId = (state.Node!.Object as PlayerEntity).Id;
			}

			if (state.Node!.Type === NodeType.GameEntity) {
				(state.Node!.Object as GameEntity).AddTag(tag);
				if (tag.Name === (GameTag.GAME_SEED as number)) {
					state.CurrentGame.GameSeed = tag.Value;
				}
			} else if (state.Node!.Type === NodeType.PlayerEntity) {
				(state.Node!.Object as PlayerEntity).AddTag(tag);
			} else if (state.Node!.Type === NodeType.FullEntity) {
				(state.Node!.Object as FullEntity).AddTag(tag);
			} else if (state.Node!.Type === NodeType.ShowEntity) {
				(state.Node!.Object as ShowEntity).Tags.push(tag);
			} else if (state.Node!.Type === NodeType.ChangeEntity) {
				(state.Node!.Object as ChangeEntity).Tags.push(tag);
				state.GameState.Tag(tag, (state.Node!.Object as ChangeEntity).Entity);
			} else {
				console.debug('Invalid node ' + state.Node!.Type, data);
			}
			return true;
		}
		return false;
	}
}
