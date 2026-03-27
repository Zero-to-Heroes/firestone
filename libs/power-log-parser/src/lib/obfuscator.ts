import { BlockType, CardIds, GameTag } from '@firestone-hs/reference-data';
import { Action } from './models/action';
import { FullEntity } from './models/entity';
import { Node, NodeType } from './models/node';
import type { GameState } from './state/game-state';

export class Obfuscator {
	static shouldObfuscateCardDraw(
		entity: FullEntity,
		gameState: GameState,
		node: Node,
		isPlayer: boolean,
		revealed = false,
	): boolean {
		if (node?.Parent?.Type === NodeType.Action) {
			const action = node.Parent.Object as Action;
			const actionEntityId = action.Entity;
			const actionEntity = gameState.CurrentEntities.get(actionEntityId);
			if (action.Type === (BlockType.POWER as number)) {
				const actionCardId = actionEntity?.CardId;
				switch (actionCardId) {
					case CardIds.SirFinleySeaGuide:
						return true;
				}
			}
		}

		if (
			!isPlayer &&
			entity.AllPreviousTags.find(
				(t) => t.Name === (GameTag.IS_USING_TRADE_OPTION as number) && t.Value === 1,
			) != null
		) {
			return true;
		}

		if (
			!isPlayer &&
			entity.Hidden &&
			!revealed &&
			entity.GetTag(GameTag.CASTS_WHEN_DRAWN) !== 1 &&
			entity.GetTag(GameTag.SUMMONED_WHEN_DRAWN) !== 1
		) {
			return true;
		}

		return false;
	}
}
