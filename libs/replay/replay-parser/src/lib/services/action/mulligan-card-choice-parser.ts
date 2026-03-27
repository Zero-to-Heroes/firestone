import { GameTag, Zone } from '@firestone-hs/reference-data';
import { Map } from 'immutable';
import { Action } from '../../models/action/action';
import { MulliganCardAction } from '../../models/action/mulligan-card-action';
import { MulliganCardChoiceAction } from '../../models/action/mulligan-card-choice-action';
import { StartTurnAction } from '../../models/action/start-turn-action';
import { Entity } from '../../models/game/entity';
import { PlayerEntity } from '../../models/game/player-entity';
import { ChosenEntityHistoryItem } from '../../models/history/chosen-entities-history-item';
import { HistoryItem } from '../../models/history/history-item';
import { AllCardsService } from '../all-cards.service';
import { ActionHelper } from './action-helper';
import { Parser } from './parser';

export class MulliganCardChoiceParser implements Parser {
	constructor(private allCards: AllCardsService) {}

	public applies(item: HistoryItem): boolean {
		return item instanceof ChosenEntityHistoryItem;
	}

	public parse(
		item: ChosenEntityHistoryItem,
		currentTurn: number,
		entitiesBeforeAction: Map<number, Entity>,
		history: readonly HistoryItem[],
		players: readonly PlayerEntity[],
	): Action[] {
		if (currentTurn > 0) {
			return;
		}

		const keptCards = item.tag.cards;
		// Here "playerID" actually refers to the player entity ID (and not the playerID)
		const playerHand = this.getHandEntityIds(entitiesBeforeAction, item.tag.playerID);
		const mulligan = playerHand.filter(entityId => keptCards.indexOf(entityId) === -1);
		// // console.log('considering choice', item, players, playerHand, mulligan);
		if (item.tag.playerID === players[0].id) {
			return [
				MulliganCardChoiceAction.create(
					{
						timestamp: item.timestamp,
						index: item.index,
						playerMulligan: mulligan,
					},
					this.allCards,
				),
			];
		} else if (item.tag.playerID === players[1].id) {
			return [
				MulliganCardChoiceAction.create(
					{
						timestamp: item.timestamp,
						index: item.index,
						opponentMulligan: mulligan,
					},
					this.allCards,
				),
			];
		} else {
			console.warn('Invalid mulligan choice', item, players);
		}
		return null;
	}

	public reduce(actions: readonly Action[]): readonly Action[] {
		return ActionHelper.combineActions<MulliganCardChoiceAction | StartTurnAction>(
			actions,
			(previous, current) =>
				(previous instanceof MulliganCardChoiceAction && current instanceof MulliganCardChoiceAction) ||
				(previous instanceof StartTurnAction && current instanceof MulliganCardChoiceAction),
			(previous, current) => this.mergeActions(previous, current),
			(previous, current) =>
				previous instanceof MulliganCardAction && current instanceof MulliganCardChoiceAction,
		);
	}

	private mergeActions(
		previousAction: MulliganCardChoiceAction | StartTurnAction,
		currentAction: MulliganCardChoiceAction | StartTurnAction,
	): MulliganCardChoiceAction | StartTurnAction {
		if (currentAction instanceof StartTurnAction) {
			console.warn('Invalid mulligan action merge', previousAction, currentAction);
			return previousAction;
		}
		if (previousAction instanceof MulliganCardChoiceAction) {
			// // console.log('merging into previous mulligan action', previousAction, currentAction);
			return MulliganCardChoiceAction.create(
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
		} else {
			// // console.log('merging into previous turn action', previousAction, currentAction);
			return StartTurnAction.create(
				{
					turn: previousAction.turn,
					entities: previousAction.entities,
					crossedEntities: [
						...(previousAction.crossedEntities ?? []),
						...(currentAction.playerMulligan ?? []),
						...(currentAction.opponentMulligan ?? []),
					],
				},
				this.allCards,
			);
		}
	}

	private getHandEntityIds(entities: Map<number, Entity>, playerEntityId: number): readonly number[] {
		const playerEntity = ActionHelper.getOwner(entities, playerEntityId);
		return entities
			.valueSeq()
			.toArray()
			.filter(entity => entity.getTag(GameTag.CONTROLLER) === playerEntity.playerId)
			.filter(entity => entity.getTag(GameTag.ZONE) === Zone.HAND)
			.map(entity => entity.id);
	}
}
