import { BlockType, CardType, GameTag, Zone } from '@firestone-hs/reference-data';
import { Map } from 'immutable';
import { Action } from '../../models/action/action';
import { CardPlayedFromHandAction } from '../../models/action/card-played-from-hand-action';
import { Entity } from '../../models/game/entity';
import { ActionHistoryItem } from '../../models/history/action-history-item';
import { HistoryItem } from '../../models/history/history-item';
import { TagChangeHistoryItem } from '../../models/history/tag-change-history-item';
import { AllCardsService } from '../all-cards.service';
import { ActionHelper } from './action-helper';
import { Parser } from './parser';

export class CardPlayedFromHandParser implements Parser {
	constructor(private allCards: AllCardsService) {}

	public applies(item: HistoryItem): boolean {
		return item instanceof ActionHistoryItem || item instanceof TagChangeHistoryItem;
	}

	public parse(
		item: ActionHistoryItem | TagChangeHistoryItem,
		currentTurn: number,
		entitiesBeforeAction: Map<number, Entity>,
		history: readonly HistoryItem[],
	): Action[] {
		if (item instanceof ActionHistoryItem && parseInt(item.node.attributes.type) === BlockType.PLAY) {
			// The case of a ShowEntity (or FullEntity) when we didn't previously know the
			// card. In that case, a ShowEntity (or FullEntity) element is created that contains
			// the tag with the proper zone
			// Use entities when playing Eviscerate at t6o at
			// http://www.zerotoheroes.com/r/hearthstone/572de12ee4b0d4231295c49e/an-arena-game-going-5-0
			const result = [];
			if (item.node.showEntities) {
				for (const showEntity of item.node.showEntities) {
					if (
						showEntity.tags[GameTag[GameTag.ZONE]] === Zone.PLAY &&
						showEntity.tags[GameTag[GameTag.CARDTYPE]] !== CardType.ENCHANTMENT
					) {
						result.push(
							CardPlayedFromHandAction.create(
								{
									timestamp: showEntity.attributes.ts,
									index: showEntity.index,
									entityId: showEntity.id,
								},
								this.allCards,
							),
						);
					}
				}
			}
			return result;
		} else if (item instanceof TagChangeHistoryItem) {
			// The case of a ShowEntity command when the card was already known - basically
			// when we play our own card. In that case, the tags are already known, and
			// tag changes are the only things we care about
			if (item.tag.tag === GameTag.ZONE && item.tag.value === Zone.PLAY) {
				if (
					entitiesBeforeAction.get(item.tag.entity) &&
					entitiesBeforeAction.get(item.tag.entity).getTag(GameTag.CARDTYPE) !== CardType.ENCHANTMENT &&
					entitiesBeforeAction.get(item.tag.entity).getTag(GameTag.ZONE) === Zone.HAND
				) {
					return [
						CardPlayedFromHandAction.create(
							{
								timestamp: item.timestamp,
								index: item.index,
								entityId: item.tag.entity,
							},
							this.allCards,
						),
					];
				}
			}
		}
	}

	// For blood gems
	public reduce(actions: readonly Action[]): readonly Action[] {
		return ActionHelper.combineActions<Action>(
			actions,
			(previous, current) => this.shouldMergeActions(previous, current),
			(previous, current) => this.mergeActions(previous, current),
		);
	}

	private shouldMergeActions(previousAction: Action, currentAction: Action): boolean {
		if (previousAction instanceof CardPlayedFromHandAction && currentAction instanceof CardPlayedFromHandAction) {
			// console.log('Merging card played from hand actions', previousAction, currentAction);
			if (
				previousAction.entities.get(previousAction.originId)?.getTag(GameTag.CARDTYPE) === CardType.SPELL &&
				previousAction.entities.get(previousAction.originId)?.cardID ===
					currentAction.entities.get(currentAction.originId)?.cardID
			) {
				return true;
			}
		}
		return false;
	}

	private mergeActions(previousAction: Action, currentAction: Action): Action {
		return ActionHelper.mergeIntoFirstAction(previousAction, currentAction, {
			entities: currentAction.entities,
			originId: currentAction.originId,
			targetIds: [...(previousAction.targetIds ?? []), ...(currentAction.targetIds ?? [])].filter(
				(id, index, self) => self.indexOf(id) === index,
			) as readonly number[],
		} as CardPlayedFromHandAction);
	}
}
