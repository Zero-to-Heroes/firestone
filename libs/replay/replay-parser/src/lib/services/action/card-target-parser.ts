import { BlockType, CardIds } from '@firestone-hs/reference-data';
import { Map } from 'immutable';
import { Action } from '../../models/action/action';
import { AttachingEnchantmentAction } from '../../models/action/attaching-enchantment-action';
import { CardTargetAction } from '../../models/action/card-target-action';
import { TradeAction } from '../../models/action/trade-action';
import { Entity } from '../../models/game/entity';
import { ActionHistoryItem } from '../../models/history/action-history-item';
import { HistoryItem } from '../../models/history/history-item';
import { ActionButtonUsedAction, CardPlayedFromHandAction } from '../../models/models';
import { deepEqual } from '../../utils';
import { AllCardsService } from '../all-cards.service';
import { ActionHelper } from './action-helper';
import { Parser } from './parser';

export class CardTargetParser implements Parser {
	constructor(private allCards: AllCardsService) {}

	public applies(item: HistoryItem): boolean {
		return item instanceof ActionHistoryItem;
	}

	public parse(
		item: ActionHistoryItem,
		currentTurn: number,
		entitiesBeforeAction: Map<number, Entity>,
		history: readonly HistoryItem[],
	): Action[] {
		if (
			parseInt(item.node.attributes.type) !== BlockType.POWER &&
			parseInt(item.node.attributes.type) !== BlockType.TRIGGER
		) {
			return;
		}
		const originId = parseInt(item.node.attributes.entity);
		const entity = entitiesBeforeAction.get(originId);
		if (!entity) {
			return [];
		}
		// Remove the dummy effects
		if (
			[
				'DALA_744d',
				CardIds.BloodGemNoImpactToken,
				CardIds.BloodGemNoImpactFromTeammateDntToken_BGDUO20_GEM_No_Impact,
			].includes(entity.cardID)
		) {
			return [];
		}
		const targetId = parseInt(item.node.attributes.target);
		if (targetId > 0) {
			return [
				CardTargetAction.create(
					{
						timestamp: item.timestamp,
						index: item.index,
						originId,
						targetIds: [targetId],
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
		if (previousAction instanceof CardTargetAction && currentAction instanceof CardTargetAction) {
			if ((previousAction as CardTargetAction).originId === (currentAction as CardTargetAction).originId) {
				return true;
			}
		}
		if (previousAction instanceof ActionButtonUsedAction) {
			return previousAction.entityId === currentAction.originId;
		}
		if (previousAction instanceof TradeAction) {
			return previousAction.originId === currentAction.originId;
		}
		if (previousAction instanceof AttachingEnchantmentAction && currentAction instanceof CardTargetAction) {
			if (
				previousAction.originId === currentAction.originId &&
				deepEqual(previousAction.targetIds ?? [], currentAction.targetIds ?? [])
			) {
				return true;
			}
		}
		if (previousAction instanceof CardPlayedFromHandAction && currentAction instanceof CardTargetAction) {
			if (previousAction.entityId === currentAction.originId) {
				return true;
			}
		}
		return false;
	}

	private mergeActions(previousAction: Action, currentAction: Action): Action {
		if (currentAction instanceof AttachingEnchantmentAction) {
			console.warn(
				'incorrect AttachingEnchantmentAction as current action for card-target-parser',
				currentAction,
			);
			return;
		}
		if (previousAction instanceof ActionButtonUsedAction) {
			// // console.log('merging actions', previousAction, currentAction);
			return ActionHelper.mergeIntoFirstAction(previousAction, currentAction, {
				entities: currentAction.entities,
				entityId: previousAction.entityId,
				originId: currentAction.originId,
				targetIds: [...(previousAction.targetIds ?? []), ...(currentAction.targetIds ?? [])].filter(
					(id, index, self) => self.indexOf(id) === index,
				) as readonly number[],
			} as ActionButtonUsedAction);
		} else if (previousAction instanceof CardPlayedFromHandAction) {
			// // console.log('merging actions', previousAction, currentAction);
			return ActionHelper.mergeIntoFirstAction(previousAction, currentAction, {
				entities: currentAction.entities,
				entityId: previousAction.entityId,
				originId: currentAction.originId,
				targetIds: [...(previousAction.targetIds ?? []), ...(currentAction.targetIds ?? [])].filter(
					(id, index, self) => self.indexOf(id) === index,
				) as readonly number[],
			} as CardPlayedFromHandAction);
		} else if (previousAction instanceof CardTargetAction) {
			return CardTargetAction.create(
				{
					timestamp: previousAction.timestamp,
					index: previousAction.index,
					entities: currentAction.entities,
					originId: currentAction.originId,
					targetIds: [...(previousAction.targetIds ?? []), ...(currentAction.targetIds ?? [])].filter(
						(id, index, self) => self.indexOf(id) === index,
					) as readonly number[],
				},
				this.allCards,
			);
		} else if (previousAction instanceof AttachingEnchantmentAction || previousAction instanceof TradeAction) {
			return previousAction;
		}
	}
}
