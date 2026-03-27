import { GameTag, Zone } from '@firestone-hs/reference-data';
import { Map } from 'immutable';
import { Action } from '../../../models/action/action';
import { BaconOpponentRevealedAction } from '../../../models/action/battlegrounds/bacon-opponent-revealed-action';
import { Entity } from '../../../models/game/entity';
import { PlayerEntity } from '../../../models/game/player-entity';
import { HistoryItem } from '../../../models/history/history-item';
import { CardPlayedFromHandAction, FullEntityHistoryItem } from '../../../models/models';
import { AllCardsService } from '../../all-cards.service';
import { ActionHelper } from '../action-helper';
import { Parser } from '../parser';

export class BaconOpponentRevealedParser implements Parser {
	constructor(private allCards: AllCardsService) {}

	public applies(item: HistoryItem): boolean {
		return (
			item instanceof FullEntityHistoryItem &&
			item.entityDefintion.tags &&
			item.entityDefintion.tags[GameTag[GameTag.ZONE]] === Zone.SETASIDE &&
			item.entityDefintion.tags[GameTag[GameTag.BACON_HERO_CAN_BE_DRAFTED]] === 1
		);
	}

	public parse(
		item: FullEntityHistoryItem,
		currentTurn: number,
		entitiesBeforeAction: Map<number, Entity>,
		history: readonly HistoryItem[],
		players: readonly PlayerEntity[],
	): Action[] {
		if (currentTurn > 0) {
			return;
		}

		// // console.log('adding hero to the list of opponents', item);
		return [
			BaconOpponentRevealedAction.create(
				{
					timestamp: item.timestamp,
					index: item.index,
					opponentIds: [item.entityDefintion.id] as readonly number[],
				} as BaconOpponentRevealedAction,
				this.allCards,
			),
		];
	}

	public reduce(actions: readonly Action[]): readonly Action[] {
		return ActionHelper.combineActions<BaconOpponentRevealedAction>(
			actions,
			(previous, current) =>
				previous instanceof BaconOpponentRevealedAction && current instanceof BaconOpponentRevealedAction,
			(previous, current) => this.mergeActions(previous, current),
			// When player hero is revealed
			(previous, current) =>
				previous instanceof CardPlayedFromHandAction && current instanceof BaconOpponentRevealedAction,
		);
	}

	private mergeActions(
		previousAction: BaconOpponentRevealedAction,
		currentAction: BaconOpponentRevealedAction,
	): BaconOpponentRevealedAction {
		const result = BaconOpponentRevealedAction.create(
			{
				entities: currentAction.entities,
				timestamp: previousAction.timestamp,
				index: previousAction.index,
				opponentIds: [...(previousAction.opponentIds ?? []), ...(currentAction.opponentIds ?? [])] as readonly number[],
			} as BaconOpponentRevealedAction,
			this.allCards,
		);
		// // console.log(
		// 	'reduce 150 bacoin',
		// 	previousAction.entities.get(150) && previousAction.entities.get(150).tags.toJS(),
		// 	result.entities.get(150) && result.entities.get(150).tags.toJS(),
		// 	previousAction,
		// );
		return result;
	}
}
