import { Entity } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { GameTag, GameType } from '@firestone-hs/reference-data';
import { BgsBattleInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-battle-info';
import { BgsBoardInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-board-info';
import { BoardEntity } from '@firestone-hs/simulate-bgs-battle/dist/board-entity';
import { BoardSecret } from '@firestone-hs/simulate-bgs-battle/dist/board-secret';
import { Map } from 'immutable';
import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsFaceOffWithSimulation } from '../../../../models/battlegrounds/bgs-face-off-with-simulation';
import { BgsGame } from '../../../../models/battlegrounds/bgs-game';
import { BgsPlayer } from '../../../../models/battlegrounds/bgs-player';
import { BgsBoard } from '../../../../models/battlegrounds/in-game/bgs-board';
import { GameEvents } from '../../../game-events.service';
import { defaultStartingHp } from '../../../hs-utils';
import { LogsUploaderService } from '../../../logs-uploader.service';
import { BgsBattleSimulationService } from '../../bgs-battle-simulation.service';
import { isSupportedScenario, normalizeHeroCardId } from '../../bgs-utils';
import { BgsPlayerBoardEvent, PlayerBoard } from '../events/bgs-player-board-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsPlayerBoardParser implements EventParser {
	constructor(
		private readonly simulation: BgsBattleSimulationService,
		private readonly logsUploader: LogsUploaderService,
		private readonly gameEventsService: GameEvents,
	) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsPlayerBoardEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsPlayerBoardEvent): Promise<BattlegroundsState> {
		console.log(
			'[bgs-simulation] received player boards',
			event.playerBoard?.board?.length,
			event.opponentBoard?.board?.length,
			event.playerBoard?.secrets?.length,
			event.opponentBoard?.secrets?.length,
		);

		if (event.playerBoard?.board?.length > 7 || event.opponentBoard?.board?.length > 7) {
			setTimeout(async () => {
				const gameLogsKey = await this.logsUploader.uploadGameLogs();
				console.error(
					'no-format',
					'Too many entities on the board',
					currentState.spectating,
					currentState.currentGame.reviewId,
					gameLogsKey,
					event.playerBoard?.heroCardId,
					event.playerBoard?.board?.map((entity) => entity.CardId),
					event.opponentBoard?.heroCardId,
					event.opponentBoard?.board?.map((entity) => entity.CardId),
				);
			});
			return currentState.update({
				currentGame: currentState.currentGame.updateLastFaceOff(
					normalizeHeroCardId(event.opponentBoard.heroCardId),
					{
						battleInfoStatus: 'empty',
						battleInfoMesage: undefined,
					} as BgsFaceOffWithSimulation,
				),
			} as BattlegroundsState);
		}

		const player: BgsPlayer = this.updatePlayer(currentState, event.playerBoard);
		const opponent: BgsPlayer = this.updatePlayer(currentState, event.opponentBoard);

		if (!player || !opponent) {
			console.warn('[bgs-simulation] missing player or opponent, returning');
			return currentState;
		}

		const newPlayers: readonly BgsPlayer[] = currentState.currentGame.players
			.map((p) => (normalizeHeroCardId(p.cardId) === normalizeHeroCardId(player.cardId) ? player : p))
			.map((p) => (normalizeHeroCardId(p.cardId) === normalizeHeroCardId(opponent.cardId) ? opponent : p));

		const bgsPlayer: BgsBoardInfo = this.buildBgsBoardInfo(player, event.playerBoard);
		const bgsOpponent: BgsBoardInfo = this.buildBgsBoardInfo(opponent, event.opponentBoard);
		const battleInfo: BgsBattleInfo = {
			playerBoard: bgsPlayer,
			opponentBoard: bgsOpponent,
			options: null,
			gameState: {
				currentTurn: currentState.currentGame.currentTurn,
				validTribes: currentState.currentGame.availableRaces,
			},
		};
		const isSupported = isSupportedScenario(battleInfo);
		if (!event.opponentBoard?.heroCardId || !normalizeHeroCardId(event.opponentBoard?.heroCardId)) {
			console.error('[bgs-player-board-parser] missing opponentCardId', event);
		}

		const stateAfterFaceOff = currentState.currentGame.updateLastFaceOff(
			normalizeHeroCardId(event.opponentBoard.heroCardId),
			{
				battleInfo: battleInfo,
				battleInfoStatus: 'waiting-for-result',
				battleInfoMesage: isSupported.reason,
			} as BgsFaceOffWithSimulation,
		);
		const newGame = stateAfterFaceOff.update({
			players: newPlayers,
		} as BgsGame);
		const result = currentState.update({
			currentGame: newGame,
		} as BattlegroundsState);

		this.simulation.startBgsBattleSimulation(
			battleInfo,
			result?.currentGame?.availableRaces ?? [],
			result.currentGame?.currentTurn ?? 0,
		);
		return result;
	}

	private buildBgsBoardInfo(player: BgsPlayer, playerBoard: PlayerBoard): BgsBoardInfo {
		const bgsBoard: BoardEntity[] = player.buildBgsEntities(playerBoard.board);
		const secrets: BoardSecret[] = player.buildBgsEntities(playerBoard.secrets);
		let tavernTier =
			playerBoard.hero.Tags?.find((tag) => tag.Name === GameTag.PLAYER_TECH_LEVEL)?.Value ||
			player.getCurrentTavernTier();
		if (!tavernTier) {
			console.warn('[bgs-simulation] no tavern tier', event);
			tavernTier = 1;
		}

		const health =
			(playerBoard.hero.Tags?.find((tag) => tag.Name === GameTag.HEALTH)?.Value ??
				defaultStartingHp(GameType.GT_BATTLEGROUNDS, playerBoard.hero.CardId)) +
			(playerBoard.hero.Tags?.find((tag) => tag.Name === GameTag.ARMOR)?.Value ?? 0);
		const damage = playerBoard.hero?.Tags?.find((tag) => tag.Name === GameTag.DAMAGE)?.Value ?? 0;
		console.debug('set hp left for', playerBoard.hero.CardId, health - damage, health, damage, playerBoard);
		const hpLeft = health - damage;
		if (hpLeft <= 0 || isNaN(hpLeft)) {
			console.warn('hp is 0', health, damage, playerBoard.hero.Tags, playerBoard.hero);
		}
		return {
			player: {
				tavernTier: tavernTier,
				hpLeft: health - damage,
				cardId: playerBoard.hero.CardId, // In case it's the ghost, the hero power is not active
				entityId: playerBoard.hero.EntityId,
				nonGhostCardId: player.getNormalizedHeroCardId(),
				heroPowerId: playerBoard.heroPowerCardId,
				heroPowerUsed: playerBoard.heroPowerUsed,
				heroPowerInfo: playerBoard.heroPowerInfo,
			},
			board: bgsBoard,
			secrets: secrets,
		};
	}

	private updatePlayer(currentState: BattlegroundsState, playerBoard: PlayerBoard): BgsPlayer {
		const playerToUpdate = currentState.currentGame.players.find(
			(player) => normalizeHeroCardId(player.cardId) === normalizeHeroCardId(playerBoard.heroCardId),
		);
		if (!playerToUpdate) {
			if (!currentState.reconnectOngoing && !this.gameEventsService.isCatchingUpLogLines()) {
				console.error(
					'Could not idenfity player for whom to update board history',
					currentState.currentGame.reviewId,
					playerBoard.heroCardId,
					normalizeHeroCardId(playerBoard.heroCardId),
					currentState.currentGame.players.map((player) => normalizeHeroCardId(player.cardId)),
				);
			}
			return null;
		}
		console.log(
			'found player board to update',
			playerToUpdate.cardId,
			playerToUpdate.damageTaken,
			'with new board',
			playerBoard.board.map((entity) => entity.CardId),
			'from old board',
			playerToUpdate.getLastKnownBoardState()?.map((entity) => entity.cardID),
		);
		const newHistory: readonly BgsBoard[] = [
			...(playerToUpdate.boardHistory || []),
			BgsBoard.create({
				board: BgsPlayerBoardParser.buildEntities(playerBoard.board),
				turn: currentState.currentGame.currentTurn,
			}),
		];
		const newPlayer: BgsPlayer = playerToUpdate.update({
			boardHistory: newHistory,
		} as BgsPlayer);
		console.log(
			'update board for player',
			newPlayer.cardId,
			newPlayer.getLastKnownBoardState()?.map((entity) => entity.cardID),
		);
		return newPlayer;
	}

	public static buildEntities(logEntities: readonly any[]): readonly Entity[] {
		return logEntities.map((entity) => BgsPlayerBoardParser.buildEntity(entity));
	}

	private static buildEntity(logEntity): Entity {
		return {
			cardID: logEntity.CardId as string,
			id: logEntity.Entity as number,
			tags: BgsPlayerBoardParser.buildTags(logEntity.Tags),
		} as Entity;
	}

	private static buildTags(tags: { Name: number; Value: number }[]): Map<string, number> {
		return Map(tags.map((tag) => [GameTag[tag.Name], tag.Value]));
	}
}
