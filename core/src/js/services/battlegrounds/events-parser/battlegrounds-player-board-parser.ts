import { GameTag } from '@firestone-hs/reference-data';
import { Entity } from '@firestone-hs/replay-parser';
import { Map } from 'immutable';
import { BattlegroundsBoardState } from '../../../models/battlegrounds/battlegrounds-board-state';
import { BattlegroundsPlayer } from '../../../models/battlegrounds/battlegrounds-player';
import { BattlegroundsState } from '../../../models/battlegrounds/battlegrounds-state';
import { GameEvent } from '../../../models/game-event';
import { EventParser } from './event-parser';

export class BattlegroundsPlayerBoardParser implements EventParser {
	public applies(gameEvent: GameEvent, state: BattlegroundsState): boolean {
		return state && gameEvent.type === GameEvent.BATTLEGROUNDS_PLAYER_BOARD;
	}

	public async parse(currentState: BattlegroundsState, gameEvent: GameEvent): Promise<BattlegroundsState> {
		const cardId = gameEvent.additionalData.cardId;
		const board = this.buildEntities(gameEvent.additionalData.board);
		const boardState = Object.assign(new BattlegroundsBoardState(), {
			minions: board,
		} as BattlegroundsBoardState);
		const player: BattlegroundsPlayer = currentState.getPlayer(cardId);
		const newPlayer = player.addNewBoardState(boardState);
		return currentState.updatePlayer(newPlayer);
	}

	public event() {
		return GameEvent.BATTLEGROUNDS_PLAYER_BOARD;
	}

	private buildEntities(logEntities: any[]): readonly Entity[] {
		return logEntities.map(entity => this.buildEntity(entity));
	}

	private buildEntity(logEntity): Entity {
		return Object.assign(new Entity(), {
			cardID: logEntity.CardId,
			id: logEntity.Entity,
			tags: this.buildTags(logEntity.Tags),
		} as Entity);
	}

	private buildTags(tags: { Name: number; Value: number }[]): Map<string, number> {
		return Map(tags.map(tag => [GameTag[tag.Name], tag.Value]));
	}
}
