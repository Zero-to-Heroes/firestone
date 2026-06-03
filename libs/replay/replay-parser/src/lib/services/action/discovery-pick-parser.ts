import { ChoiceType } from '@firestone-hs/reference-data';
import { Map } from 'immutable';
import { Action } from '../../models/action/action';
import { ActionButtonUsedAction } from '../../models/action/action-button-used-action';
import { DiscoverAction } from '../../models/action/discover-action';
import { DiscoveryPickAction } from '../../models/action/discovery-pick-action';
import { StartTurnAction } from '../../models/action/start-turn-action';
import { Entity } from '../../models/game/entity';
import { ChoicesHistoryItem } from '../../models/history/choices-history-item';
import { ChosenEntityHistoryItem } from '../../models/history/chosen-entities-history-item';
import { HistoryItem } from '../../models/history/history-item';
import { Choices } from '../../models/parser/choices';
import { AllCardsService } from '../all-cards.service';
import { ActionHelper } from './action-helper';
import { DiscoverParser } from './discover-parser';
import { Parser } from './parser';

export class DiscoveryPickParser implements Parser {
	constructor(private allCards: AllCardsService) {}

	public applies(item: HistoryItem): boolean {
		return item instanceof ChosenEntityHistoryItem && item.tag.cards && item.tag.cards.length === 1;
	}

	public parse(
		item: ChosenEntityHistoryItem,
		currentTurn: number,
		entitiesBeforeAction: Map<number, Entity>,
		history: readonly HistoryItem[],
	): Action[] {
		const precedingChoices = this.findPrecedingGeneralChoices(history, item);
		return [
			DiscoveryPickAction.create(
				{
					timestamp: item.timestamp,
					index: item.index,
					owner: item.tag.playerID,
					choice: item.tag.cards[0],
					discoverOriginId: precedingChoices?.choices.source,
					discoverChoices: precedingChoices?.choices.cards,
				},
				this.allCards,
			),
		];
	}

	public reduce(actions: readonly Action[]): readonly Action[] {
		return ActionHelper.combineActions<Action>(
			actions,
			(previous, current) => this.shouldMergeActions(previous, current),
			(previous, current) => this.mergeActions(previous, current),
		);
	}

	private shouldMergeActions(previousAction: Action, currentAction: Action): boolean {
		if (previousAction instanceof DiscoverAction && currentAction instanceof DiscoveryPickAction) {
			return true;
		}
		if (currentAction instanceof DiscoveryPickAction) {
			if (previousAction instanceof ActionButtonUsedAction) {
				return true;
			}
			if (this.canSynthesizeDiscover(currentAction)) {
				return true;
			}
			if (!(previousAction instanceof StartTurnAction)) {
				console.warn('removing discovery pick action', previousAction?.textRaw);
			}
			return true;
		}
		return false;
	}

	private mergeActions(previousAction: Action, currentAction: Action): Action {
		if (!(currentAction instanceof DiscoveryPickAction)) {
			return previousAction;
		}
		if (previousAction instanceof DiscoverAction) {
			return previousAction.updateAction<DiscoverAction>({
				chosen: [currentAction.choice] as readonly number[],
			} as DiscoverAction);
		}
		if (this.canSynthesizeDiscover(currentAction)) {
			return this.synthesizeDiscoverAction(previousAction, currentAction);
		}
		return previousAction;
	}

	private canSynthesizeDiscover(pick: DiscoveryPickAction): boolean {
		return !!pick.discoverChoices?.length && pick.discoverOriginId != null;
	}

	private synthesizeDiscoverAction(previousAction: Action, pick: DiscoveryPickAction): DiscoverAction {
		const entities = pick.entities ?? previousAction.entities;
		const choices: Choices = {
			entity: pick.discoverOriginId,
			min: 1,
			max: 1,
			playerID: pick.owner,
			source: pick.discoverOriginId,
			type: ChoiceType.GENERAL,
			ts: pick.timestamp,
			index: pick.index,
			cards: [...pick.discoverChoices],
		};
		const choicesItem = new ChoicesHistoryItem(choices, pick.timestamp, pick.index);
		const discover = DiscoverAction.create(
			{
				timestamp: pick.timestamp,
				index: pick.index,
				originId: pick.discoverOriginId,
				ownerId: pick.owner,
				choices: pick.discoverChoices,
				chosen: [pick.choice] as readonly number[],
				entities,
			} as DiscoverAction,
			this.allCards,
		);
		return new DiscoverParser(this.allCards).enrichDiscoverEntities(discover, choicesItem, entities ?? Map(), []);
	}

	private findPrecedingGeneralChoices(
		history: readonly HistoryItem[],
		pickItem: ChosenEntityHistoryItem,
	): ChoicesHistoryItem | undefined {
		const pickIndex = history.indexOf(pickItem);
		if (pickIndex < 0) {
			return undefined;
		}
		for (let i = pickIndex - 1; i >= 0; i--) {
			const item = history[i];
			if (item instanceof ChoicesHistoryItem && item.choices.type === ChoiceType.GENERAL) {
				return item;
			}
		}
		return undefined;
	}
}
