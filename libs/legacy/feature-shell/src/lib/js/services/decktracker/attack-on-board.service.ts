import { Injectable } from '@angular/core';
import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { AttackOnBoard } from '../../models/decktracker/attack-on-board';
import { DeckCard } from '../../models/decktracker/deck-card';
import { DeckState } from '../../models/decktracker/deck-state';
import { EntityGameState, PlayerGameState } from '../../models/game-event';

@Injectable()
export class AttackOnBoardService {
	public computeAttackOnBoard(deck: DeckState, playerFromTracker: PlayerGameState): AttackOnBoard {
		const numberOfVoidtouchedAttendants =
			deck.board
				.filter((entity) => entity.cardId === CardIds.VoidtouchedAttendant)
				.filter((entity) => !this.isSilenced(entity.entityId, playerFromTracker.Board)).length || 0;
		const entitiesOnBoardThatCanAttack = deck.board
			.map((card) => playerFromTracker.Board?.find((entity) => entity.entityId === card.entityId))
			.filter((entity) => entity)
			.filter((entity) => this.canAttack(entity, deck.isActivePlayer))
			.filter((entity) => entity.attack > 0);
		const totalAttackOnBoard = entitiesOnBoardThatCanAttack
			.map(
				(entity) =>
					this.windfuryMultiplier(entity) *
					this.getEntityAttack(entity, numberOfVoidtouchedAttendants, deck.board, playerFromTracker.Board),
			)
			.reduce((a, b) => a + b, 0);
		const baseHeroAttack = deck.isActivePlayer
			? Math.max(playerFromTracker?.Hero?.attack || 0, 0)
			: Math.max(playerFromTracker?.Weapon?.attack || 0, 0);
		const heroAttack =
			baseHeroAttack > 0 && this.canAttack(playerFromTracker.Hero, deck.isActivePlayer)
				? Math.min(this.windfuryMultiplier(playerFromTracker.Hero), playerFromTracker?.Weapon?.durability) *
				  (numberOfVoidtouchedAttendants + baseHeroAttack)
				: 0;
		return {
			board: totalAttackOnBoard,
			hero: heroAttack,
		} as AttackOnBoard;
	}

	private isSilenced(entityId: number, board: readonly EntityGameState[]): boolean {
		const entityOnBoard = board.find((e) => e.entityId === entityId);
		if (!entityOnBoard) {
			return false;
		}
		return !!entityOnBoard.tags?.find((t) => t.Name === GameTag.SILENCED && t.Value > 0);
	}

	private getEntityAttack(
		entity: EntityGameState,
		numberOfVoidtouchedAttendants: number,
		board: readonly DeckCard[],
		boardFromTracker: readonly EntityGameState[],
	): number {
		if (entity.cardId === CardIds.NeptulonTheTidehunter && !this.isSilenced(entity.entityId, boardFromTracker)) {
			const hands = board
				.filter(
					(e) =>
						e.cardId === CardIds.NeptulonTheTidehunter_NeptulonsHandToken_TID_712t ||
						e.cardId === CardIds.NeptulonTheTidehunter_NeptulonsHandToken_TID_712t2,
				)
				.map((h) => boardFromTracker.find((e) => e.entityId === h.entityId))
				.filter((h) => !!h);
			if (!hands.length) {
				return entity.attack + numberOfVoidtouchedAttendants;
			}
			const handAttacks = hands.map((h) => h.attack + numberOfVoidtouchedAttendants).reduce((a, b) => a + b, 0);
			return handAttacks;
		}
		return entity.attack + numberOfVoidtouchedAttendants;
	}

	private windfuryMultiplier(entity): number {
		if (hasTag(entity, GameTag.SILENCED)) {
			return 1;
		}
		if (
			hasTag(entity, GameTag.MEGA_WINDFURY) ||
			hasTag(entity, GameTag.WINDFURY, 3) ||
			hasTag(entity, GameTag.WINDFURY)
		) {
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
		const isFrozen = hasTag(entity, GameTag.FROZEN);
		const hasSummoningSickness =
			isActivePlayer &&
			(hasTag(entity, GameTag.EXHAUSTED) || hasTag(entity, GameTag.JUST_PLAYED)) &&
			// Ignore rush minions in the attack counter
			// !hasTag(entity, GameTag.ATTACKABLE_BY_RUSH) &&
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
