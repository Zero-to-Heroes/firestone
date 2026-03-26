import { GameTag } from '@firestone-hs/reference-data';
import { Action } from '../models/action';
import { FullEntity } from '../models/entity';
import { Node } from '../models/node';
import type { GameState } from '../state/game-state';
import type { StateFacade } from '../state/state-facade';

export class RazaTheResealed {
	static PredictCardId(
		gameState: GameState,
		creatorCardId: string,
		creatorEntityId: number,
		node: Node,
		stateFacade: StateFacade | null,
	): string | null {
		if (node.Parent?.Type !== Action) {
			return null;
		}

		const act = node.Parent.Object as Action;
		const actionEntity = gameState.CurrentEntities.get(act.Entity);
		if (!actionEntity) {
			return null;
		}

		if (actionEntity.CardIdsToCreate.length === 0) {
			const subSpell = (node.Object as FullEntity).SubSpellInEffect;
			if (subSpell?.Targets != null) {
				actionEntity.CardIdsToCreate = subSpell.Targets.map(
					(t) => gameState.CurrentEntities.get(t)?.CardId ?? '',
				);
			}
		}

		if (actionEntity.CardIdsToCreate.length > 0) {
			const result = actionEntity.CardIdsToCreate[0];
			actionEntity.CardIdsToCreate.splice(0, 1);
			return result;
		}
		return null;
	}
}
