import { BlockType, CardType, GameTag, Zone } from '@firestone-hs/reference-data';
import { Map } from 'immutable';
import { Action } from '../../models/action/action';
import { SecretPlayedFromHandAction } from '../../models/action/secret-played-from-hand-action';
import { Entity } from '../../models/game/entity';
import { ActionHistoryItem } from '../../models/history/action-history-item';
import { HistoryItem } from '../../models/history/history-item';
import { AllCardsService } from '../all-cards.service';
import { Parser } from './parser';

export class SecretPlayedFromHandParser implements Parser {
	constructor(private allCards: AllCardsService) {}

	public applies(item: HistoryItem): boolean {
		return (
			item instanceof ActionHistoryItem &&
			parseInt(item.node.attributes.type) === BlockType.PLAY &&
			(item.node.tags && item.node.tags.length > 0)
		);
	}

	public parse(
		item: ActionHistoryItem,
		currentTurn: number,
		entitiesBeforeAction: Map<number, Entity>,
		history: readonly HistoryItem[],
	): Action[] {
		let playedCardId = -1;
		let isSecret = false;
		for (const tag of item.node.tags) {
			if (tag.tag === GameTag.ZONE && tag.value === Zone.SECRET) {
				if (
					entitiesBeforeAction.get(tag.entity) &&
					entitiesBeforeAction.get(tag.entity).getTag(GameTag.CARDTYPE) !== CardType.ENCHANTMENT
				) {
					playedCardId = tag.entity;
				}
			}
			if (tag.tag === GameTag.SECRET && tag.value === 1) {
				isSecret = true;
			}
		}
		if (
			!isSecret &&
			entitiesBeforeAction.get(playedCardId) &&
			entitiesBeforeAction.get(playedCardId).getTag(GameTag.SECRET) === 1
		) {
			isSecret = true;
		}

		if (playedCardId === -1 || !isSecret) {
			return;
		}

		return [
			SecretPlayedFromHandAction.create(
				{
					timestamp: item.timestamp,
					index: item.index,
					entityId: playedCardId,
				},
				this.allCards,
			),
		];
	}

	public reduce(actions: readonly Action[]): readonly Action[] {
		return actions;
	}
}
