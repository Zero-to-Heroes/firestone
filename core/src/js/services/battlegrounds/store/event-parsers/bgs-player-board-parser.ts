import { Entity } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { GameTag } from '@firestone-hs/reference-data';
import { BgsBoardInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-board-info';
import { BoardEntity } from '@firestone-hs/simulate-bgs-battle/dist/board-entity';
import { Map } from 'immutable';
import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsGame } from '../../../../models/battlegrounds/bgs-game';
import { BgsPlayer } from '../../../../models/battlegrounds/bgs-player';
import { BgsBoard } from '../../../../models/battlegrounds/in-game/bgs-board';
import { BgsBattleSimulationService } from '../../bgs-battle-simulation.service';
import { normalizeHeroCardId } from '../../bgs-utils';
import { BgsPlayerBoardEvent } from '../events/bgs-player-board-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsPlayerBoardParser implements EventParser {
	constructor(private readonly simulation: BgsBattleSimulationService) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsPlayerBoardEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsPlayerBoardEvent): Promise<BattlegroundsState> {
		const playerToUpdate = currentState.currentGame.players.find(
			player => normalizeHeroCardId(player.cardId) === normalizeHeroCardId(event.heroCardId),
		);
		if (!playerToUpdate) {
			console.error(
				'Could not idenfity player for whom to update board history',
				event.heroCardId,
				normalizeHeroCardId(event.heroCardId),
				currentState.currentGame.players.map(player => normalizeHeroCardId(player.cardId)),
			);
			return currentState;
		}
		// console.log('finding player board', playerToUpdate, event, currentState);
		const newHistory: readonly BgsBoard[] = [
			...(playerToUpdate.boardHistory || []),
			BgsBoard.create({
				board: this.buildEntities(event.board),
				turn: currentState.currentGame.currentTurn,
			}),
		];
		const newPlayer: BgsPlayer = playerToUpdate.update({
			boardHistory: newHistory,
		} as BgsPlayer);

		// console.log(
		// 	'building board to add to battle board',
		// 	newPlayer.getLastKnownBoardState(),
		// 	event.board,
		// 	newPlayer,
		// );
		const bgsBoard: BoardEntity[] = newPlayer.buildBgsEntities(event.board);
		let tavernTier =
			event.hero?.Tags?.find(tag => tag.Name === GameTag.PLAYER_TECH_LEVEL)?.Value ||
			newPlayer.getCurrentTavernTier();
		if (!tavernTier) {
			console.warn('[bgs-simulation] no tavern tier', event);
			tavernTier = 1;
		}
		const bgsInfo: BgsBoardInfo = {
			player: {
				tavernTier: tavernTier,
				cardId: event.hero?.CardId, // In case it's the ghost, the hero power is not active
				heroPowerId: event.heroPowerCardId,
				heroPowerUsed: event.heroPowerUsed,
			},
			board: bgsBoard,
		};
		const newPlayers: readonly BgsPlayer[] = currentState.currentGame.players.map(player =>
			normalizeHeroCardId(player.cardId) === normalizeHeroCardId(newPlayer.cardId) ? newPlayer : player,
		);
		const newGame = currentState.currentGame.update({ players: newPlayers } as BgsGame).addBattleBoardInfo(bgsInfo);
		const result = currentState.update({
			currentGame: newGame,
		} as BattlegroundsState);

		if (result.currentGame.battleInfo.opponentBoard) {
			this.simulation.startBgsBattleSimulation(result.currentGame.battleInfo, result.currentGame.availableRaces);
		}
		return result;
	}

	private buildEntities(logEntities: readonly any[]): readonly Entity[] {
		return logEntities.map(entity => this.buildEntity(entity));
	}

	private buildEntity(logEntity): Entity {
		return {
			cardID: logEntity.CardId as string,
			id: logEntity.Entity as number,
			tags: this.buildTags(logEntity.Tags),
		} as Entity;
	}

	private buildTags(tags: { Name: number; Value: number }[]): Map<string, number> {
		return Map(tags.map(tag => [GameTag[tag.Name], tag.Value]));
	}
}
