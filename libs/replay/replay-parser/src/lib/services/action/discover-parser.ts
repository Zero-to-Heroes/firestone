import { ChoiceType } from '@firestone-hs/reference-data';
import { Map } from 'immutable';
import { Action } from '../../models/action/action';
import { DiscoverAction } from '../../models/action/discover-action';
import { Entity } from '../../models/game/entity';
import { ChoicesHistoryItem } from '../../models/history/choices-history-item';
import { FullEntityHistoryItem } from '../../models/history/full-entity-history-item';
import { HistoryItem } from '../../models/history/history-item';
import { ShowEntityHistoryItem } from '../../models/history/show-entity-history-item';
import { EntityDefinition } from '../../models/parser/entity-definition';
import { AllCardsService } from '../all-cards.service';
import { Parser } from './parser';

export class DiscoverParser implements Parser {
	constructor(private allCards: AllCardsService) {}

	public applies(item: HistoryItem): boolean {
		return item instanceof ChoicesHistoryItem;
	}

	public parse(
		item: ChoicesHistoryItem,
		currentTurn: number,
		entitiesBeforeAction: Map<number, Entity>,
		history: readonly HistoryItem[],
	): Action[] {
		if (item.choices.type !== ChoiceType.GENERAL) {
			return [];
		}
		const action = DiscoverAction.create(
			{
				timestamp: item.timestamp,
				index: item.index,
				originId: item.choices.source,
				ownerId: item.choices.playerID,
				choices: item.choices.cards as readonly number[],
			} as DiscoverAction,
			this.allCards,
		);
		return [this.enrichDiscoverEntities(action, item, entitiesBeforeAction, history)];
	}

	public reduce(actions: readonly Action[]): readonly Action[] {
		return actions;
	}

	public enrichDiscoverEntities(
		action: DiscoverAction,
		item: ChoicesHistoryItem,
		entities: Map<number, Entity>,
		history: readonly HistoryItem[],
	): DiscoverAction {
		let snapshot = entities;
		for (const choiceId of item.choices.cards ?? []) {
			const existing = snapshot.get(choiceId);
			if (existing?.cardID) {
				continue;
			}
			const fromHistory = this.entityFromHistory(choiceId, history);
			if (fromHistory) {
				snapshot = snapshot.set(choiceId, fromHistory);
			} else if (existing) {
				snapshot = snapshot.set(choiceId, existing);
			}
		}
		return action.update(snapshot);
	}

	private entityFromHistory(entityId: number, history: readonly HistoryItem[]): Entity | undefined {
		for (const item of history) {
			if (item instanceof FullEntityHistoryItem && item.entityDefintion.id === entityId) {
				return this.entityFromDefinition(item.entityDefintion);
			}
			if (item instanceof ShowEntityHistoryItem && item.entityDefintion.id === entityId) {
				return this.entityFromDefinition(item.entityDefintion);
			}
		}
		return undefined;
	}

	private entityFromDefinition(definition: EntityDefinition): Entity {
		return Entity.create({ id: definition.id } as Entity, definition);
	}
}
