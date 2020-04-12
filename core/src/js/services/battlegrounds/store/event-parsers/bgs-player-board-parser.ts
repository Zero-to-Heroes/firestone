import { GameTag } from '@firestone-hs/reference-data';
import { Entity } from '@firestone-hs/replay-parser';
import { BgsBoardInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-board-info';
import { BoardEntity } from '@firestone-hs/simulate-bgs-battle/dist/board-entity';
import { Map } from 'immutable';
import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsGame } from '../../../../models/battlegrounds/bgs-game';
import { BgsPlayer } from '../../../../models/battlegrounds/bgs-player';
import { BgsBoard } from '../../../../models/battlegrounds/in-game/bgs-board';
import { BgsBattleSimulationService } from '../../bgs-battle-simulation.service';
import { BgsPlayerBoardEvent } from '../events/bgs-player-board-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsPlayerBoardParser implements EventParser {
	constructor(private readonly simulation: BgsBattleSimulationService) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsPlayerBoardEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsPlayerBoardEvent): Promise<BattlegroundsState> {
		const playerToUpdate = currentState.currentGame.players.find(player => player.cardId === event.heroCardId);
		console.log('finding player board', playerToUpdate, event, currentState);
		const newHistory: readonly BgsBoard[] = [
			...playerToUpdate.boardHistory,
			BgsBoard.create({
				board: this.buildEntities(event.board),
				turn: currentState.currentGame.currentTurn,
			}),
		];
		const newPlayer = playerToUpdate.update({
			boardHistory: newHistory,
		} as BgsPlayer);

		console.log(
			'building board to add to battle board',
			newPlayer.getLastKnownBoardState(),
			event.board,
			newPlayer,
		);
		const bgsBoard: BoardEntity[] = newPlayer.buildBgsEntities(event.board);
		let tavernTier = event.hero?.Tags?.find(tag => tag.Name === GameTag.PLAYER_TECH_LEVEL)?.Value;
		if (!tavernTier) {
			console.log('[bgs-simulation] no tavern tier', event);
			tavernTier = 1;
		}
		const bgsInfo: BgsBoardInfo = {
			player: {
				tavernTier: tavernTier,
				cardId: event.hero?.CardId, // In case it's the ghost, the hero power is not active
			},
			board: bgsBoard,
		};
		const newPlayers: readonly BgsPlayer[] = currentState.currentGame.players.map(player =>
			player.cardId === newPlayer.cardId ? newPlayer : player,
		);
		const newGame = currentState.currentGame.update({ players: newPlayers } as BgsGame).addBattleBoardInfo(bgsInfo);
		const result = currentState.update({
			currentGame: newGame,
		} as BattlegroundsState);

		if (result.currentGame.battleInfo.opponentBoard) {
			this.simulation.startBgsBattleSimulation(result.currentGame.battleInfo);
		}
		return result;
	}

	private buildEntities(logEntities: readonly any[]): readonly Entity[] {
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
