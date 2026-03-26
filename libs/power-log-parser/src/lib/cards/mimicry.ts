import { GameTag } from '@firestone-hs/reference-data';
import { Action } from '../models/action';
import { FullEntity } from '../models/entity';
import { Node, NodeType } from '../models/node';
import type { GameState } from '../state/game-state';
import type { StateFacade } from '../state/state-facade';

export class Mimicry {
	static PredictCardId(
		gameState: GameState,
		entityId: number,
		creatorEntityId: number,
		node: Node,
		stateFacade: StateFacade | null,
	): string | null {
		if (node.Parent?.Type !== NodeType.Action) {
			return null;
		}

		const act = node.Parent.Object as Action;
		const candidates = act.Data
			.filter((d): d is FullEntity => d instanceof FullEntity)
			.map((d) => gameState.CurrentEntities.get(d.Entity))
			.filter((d) => d != null && d.GetTag(GameTag.COPIED_FROM_ENTITY_ID) === entityId);

		const last = candidates.length > 0 ? candidates[candidates.length - 1] : null;
		return last?.CardId ?? null;
	}
}
