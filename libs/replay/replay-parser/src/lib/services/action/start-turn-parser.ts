import { GameTag, Step } from '@firestone-hs/reference-data';
import { Map } from 'immutable';
import { Action } from '../../models/action/action';
import { StartTurnAction } from '../../models/action/start-turn-action';
import { Entity } from '../../models/game/entity';
import { PlayerEntity } from '../../models/game/player-entity';
import { ActionHistoryItem } from '../../models/history/action-history-item';
import { HistoryItem } from '../../models/history/history-item';
import { TagChangeHistoryItem } from '../../models/history/tag-change-history-item';
import { BaconBoardVisualStateAction, GameHepler } from '../../models/models';
import { AllCardsService } from '../all-cards.service';
import { Parser } from './parser';

export class StartTurnParser implements Parser {
	constructor(private readonly allCards: AllCardsService) {}

	public applies(item: HistoryItem): boolean {
		return (
			item instanceof TagChangeHistoryItem && item.tag.tag === GameTag.STEP && item.tag.value === Step.MAIN_READY
		);
	}

	public parse(
		item: TagChangeHistoryItem,
		currentTurn: number,
		entitiesBeforeAction: Map<number, Entity>,
		history: readonly HistoryItem[],
	): Action[] {
		// CURRENT_PLAYER on player entities is often still the *previous* turn at the MAIN_READY line.
		// The first Block/Action whose entity is a Player (ids 2/3 in HSReplay) matches the client turn owner.
		const activePlayerId = this.resolveActivePlayerId(item, entitiesBeforeAction, history);
		const gameEntity = GameHepler.getGameEntity(entitiesBeforeAction);
		const isBattlegrounds = gameEntity.getTag(GameTag.TECH_LEVEL_MANA_GEM) === 1;
		// const hasShownVisualBoardState = gameEntity.getTag(GameTag.BOARD_VISUAL_STATE) > 0;
		const shouldShowTurnActions = gameEntity.getTag(GameTag.DISABLE_TURN_INDICATORS) !== 1;
		const result: Action[] = [];
		if (shouldShowTurnActions && activePlayerId != null) {
			result.push(
				StartTurnAction.create(
					{
						timestamp: item.timestamp,
						turn: currentTurn,
						activePlayer: activePlayerId,
						index: item.index,
					},
					this.allCards,
				),
			);
		}
		// HACK: First turn usuall doesn't contain anything useful in battlegrounds
		if (currentTurn <= 2 && isBattlegrounds) {
			// // console.log('visual forced', 1, item, currentTurn);
			result.push(
				BaconBoardVisualStateAction.create(
					{
						timestamp: item.timestamp,
						newState: gameEntity.getTag(GameTag.BOARD_VISUAL_STATE),
						index: item.index,
					} as BaconBoardVisualStateAction,
					this.allCards,
				),
			);
		}
		return result;
	}

	public reduce(actions: readonly Action[]): readonly Action[] {
		return actions;
	}

	private resolveActivePlayerId(
		item: TagChangeHistoryItem,
		entitiesBeforeAction: Map<number, Entity>,
		history: readonly HistoryItem[],
	): number | undefined {
		const itemIndex = history.indexOf(item);
		if (itemIndex >= 0) {
			const scanEnd = Math.min(history.length, itemIndex + 40);
			for (let i = itemIndex + 1; i < scanEnd; i++) {
				const hi = history[i];
				if (!(hi instanceof ActionHistoryItem)) {
					continue;
				}
				const node = hi.node;
				if (node?.name !== 'Block' && node?.name !== 'Action') {
					continue;
				}
				const rawEntity = node.attributes?.entity as string | undefined;
				if (rawEntity == null || rawEntity === '') {
					continue;
				}
				const entityId = parseInt(rawEntity, 10);
				if (Number.isNaN(entityId)) {
					continue;
				}
				const ent = entitiesBeforeAction.get(entityId);
				if (ent instanceof PlayerEntity) {
					return ent.playerId;
				}
			}
		}

		return entitiesBeforeAction
			.filter((entity) => entity.getTag(GameTag.CURRENT_PLAYER) === 1)
			.map((entity) => entity as PlayerEntity)
			.first()?.playerId;
	}
}
