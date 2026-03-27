import { GameTag } from '@firestone-hs/reference-data';
import { Map } from 'immutable';
import { Action } from '../../models/action/action';
import { Entity } from '../../models/game/entity';
import { PlayerEntity } from '../../models/game/player-entity';
import { EntityTag } from '../../models/parser/entity-tag';
import { deepEqual } from '../../utils';

export class ActionHelper {
	public static getOwner(entities: Map<number, Entity>, entityId: number): PlayerEntity {
		const ownerId = entityId;
		let owner = entities.get(ownerId);
		if (!(owner instanceof PlayerEntity)) {
			const controllerId = entities.get(entityId).getTag(GameTag.CONTROLLER);
			owner = entities
				.filter((entity: Entity) => entity instanceof PlayerEntity)
				.filter((entity: PlayerEntity) => entity.playerId === controllerId)
				.first();
		}
		return owner as PlayerEntity;
	}

	public static getCardId(
		entities: Map<number, Entity>,
		entityId: number,
		allEntitiesSoFar: Map<number, Entity>,
	): string {
		const entity = entities.get(entityId);
		if (entity && entity.cardID) {
			return entity.cardID;
		}

		if (allEntitiesSoFar) {
			const entitySoFar = allEntitiesSoFar.get(entityId);
			if (entitySoFar && entitySoFar.cardID) {
				return entitySoFar.cardID;
			}
		}

		// Otherwise, this can happen when we're targeting a player entity, which doesn't have a card id
		if (!(entity instanceof PlayerEntity)) {
			// Since we don't always know the entity id, it is often correct to say we don't know
			return null;
		}
		const heroEntityId = entity.getTag(GameTag.HERO_ENTITY);
		return entities.get(heroEntityId).cardID;
	}

	public static combineActions<T extends Action>(
		actions: readonly Action[],
		shouldMerge: (a: Action, b: Action) => boolean,
		combiner: (a: T, b: T) => T,
		shouldSwap?: (a: Action, b: Action) => boolean,
	): readonly Action[] {
		let previousResult = actions;
		let result: readonly Action[] = ActionHelper.doCombine(previousResult, shouldMerge, combiner, shouldSwap);
		while (!deepEqual(result, previousResult)) {
			previousResult = result;
			result = ActionHelper.doCombine(previousResult, shouldMerge, combiner);
		}
		return result;
	}

	public static getTag(tags: readonly EntityTag[], name: GameTag): number {
		if (!tags) {
			return null;
		}
		const defender = tags?.find((tag) => tag.tag === name);
		return defender ? defender.value : 0;
	}

	public static mergeIntoFirstAction<T extends Action>(first: T, second: Action, newElements: T): T {
		const result = first.updateAction(newElements);
		// const concat = [...(first.damages || []), ...(second.damages || [])] as ReadonlyArray<Damage>;
		const finalDamages = first.damages.mergeWith((prev, next) => prev + next, second.damages);
		return result.updateAction({
			damages: finalDamages,
		} as T) as T;
	}

	private static doCombine<T extends Action>(
		actions: readonly Action[],
		shouldMerge: (a: Action, b: Action) => boolean,
		combiner: (a: T, b: T) => T,
		shouldSwap?: (a: Action, b: Action) => boolean,
	): readonly Action[] {
		const result: Action[] = [];
		let previousAction: Action;
		// // console.log('considering actions to merge', actions);
		for (let i = 0; i < actions.length; i++) {
			const currentAction = actions[i];
			// // console.log(
			// 	'reduce 150',
			// 	previousAction && previousAction.entities.get(150) && previousAction.entities.get(150).tags.toJS(),
			// 	currentAction && currentAction.entities.get(150) && currentAction.entities.get(150).tags.toJS(),
			// 	previousAction,
			// 	currentAction,
			// );
			if (shouldMerge(previousAction, currentAction)) {
				// // console.log('merging');
				const index = result.indexOf(previousAction);
				previousAction = combiner(previousAction as T, currentAction as T);
				// // console.log(
				// 	'new previous action',
				// 	previousAction.entities.get(150) && previousAction.entities.get(150).tags.toJS(),
				// 	previousAction,
				// );
				result[index] = previousAction;
			} else if (shouldSwap && shouldSwap(previousAction, currentAction)) {
				// // console.log('swapping', previousAction, currentAction);
				const index = result.indexOf(previousAction);
				const previousEntities = previousAction.entities;
				const previousIndex = previousAction.index;
				const previousTs = previousAction.timestamp;
				const currentEntities = currentAction.entities;
				const currentIndex = currentAction.index;
				const currentTs = currentAction.timestamp;
				result[index] = Object.assign(currentAction, {
					entities: previousEntities,
					index: previousIndex,
					timestamp: previousTs,
				} as Action);
				result[index + 1] = Object.assign(previousAction, {
					entities: currentEntities,
					index: currentIndex,
					timestamp: currentTs,
				} as Action);
			} else {
				// // console.log('doing nothing');
				previousAction = currentAction;
				result.push(currentAction);
			}
		}
		// // console.log(
		// 	'finished',
		// 	result[result.length - 1].entities.get(150) && result[result.length - 1].entities.get(150).tags.toJS(),
		// );
		return result;
	}
}
