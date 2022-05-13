import { Injectable } from '@angular/core';
import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { AttackOnBoard } from '../../models/decktracker/attack-on-board';
import { DeckState } from '../../models/decktracker/deck-state';

@Injectable()
export class AttackOnBoardService {
	public computeAttackOnBoard(deck: DeckState, playerFromTracker): AttackOnBoard {
		const numberOfVoidtouchedAttendants =
			deck.board.filter((entity) => entity.cardId === CardIds.VoidtouchedAttendant).length || 0;
		const entitiesOnBoardThatCanAttack = deck.board
			.map((card) => playerFromTracker.Board?.find((entity) => entity.entityId === card.entityId))
			.filter((entity) => entity)
			.filter((entity) => this.canAttack(entity, deck.isActivePlayer))
			.filter((entity) => entity.attack > 0);
		const totalAttackOnBoard = entitiesOnBoardThatCanAttack
			.map((entity) => this.windfuryMultiplier(entity) * (numberOfVoidtouchedAttendants + entity.attack))
			.reduce((a, b) => a + b, 0);
		const baseHeroAttack = deck.isActivePlayer
			? Math.max(playerFromTracker?.Hero?.attack || 0, 0)
			: Math.max(playerFromTracker?.Weapon?.attack || 0, 0);
		const heroAttack =
			baseHeroAttack > 0 && this.canAttack(playerFromTracker.Hero, deck.isActivePlayer)
				? this.windfuryMultiplier(playerFromTracker.Hero) * (numberOfVoidtouchedAttendants + baseHeroAttack)
				: 0;
		return {
			board: totalAttackOnBoard,
			hero: heroAttack,
		} as AttackOnBoard;
	}

	private windfuryMultiplier(entity): number {
		if (hasTag(entity, GameTag.MEGA_WINDFURY) || hasTag(entity, GameTag.WINDFURY, 3)) {
			return 4;
		}
		if (hasTag(entity, GameTag.WINDFURY)) {
			return 2;
		}
		return 1;
	}

	// On the opponent's turn, we show the total attack, except for dormant minions
	private canAttack(entity, isActivePlayer: boolean): boolean {
		const isDormant = hasTag(entity, GameTag.DORMANT);
		const cantAttack = hasTag(entity, GameTag.CANT_ATTACK);
		// Here technically it's not totally correct, as you'd have to know if the
		// frozen minion will unfreeze in the opponent's turn
		const isFrozen = isActivePlayer && hasTag(entity, GameTag.FROZEN);
		const hasSummoningSickness =
			isActivePlayer &&
			hasTag(entity, GameTag.EXHAUSTED) &&
			!hasTag(entity, GameTag.ATTACKABLE_BY_RUSH) &&
			!hasTag(entity, GameTag.CHARGE);
		return !isDormant && !hasSummoningSickness && !isFrozen && !cantAttack;
	}
}

export const hasTag = (entity, tag: number, value = 1): boolean => {
	if (!entity?.tags) {
		return false;
	}
	const matches = entity.tags.some((t) => t.Name === tag && t.Value === value);
	return matches;
};
