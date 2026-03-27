import { CardType, GameTag, Zone } from '@firestone-hs/reference-data';
import { Map } from 'immutable';
import { Action } from '../../models/action/action';
import { AttackAction } from '../../models/action/attack-action';
import { DamageAction } from '../../models/action/damage-action';
import { HealingAction } from '../../models/action/healing-action';
import { PowerTargetAction } from '../../models/action/power-target-action';
import { Entity } from '../../models/game/entity';
import { HistoryItem } from '../../models/history/history-item';
import { TagChangeHistoryItem } from '../../models/history/tag-change-history-item';
import {
	ActionButtonUsedAction,
	CardPlayedFromHandAction,
	FullEntityHistoryItem,
	GameEntity,
	GameHepler,
} from '../../models/models';
import { AllCardsService } from '../all-cards.service';
import { ActionHelper } from './action-helper';
import { Parser } from './parser';

export class DamageParser implements Parser {
	constructor(private allCards: AllCardsService) {}

	public applies(item: HistoryItem): boolean {
		return item instanceof TagChangeHistoryItem && item.tag.tag === GameTag.DAMAGE;
	}

	public parse(
		item: TagChangeHistoryItem,
		currentTurn: number,
		entitiesBeforeAction: Map<number, Entity>,
		history: readonly HistoryItem[],
	): Action[] {
		const entity = entitiesBeforeAction.get(item.tag.entity);
		// Damage is reset to 0 after an entity dies, and we don't want to show this
		if (!entity || entity.getTag(GameTag.ZONE) !== Zone.PLAY) {
			return [];
		}
		// Ignore damage to locations
		if (entity.getTag(GameTag.CARDTYPE) === CardType?.LOCATION) {
			return [];
		}

		const previousDamageTag = entity.getTag(GameTag.DAMAGE);
		const previousDamage = !previousDamageTag || previousDamageTag === -1 ? 0 : previousDamageTag;
		const damageTaken = item.tag.value - previousDamage;
		// If we are in battlegrounds, things are a bit trickier. We don't want to show the
		// damage taken by the opponent hero at the start of a battle
		const gameEntity: GameEntity = GameHepler.getGameEntity(entitiesBeforeAction) as GameEntity;
		if (gameEntity.isBattlegrounds()) {
			const historyIndex = history.indexOf(item);
			if (historyIndex > 0) {
				const previous = history[historyIndex - 1];
				if (
					previous instanceof FullEntityHistoryItem &&
					previous.entityDefintion.cardID &&
					previous.entityDefintion.cardID.indexOf('TB_BaconShop_HP_') !== -1
				) {
					return [];
				}
			}
		}

		if (entity.id === 641) {
			// console.log('adding damage action', item, damageTaken, previousDamageTag, entity.tags.toJS());
		}
		if (damageTaken > 0) {
			return [
				DamageAction.create(
					{
						timestamp: item.timestamp,
						index: item.index,
						damages: Map.of(item.tag.entity, damageTaken),
					} as Action,
					this.allCards,
				),
			];
		} else if (damageTaken < 0) {
			return [
				HealingAction.create(
					{
						timestamp: item.timestamp,
						index: item.index,
						damages: Map.of(item.tag.entity, damageTaken),
					},
					this.allCards,
				),
			];
		}
		return [];
	}

	public reduce(actions: readonly Action[]): readonly Action[] {
		return ActionHelper.combineActions<Action>(
			actions,
			(previous, current) => this.shouldMergeActions(previous, current),
			(previous, current) => this.mergeActions(previous, current),
		);
	}

	private shouldMergeActions(previousAction: Action, currentAction: Action): boolean {
		if (currentAction instanceof DamageAction) {
			return (
				previousAction instanceof DamageAction || // Merge all damages into a single action
				previousAction instanceof AttackAction || // Add damage to the attack causing the damage
				previousAction instanceof PowerTargetAction || // Add damages to the power causing the damage
				previousAction instanceof ActionButtonUsedAction ||
				previousAction instanceof CardPlayedFromHandAction // It's usually teh same "action"
			);
		} else if (currentAction instanceof HealingAction) {
			return (
				previousAction instanceof HealingAction || // Merge all heals into a single action
				previousAction instanceof AttackAction || // Add heal to the attack causing the heal
				previousAction instanceof PowerTargetAction || // Add heals to the power causing the heal
				previousAction instanceof ActionButtonUsedAction || // Add heals to the power causing the heal
				previousAction instanceof CardPlayedFromHandAction // It's usually teh same "action"
			);
		}
	}

	private mergeActions(previousAction: Action, currentAction: Action): Action {
		return this.mergeDamageIntoAction(previousAction, currentAction as DamageAction);
	}

	private mergeDamageIntoAction(previousAction: Action, currentAction: DamageAction): Action {
		const result = ActionHelper.mergeIntoFirstAction(previousAction, currentAction, {
			index: currentAction.index,
			entities: currentAction.entities,
		} as Action);
		return result;
	}
}
