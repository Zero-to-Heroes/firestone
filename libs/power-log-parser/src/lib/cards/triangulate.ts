import { BlockType, GameTag } from '@firestone-hs/reference-data';
import { Action, ShowEntity } from '../models/action';
import { Node, NodeType } from '../models/node';
import type { GameState } from '../state/game-state';
import type { StateFacade } from '../state/state-facade';

/**
 * Discover reveal for Triangulate: nested under PLAY → POWER; deck SpawnToDeck FullEntity closes in a
 * different branch than `node.Parent.Parent === PLAY`, so we walk ancestors for the PLAY block.
 */
function findTriangulateDiscoverShowEntity(
	triggerAction: Action,
	creatorEntityId: number,
): ShowEntity | null {
	const data = triggerAction.GetDataRecursive();
	const linked = data.find(
		(d): d is ShowEntity =>
			d instanceof ShowEntity &&
			!!d.CardId?.length &&
			d.GetTag(GameTag.CREATOR as number) === creatorEntityId,
	);
	if (linked) {
		return linked;
	}
	return (
		data.find(
			(d): d is ShowEntity => d instanceof ShowEntity && !!d.CardId?.length,
		) ?? null
	);
}

export class Triangulate {
	static PredictCardId(
		gameState: GameState,
		creatorCardId: string,
		creatorEntityId: number,
		node: Node,
		stateFacade: StateFacade | null,
	): string | null {
		let playAction: Action | null = null;
		let cur: Node | null = node;
		while (cur != null) {
			if (cur.Type === NodeType.Action) {
				const act = cur.Object as Action;
				if (act.Type === (BlockType.PLAY as number) && act.Entity === creatorEntityId) {
					playAction = act;
					break;
				}
			}
			cur = cur.Parent;
		}

		if (!playAction) {
			return null;
		}

		const triggerAction = playAction.Data.filter((d): d is Action => d instanceof Action).find(
			(a) => a.Type === (BlockType.POWER as number) && a.Entity === creatorEntityId,
		);
		if (!triggerAction) {
			return null;
		}

		const showEntity = findTriangulateDiscoverShowEntity(triggerAction, creatorEntityId);
		if (!showEntity) {
			return null;
		}

		const canReveal =
			showEntity.GetTag(GameTag.CASTS_WHEN_DRAWN) === 1 ||
			showEntity.GetTag(GameTag.SUMMONED_WHEN_DRAWN) === 1;
		const lp = stateFacade?.LocalPlayer;
		const triCaster =
			stateFacade?.GsState?.GameState.CurrentEntities.get(creatorEntityId) ??
			gameState.CurrentEntities.get(creatorEntityId);
		const casterController = triCaster?.GetEffectiveController() ?? -1;
		// Spectator logs: hide opponent discover. Ladder / own power.log: LocalPlayer heuristics can mismatch
		// the real account; do not gate on LocalPlayer there (see triangulate-created-by replay spec).
		if (
			stateFacade?.Spectating &&
			lp != null &&
			casterController !== lp.PlayerId &&
			!canReveal
		) {
			return null;
		}

		return showEntity.CardId ?? null;
	}
}
