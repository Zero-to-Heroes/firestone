import { BlockType, GameTag } from '@firestone-hs/reference-data';
import { Action, ShowEntity } from '../models/action';
import { FullEntity } from '../models/entity';
import { Node } from '../models/node';
import type { GameState } from '../state/game-state';
import type { StateFacade } from '../state/state-facade';

export class Triangulate {
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

		const act = node.Parent.Parent?.Object as Action;
		if (act.Type !== (BlockType.PLAY as number)) {
			return null;
		}

		const actionEntity = gameState.CurrentEntities.get(act.Entity);
		const controller = actionEntity?.GetController() ?? -1;

		const triggerAction = act.Data
			.filter((d): d is Action => d instanceof Action)
			.find((a) => a.Type === (BlockType.POWER as number) && a.Entity === act.Entity);
		if (!triggerAction) {
			return null;
		}

		const showEntity = triggerAction.Data
			.filter((d): d is ShowEntity => d instanceof ShowEntity)
			.find(() => true);
		if (!showEntity) {
			return null;
		}

		const canReveal =
			showEntity.GetTag(GameTag.CASTS_WHEN_DRAWN) === 1 ||
			showEntity.GetTag(GameTag.SUMMONED_WHEN_DRAWN) === 1;
		if (controller !== stateFacade?.LocalPlayer?.PlayerId && !canReveal) {
			return null;
		}

		return showEntity?.CardId ?? null;
	}
}
