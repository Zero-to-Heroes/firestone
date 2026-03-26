import { GameTag } from '@firestone-hs/reference-data';
import { Action } from '../models/action';
import { Node } from '../models/node';
import type { GameState } from '../state/game-state';
import type { StateFacade } from '../state/state-facade';

export class DemonicProject {
	static PredictCardId(
		gameState: GameState,
		entityId: number,
		creatorEntityId: number,
		node: Node,
		stateFacade: StateFacade | null,
	): string | null {
		if (node.Parent?.Type !== Action) {
			return null;
		}

		const act = node.Parent.Object as Action;
		const actionEntity = gameState.CurrentEntities.get(act.Entity);
		const createdEntity = gameState.CurrentEntities.get(entityId);
		if (!actionEntity || !createdEntity) {
			return null;
		}

		const transformedEntity1 = gameState.CurrentEntities.get(
			actionEntity.GetTag(GameTag.TAG_SCRIPT_DATA_ENT_1),
		);
		if (transformedEntity1?.GetController() === createdEntity.GetController()) {
			const dbfId = actionEntity.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_1);
			return '' + dbfId;
		}

		const transformedEntity2 = gameState.CurrentEntities.get(
			actionEntity.GetTag(GameTag.TAG_SCRIPT_DATA_ENT_2),
		);
		if (transformedEntity2?.GetController() === createdEntity.GetController()) {
			const dbfId = actionEntity.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_2);
			return '' + dbfId;
		}
		return null;
	}
}
