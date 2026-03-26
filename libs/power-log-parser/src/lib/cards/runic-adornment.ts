import { BlockType, GameTag, Zone } from '@firestone-hs/reference-data';
import { Action } from '../models/action';
import { TagChange } from '../models/tag';
import { Node, NodeType } from '../models/node';
import type { GameState } from '../state/game-state';
import type { StateFacade } from '../state/state-facade';

export class RunicAdornment {
	static PredictCardId(
		gameState: GameState,
		creatorCardId: string,
		creatorEntityId: number,
		node: Node,
		stateFacade: StateFacade | null,
	): string | null {
		if (node.Parent?.Type !== NodeType.Action) {
			return null;
		}

		const act = node.Parent.Parent?.Object as Action;
		if (act.Type !== (BlockType.PLAY as number)) {
			return null;
		}

		const triggerAction = act.Data
			.filter((d): d is Action => d instanceof Action)
			.find((a) => a.Type === (BlockType.POWER as number) && a.Entity === act.Entity);
		if (!triggerAction) {
			return null;
		}

		const tagChange = triggerAction.Data
			.filter((d): d is TagChange => d instanceof TagChange)
			.find(
				(d) =>
					d.Name === (GameTag.ZONE as number) && d.Value === (Zone.HAND as number),
			);
		if (!tagChange) {
			return null;
		}

		const entity = gameState.CurrentEntities.get(tagChange.Entity);
		return entity?.CardId ?? null;
	}
}
