import { CardType, GameTag } from '@firestone-hs/reference-data';
import { Map } from 'immutable';
import { Action } from '../../../models/action/action';
import { BaconBattleOverAction } from '../../../models/action/battlegrounds/bacon-battle-over-action';
import { Entity } from '../../../models/game/entity';
import { HistoryItem } from '../../../models/history/history-item';
import { TagChangeHistoryItem } from '../../../models/history/tag-change-history-item';
import { GameHepler } from '../../../models/models';
import { AllCardsService } from '../../all-cards.service';
import { ActionHelper } from '../action-helper';
import { Parser } from '../parser';

export class BaconBattleOverParser implements Parser {
	constructor(private readonly allCards: AllCardsService) {}

	public applies(item: HistoryItem): boolean {
		return item instanceof TagChangeHistoryItem && item.tag.tag === GameTag.ATK;
	}

	public parse(
		item: TagChangeHistoryItem,
		currentTurn: number,
		entitiesBeforeAction: Map<number, Entity>,
		history: readonly HistoryItem[],
	): Action[] {
		// TODO: add checks that we are indeed in a Battlegrounds game?
		// // console.log('visual', item.tag.value, item);
		if (GameHepler.getGameEntity(entitiesBeforeAction).getTag(GameTag.TECH_LEVEL_MANA_GEM) !== 1) {
			return [];
		}
		const entity = entitiesBeforeAction.get(item.tag.entity);
		if (!entity || entity.getCardType() !== CardType.HERO) {
			return [];
		}
		if (item.tag.value === 0) {
			return [];
		}
		return [
			BaconBattleOverAction.create(
				{
					timestamp: item.timestamp,
					index: item.index,
				} as BaconBattleOverAction,
				this.allCards,
			),
		];
	}

	public reduce(actions: readonly Action[]): readonly Action[] {
		return ActionHelper.combineActions<BaconBattleOverAction>(
			actions,
			(previous, current) => this.shouldMergeActions(previous, current),
			(previous, current) => this.mergeActions(previous, current),
		);
	}

	private shouldMergeActions(previous: Action, current: Action): boolean {
		return previous instanceof BaconBattleOverAction && current instanceof BaconBattleOverAction;
	}

	private mergeActions(
		previousAction: BaconBattleOverAction,
		currentAction: BaconBattleOverAction,
	): BaconBattleOverAction {
		// // console.log(
		// 	'reduce 150',
		// 	previousAction.entities.get(150) && previousAction.entities.get(150).tags.toJS(),
		// 	previousAction,
		// );
		return previousAction;
	}
}
