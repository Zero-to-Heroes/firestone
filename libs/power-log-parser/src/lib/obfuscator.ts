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
		const debug = entity.Entity === 158;
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

		// This is here to prevent info leaks.
		// However, it overrides any other logic we can have - for instance, mimicry should let you
		// know what is what
		if (
			!isPlayer &&
			entity.AllPreviousTags.find((t) => t.Name === (GameTag.IS_USING_TRADE_OPTION as number) && t.Value === 1) !=
				null
		) {
			return true;
		}

		if (
			!isPlayer &&
			// Always obfuscate for the opponent if the card is not marked as being revealed
			// For instance, Deathwing creates cards in the opponent's deck, and they are barebones, without any
			// additional tag. So Hidden is false in that case, as well as revealed.
			// UPDATE 2026-06-18: not needed right now, but I think we'll have to comment it at some point
			entity.Hidden &&
			!revealed &&
			entity.GetTag(GameTag.CASTS_WHEN_DRAWN) !== 1 &&
			entity.GetTag(GameTag.SUMMONED_WHEN_DRAWN) !== 1
		) {
			return true;
		}

		return false;
	}

	/**
	 * When card identity is obfuscated, still pass creator provenance if the entity came from deck.
	 * Game-state gates what is safe to use ({@link publicCardGiftCreators}, isCreatorPublic, etc.).
	 */
	static creatorCardIdForDrawEvent(
		shouldObfuscate: boolean,
		wasInDeck: boolean,
		creatorCardId: string | null | undefined,
	): string | null {
		if (!creatorCardId) {
			return null;
		}
		if (!shouldObfuscate) {
			return creatorCardId;
		}
		return wasInDeck ? creatorCardId : null;
	}
}
