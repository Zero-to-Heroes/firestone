import { Injectable } from '@angular/core';
import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { AttackOnBoard, DeckCard, DeckState, EntityGameState, PlayerGameState } from '@firestone/game-state';

@Injectable()
export class AttackOnBoardService {
	/** @deprecated */
	public computeAttackOnBoard(deck: DeckState, playerFromTracker: PlayerGameState): AttackOnBoard {
		// console.debug(
		// 	'[attack-on-board] computing attack on board',
		// 	deck.board?.map((e) => ({ cardId: e.cardId, entityId: e.entityId })),
		// 	playerFromTracker?.Board?.map((e) => ({
		// 		cardId: e.cardId,
		// 		entityId: e.entityId,
		// 		attack: e.tags?.find((t) => t.Name === GameTag.ATK),
		// 	})),
		// );
		// Remove voidtouched attendants, as their effect only triggers when attacking the enemy hero
		const numberOfVoidtouchedAttendants = 0;
		// deck.board
		// 	.filter((entity) => entity.cardId === CardIds.VoidtouchedAttendant)
		// 	.filter((entity) => !this.isSilenced(entity.entityId, playerFromTracker.Board)).length || 0;
		const entitiesOnBoardThatCanAttack = deck.board
			.map((card) => playerFromTracker.Board?.find((entity) => entity.entityId === card.entityId))
			.filter((entity) => entity)
			.filter((entity) => this.canAttack(entity, deck.isActivePlayer, false))
			.filter((entity) => entity.attack > 0);
		// console.debug(
		// 	'[attack-on-board] entitiesOnBoardThatCanAttack',
		// 	entitiesOnBoardThatCanAttack.map((e) => e.cardId),
		// );
		// console.debug(
		// 	'[attack-on-board] entitiesOnBoardThatCanAttack',
		// 	entitiesOnBoardThatCanAttack,
		// 	deck.board
		// 		.map((card) => playerFromTracker.Board?.find((entity) => entity.entityId === card.entityId))
		// 		.filter((entity) => entity),
		// 	deck.board
		// 		.map((card) => playerFromTracker.Board?.find((entity) => entity.entityId === card.entityId))
		// 		.filter((entity) => entity)
		// 		.map((e) => e.tags.map((t) => ({ tag: GameTag[t.Name], value: t.Value }))),
		// );
		const totalAttackOnBoard = entitiesOnBoardThatCanAttack
			.map(
				(entity) =>
					Math.max(0, this.windfuryMultiplier(entity) - getTag(entity, GameTag.NUM_ATTACKS_THIS_TURN)) *
					this.getEntityAttack(entity, numberOfVoidtouchedAttendants, deck.board, playerFromTracker.Board),
			)
			.reduce((a, b) => a + b, 0);
		const baseHeroAttack = deck.isActivePlayer
			? Math.max(playerFromTracker?.Hero?.attack || 0, 0)
			: Math.max(playerFromTracker?.Weapon?.attack || 0, 0);

		const heroAttacksThisTurn = deck.isActivePlayer
			? getTag(playerFromTracker.Hero, GameTag.NUM_ATTACKS_THIS_TURN)
			: 0;
		const heroAttack =
			baseHeroAttack > 0 && this.canAttack(playerFromTracker.Hero, deck.isActivePlayer, true)
				? Math.max(
						0,
						Math.min(
							this.windfuryMultiplier(playerFromTracker.Hero),
							// We can get attack outside of weapons
							(getTag(playerFromTracker?.Weapon, GameTag.DURABILITY_DEPRECATED) ||
								getTag(playerFromTracker?.Weapon, GameTag.HEALTH)) -
								getTag(playerFromTracker?.Weapon, GameTag.DAMAGE) || 1,
						) - heroAttacksThisTurn,
				  ) *
				  (numberOfVoidtouchedAttendants + baseHeroAttack)
				: 0;
		// console.debug(
		// 	'heroAttack',
		// 	heroAttack,
		// 	baseHeroAttack,
		// 	playerFromTracker?.Hero,
		// 	this.canAttack(playerFromTracker.Hero, deck.isActivePlayer),
		// 	this.windfuryMultiplier(playerFromTracker.Hero),
		// 	playerFromTracker?.Weapon,
		// );
		const result = {
			board: totalAttackOnBoard,
			hero: heroAttack,
		} as AttackOnBoard;
		// console.debug('[attack-on-board] computed attack on board', result);
		return result;
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
		if (hasTag(entity, GameTag.MEGA_WINDFURY) || hasTag(entity, GameTag.WINDFURY, 3)) {
			return 4;
		}
		if (hasTag(entity, GameTag.WINDFURY)) {
			return 2;
		}
		return 1;
	}

	// On the opponent's turn, we show the total attack, except for dormant minions
	private canAttack(entity: EntityGameState, isActivePlayer: boolean, isHero: boolean): boolean {
		const isDormant = hasTag(entity, GameTag.DORMANT);
		const cantAttack = hasTag(entity, GameTag.CANT_ATTACK);
		// Here technically it's not totally correct, as you'd have to know if the
		// frozen minion will unfreeze in the opponent's turn
		const isFrozen = hasTag(entity, GameTag.FROZEN);
		const canTitanAttack =
			!hasTag(entity, GameTag.TITAN) ||
			(hasTag(entity, GameTag.TITAN_ABILITY_USED_1) &&
				hasTag(entity, GameTag.TITAN_ABILITY_USED_2) &&
				hasTag(entity, GameTag.TITAN_ABILITY_USED_3));
		const canStarshipAttack =
			!hasTag(entity, GameTag.STARSHIP) ||
			(!hasTag(entity, GameTag.LAUNCHPAD) && (!isActivePlayer || getTag(entity, GameTag.NUM_TURNS_IN_PLAY) > 1));
		const exhausted = hasTag(entity, GameTag.EXHAUSTED) || getTag(entity, GameTag.NUM_TURNS_IN_PLAY) === 0;
		const hasSummoningSickness =
			!isHero &&
			isActivePlayer &&
			!hasTag(entity, GameTag.CHARGE) &&
			(exhausted ||
				hasTag(entity, GameTag.JUST_PLAYED) ||
				// Ignore rush minions in the attack counter
				hasTag(entity, GameTag.ATTACKABLE_BY_RUSH));
		// console.debug(
		// 	'[attack-on-board] canAttack',
		// 	entity.cardId,
		// 	entity,
		// 	isDormant,
		// 	cantAttack,
		// 	isFrozen,
		// 	canTitanAttack,
		// 	hasSummoningSickness,
		// 	isActivePlayer,
		// );
		return !isDormant && !hasSummoningSickness && !isFrozen && !cantAttack && canTitanAttack && canStarshipAttack;
	}
}

export const hasTag = (entity, tag: number, value = 1): boolean => {
	if (!entity?.tags) {
		return false;
	}
	const matches = entity.tags.some((t) => t.Name === tag && t.Value === value);
	return matches;
};

export const getTag = (entity, tag: number): number => {
	return entity?.tags?.find((t) => t.Name === tag)?.Value ?? 0;
};
