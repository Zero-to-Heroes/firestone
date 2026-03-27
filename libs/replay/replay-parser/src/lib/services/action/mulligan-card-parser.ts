import { GameTag, Zone } from '@firestone-hs/reference-data';
import { Map } from 'immutable';
import { Action } from '../../models/action/action';
import { MulliganCardAction } from '../../models/action/mulligan-card-action';
import { Entity } from '../../models/game/entity';
import { ActionHistoryItem } from '../../models/history/action-history-item';
import { HideEntityHistoryItem } from '../../models/history/hide-entity-history-item';
import { HistoryItem } from '../../models/history/history-item';
import { TagChangeHistoryItem } from '../../models/models';
import { AllCardsService } from '../all-cards.service';
import { ActionHelper } from './action-helper';
import { Parser } from './parser';

export class MulliganCardParser implements Parser {
	constructor(private allCards: AllCardsService) {}

	// Don't use the root Block here, as it can be split off in another processing chunk,
	// which means the children TagChange and HideEntity are not set yet
	// While we should generally avoid assuming children presence, turn delimitation
	// should be clear-cut enough that this should be an issue only mulligan
	// Otherwise, check that all parsers that depend on ActionHistoryItem don't use
	// their children, but only use the action itself
	public applies(item: HistoryItem): boolean {
		return (
			(item instanceof TagChangeHistoryItem && item.tag.tag === GameTag.ZONE && item.tag.value === Zone.DECK) ||
			item instanceof HideEntityHistoryItem
		);
		// return item instanceof ActionHistoryItem;
	}

	public parse(
		item: ActionHistoryItem,
		currentTurn: number,
		entitiesBeforeAction: Map<number, Entity>,
		history: readonly HistoryItem[],
	): Action[] {
		if (currentTurn > 0) {
			return;
		}

		// if (item instanceof HideEntityHistoryItem) {
		// 	const owner = ActionHelper.getOwner(entitiesBeforeAction, item.entity);
		// 	// console.log('considergin', owner, item);
		// 	if (owner instanceof PlayerEntity) {
		// 		return [
		// 			MulliganCardAction.create(
		// 				{
		// 					timestamp: item.timestamp,
		// 					index: item.index,
		// 					playerMulligan: [item.entity],
		// 				},
		// 				this.allCards,
		// 			),
		// 		];
		// 	}
		// }
		// This works because we only work at turn 0
		if (item instanceof TagChangeHistoryItem) {
			return [
				MulliganCardAction.create(
					{
						timestamp: item.timestamp,
						index: item.index,
						opponentMulligan: [item.tag.entity],
					},
					this.allCards,
				),
			];
		}
		// Adding the cards mulliganed by the player
		// if (
		// 	parseInt(item.node.attributes.type) === BlockType.TRIGGER &&
		// 	item.node.hideEntities &&
		// 	item.node.hideEntities.length > 0 &&
		// 	GameHepler.isPlayerEntity(parseInt(item.node.attributes.entity), entitiesBeforeAction)
		// ) {
		// 	// console.log('built mulligan action');
		// 	const result = [
		// 		MulliganCardAction.create(
		// 			{
		// 				timestamp: item.timestamp,
		// 				index: item.index,
		// 				playerMulligan: item.node.hideEntities,
		// 			},
		// 			this.allCards,
		// 		),
		// 	];
		// 	return result;
		// }
		// if (
		// 	parseInt(item.node.attributes.type) === BlockType.TRIGGER &&
		// 	GameHepler.isPlayerEntity(parseInt(item.node.attributes.entity), entitiesBeforeAction) &&
		// 	item.node.tags &&
		// 	item.node.tags.length > 0
		// ) {
		// 	const relevantTags = item.node.tags
		// 		.filter(tag => tag.tag === GameTag.ZONE)
		// 		.filter(tag => tag.value === Zone.DECK);
		// 	if (relevantTags && relevantTags.length > 0) {
		// 		const result = relevantTags.map(tag =>
		// 			MulliganCardAction.create(
		// 				{
		// 					timestamp: item.timestamp,
		// 					index: item.index,
		// 					opponentMulligan: [tag.entity],
		// 				},
		// 				this.allCards,
		// 			),
		// 		);
		// 		return result;
		// 	}
		// }
		return null;
	}

	public reduce(actions: readonly Action[]): readonly Action[] {
		return ActionHelper.combineActions<MulliganCardAction>(
			actions,
			(previous, current) => previous instanceof MulliganCardAction && current instanceof MulliganCardAction,
			(previous, current) => this.mergeActions(previous, current),
		);
	}

	private mergeActions(previousAction: MulliganCardAction, currentAction: MulliganCardAction): MulliganCardAction {
		return MulliganCardAction.create(
			{
				timestamp: previousAction.timestamp,
				index: previousAction.index,
				entities: currentAction.entities,
				playerMulligan: [...(previousAction.playerMulligan ?? []), ...(currentAction.playerMulligan ?? [])],
				opponentMulligan: [
					...(previousAction.opponentMulligan ?? []),
					...(currentAction.opponentMulligan ?? []),
				],
			},
			this.allCards,
		);
	}
}
