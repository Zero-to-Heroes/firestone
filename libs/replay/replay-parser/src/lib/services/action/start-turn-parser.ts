import { GameTag, Step } from '@firestone-hs/reference-data';
import { Map } from 'immutable';
import { Action } from '../../models/action/action';
import { StartTurnAction } from '../../models/action/start-turn-action';
import { Entity } from '../../models/game/entity';
import { PlayerEntity } from '../../models/game/player-entity';
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
		// // console.log('current turn?', currentTurn);
		const activePlayerId = entitiesBeforeAction
			.filter(entity => entity.getTag(GameTag.CURRENT_PLAYER) === 1)
			.map(entity => entity as PlayerEntity)
			.first().playerId;
		const gameEntity = GameHepler.getGameEntity(entitiesBeforeAction);
		const isBattlegrounds = gameEntity.getTag(GameTag.TECH_LEVEL_MANA_GEM) === 1;
		// const hasShownVisualBoardState = gameEntity.getTag(GameTag.BOARD_VISUAL_STATE) > 0;
		const shouldShowTurnActions = gameEntity.getTag(GameTag.DISABLE_TURN_INDICATORS) !== 1;
		const result: Action[] = [];
		if (shouldShowTurnActions) {
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
}
