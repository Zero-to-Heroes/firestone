import { BlockType, GameTag } from '@firestone-hs/reference-data';
import { Action, ShowEntity } from '../models/action';
import { Tag } from '../models/tag';
import { Node } from '../models/node';
import type { GameState } from '../state/game-state';
import type { StateFacade } from '../state/state-facade';

export class DeepSpaceCurator {
	static GuessTags(
		gameState: GameState,
		creatorCardId: string,
		creatorEntityId: number,
		node: Node,
		stateFacade: StateFacade | null,
	): Tag[] | null {
		if (node.Parent?.Parent?.Type !== Action) {
			return null;
		}

		const act = node.Parent.Parent.Object as Action;
		if (act.Type !== (BlockType.PLAY as number)) {
			return null;
		}

		const playedEntityId = act.Entity;
		const showEntity = act.Data
			.filter((d): d is ShowEntity => d instanceof ShowEntity)
			.find((e) => e.Entity === playedEntityId);

		const guessedTags: Tag[] = [];
		if (showEntity) {
			const tag = new Tag();
			tag.Name = GameTag.COST as number;
			tag.Value = showEntity.GetTag(GameTag.COST);
			guessedTags.push(tag);
		}
		return guessedTags;
	}
}
