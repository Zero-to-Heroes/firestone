import { BlockType, CardType, GameTag, Zone } from '@firestone-hs/reference-data';
import { Map } from 'immutable';
import { Action } from '../../models/action/action';
import { SummonAction } from '../../models/action/summon-action';
import { Entity } from '../../models/game/entity';
import { ActionHistoryItem } from '../../models/history/action-history-item';
import { HistoryItem } from '../../models/history/history-item';
import { FullEntityHistoryItem, ShowEntityHistoryItem } from '../../models/models';
import { EntityDefinition } from '../../models/parser/entity-definition';
import { AllCardsService } from '../all-cards.service';
import { ActionHelper } from './action-helper';
import { Parser } from './parser';

export class SummonsParser implements Parser {
	constructor(private allCards: AllCardsService) {}

	public applies(item: HistoryItem): boolean {
		return item instanceof ShowEntityHistoryItem || item instanceof FullEntityHistoryItem;
	}

	public parse(
		item: ShowEntityHistoryItem | FullEntityHistoryItem,
		currentTurn: number,
		entitiesBeforeAction: Map<number, Entity>,
		history: readonly HistoryItem[],
	): Action[] {
		const parentActionId = item.entityDefintion.parentIndex;
		const parentAction = history.find((historyItem) => historyItem.index === parentActionId);
		// We make sure the death occurs during a DEATH phase, so that we don't count the
		// "dead spells", ie spells that have been used and go to the graveyard
		if (!item.entityDefintion.parentIndex || !parentAction || !(parentAction instanceof ActionHistoryItem)) {
			return;
		}
		if (
			parseInt(parentAction.node.attributes.type) !== BlockType.TRIGGER &&
			parseInt(parentAction.node.attributes.type) !== BlockType.POWER
		) {
			return;
		}

		let entities: readonly EntityDefinition[] = [item.entityDefintion];
		if (!entities) {
			return;
		}

		return entities
			.filter((entity) => entity.tags[GameTag[GameTag.ZONE]] === Zone.PLAY)
			.filter((entity) => entity.tags[GameTag[GameTag.CARDTYPE]] === CardType.MINION)
			.map((entity) => {
				return SummonAction.create(
					{
						timestamp: item.timestamp,
						index: entity.index,
						entityIds: [entity.id] as readonly number[],
						originId: parseInt(parentAction.node.attributes.entity),
					} as SummonAction,
					this.allCards,
				);
			});
	}

	public reduce(actions: readonly Action[]): readonly Action[] {
		return ActionHelper.combineActions<SummonAction>(
			actions,
			(previous, current) => this.shouldMergeActions(previous, current),
			(previous, current) => this.mergeActions(previous, current),
		);
	}

	private shouldMergeActions(previousAction: Action, currentAction: Action): boolean {
		if (!(previousAction instanceof SummonAction) || !(currentAction instanceof SummonAction)) {
			return false;
		}
		if ((previousAction as SummonAction).originId !== (currentAction as SummonAction).originId) {
			return false;
		}
		return true;
	}

	private mergeActions(previousAction: SummonAction, currentAction: SummonAction): SummonAction {
		return SummonAction.create(
			{
				timestamp: previousAction.timestamp,
				index: previousAction.index,
				entities: currentAction.entities,
				originId: currentAction.originId,
				entityIds: [...(previousAction.entityIds ?? []), ...(currentAction.entityIds ?? [])].filter(
					(id, index, self) => self.indexOf(id) === index,
				) as readonly number[],
			} as SummonAction,
			this.allCards,
		);
	}
}
