import { Entity } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { defaultStartingHp, GameTag, GameType } from '@firestone-hs/reference-data';
import { BgsBattleInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-battle-info';
import { BgsBoardInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-board-info';
import { BgsPlayerEntity } from '@firestone-hs/simulate-bgs-battle/dist/bgs-player-entity';
import { BoardEntity } from '@firestone-hs/simulate-bgs-battle/dist/board-entity';
import { BoardSecret } from '@firestone-hs/simulate-bgs-battle/dist/board-secret';
import { BattlegroundsState, BgsBoard, BgsGame, BgsPlayer, PlayerBoard } from '@firestone/battlegrounds/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { Map } from 'immutable';
import { GameEvents } from '../../../game-events.service';
import { LogsUploaderService } from '../../../logs-uploader.service';
import { BgsBattleSimulationService } from '../../bgs-battle-simulation.service';
import { isSupportedScenario, normalizeHeroCardId } from '../../bgs-utils';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { BgsPlayerBoardEvent } from '../events/bgs-player-board-event';
import { EventParser } from './_event-parser';

export class BgsPlayerBoardParser implements EventParser {
	constructor(
		private readonly simulation: BgsBattleSimulationService,
		private readonly logsUploader: LogsUploaderService,
		private readonly gameEventsService: GameEvents,
		private readonly allCards: CardsFacadeService,
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
		console.debug('[bgs-simulation] received player boards', event);

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
			// There shouldn't be any case where the board is assigned to a face-off that is not the last, since logs
			// are procesed in order
			const lastFaceOff = currentState.currentGame.faceOffs[currentState.currentGame.faceOffs.length - 1];
			const updatedFaceOff = lastFaceOff.update({
				battleInfoStatus: 'empty',
				battleInfoMesage: undefined,
			});
			const newFaceOffs = currentState.currentGame.faceOffs.map((f) =>
				f.id === updatedFaceOff.id ? updatedFaceOff : f,
			);
			return currentState.update({
				currentGame: currentState.currentGame.update({
					faceOffs: newFaceOffs,
				}),
			} as BattlegroundsState);
		}

		const player: BgsPlayer = this.updatePlayer(currentState, event.playerBoard);
		const opponent: BgsPlayer = this.updatePlayer(currentState, event.opponentBoard);
		if (!player || !opponent) {
			console.warn('[bgs-simulation] missing player or opponent, returning');
			console.debug('[bgs-simulation] missing player or opponent', player, opponent, currentState);
			return currentState;
		}

		let playerTeammateBoard: PlayerBoard = null;
		let opponentTeammateBoard: PlayerBoard = null;
		for (const duoPendingBoard of event.duoPendingBoards ?? []) {
			if (playerTeammateBoard == null && duoPendingBoard.playerBoard.playerId !== player.playerId) {
				playerTeammateBoard = duoPendingBoard.playerBoard;
			}
			if (opponentTeammateBoard == null && duoPendingBoard.opponentBoard.playerId !== opponent.playerId) {
				opponentTeammateBoard = duoPendingBoard.opponentBoard;
			}
		}

		console.debug(
			'[bgs-simulation] found boards',
			event.playerBoard,
			playerTeammateBoard,
			event.opponentBoard,
			opponentTeammateBoard,
		);
		const playerTeammatePlayer = !!playerTeammateBoard
			? this.updatePlayer(currentState, playerTeammateBoard)
			: null;
		const opponentTeammatePlayer = !!opponentTeammateBoard
			? this.updatePlayer(currentState, opponentTeammateBoard)
			: null;
		console.debug(
			'[bgs-simulation] updates players',
			player,
			playerTeammatePlayer,
			opponent,
			opponentTeammatePlayer,
		);

		const newPlayers: readonly BgsPlayer[] = currentState.currentGame.players
			.map((p) => (p.playerId === player.playerId ? player : p))
			.map((p) => (p.playerId === opponent.playerId ? opponent : p))
			.map((p) =>
				!!playerTeammatePlayer && p.playerId === playerTeammatePlayer.playerId ? playerTeammatePlayer : p,
			)
			.map((p) =>
				!!opponentTeammatePlayer && p.playerId === opponentTeammatePlayer.playerId ? opponentTeammatePlayer : p,
			);

		const bgsPlayer: BgsBoardInfo = this.buildBgsBoardInfo(player, event.playerBoard);
		const bgsOpponent: BgsBoardInfo = this.buildBgsBoardInfo(opponent, event.opponentBoard);
		const playerTeammate: BgsBoardInfo = this.buildBgsBoardInfo(player, playerTeammateBoard);
		const opponentTeammate: BgsBoardInfo = this.buildBgsBoardInfo(player, opponentTeammateBoard);

		const battleInfo: BgsBattleInfo = {
			playerBoard: bgsPlayer,
			playerTeammateBoard: playerTeammate,
			opponentBoard: bgsOpponent,
			opponentTeammateBoard: opponentTeammate,
			options: {
				maxAcceptableDuration: 8000,
				numberOfSimulations: 8000,
				skipInfoLogs: false,
			},
			gameState: {
				currentTurn: currentState.currentGame.currentTurn,
				validTribes: currentState.currentGame.availableRaces,
			},
		};
		const isSupported = isSupportedScenario(battleInfo);
		if (!event.opponentBoard?.heroCardId || !normalizeHeroCardId(event.opponentBoard?.heroCardId, this.allCards)) {
			console.error('[bgs-player-board-parser] missing opponentCardId', event);
		}

		// const opponentCardId = normalizeHeroCardId(event.opponentBoard.heroCardId, this.allCards);
		// There shouldn't be any case where the board is assigned to a face-off that is not the last, since logs
		// are procesed in order
		const lastFaceOff = currentState.currentGame.faceOffs[currentState.currentGame.faceOffs.length - 1];
		if (lastFaceOff?.opponentPlayerId !== event.opponentBoard.playerId) {
			console.error(
				'[bgs-player-board-parser] got incorrect matching face-off',
				lastFaceOff?.opponentPlayerId,
				event.opponentBoard.playerId,
				lastFaceOff,
			);
			console.debug(currentState);
			return currentState;
		}
		const updatedFaceOff = lastFaceOff.update({
			battleInfo: battleInfo,
			battleInfoStatus: 'waiting-for-result',
			battleInfoMesage: isSupported.reason,
		});
		const newFaceOffs = currentState.currentGame.faceOffs.map((f) =>
			f.id === updatedFaceOff.id ? updatedFaceOff : f,
		);
		console.debug('[bgs-simulation] updated face-off', updatedFaceOff, newFaceOffs);
		const stateAfterFaceOff = currentState.currentGame.update({
			faceOffs: newFaceOffs,
		});
		const newGame = stateAfterFaceOff.update({
			players: newPlayers,
		} as BgsGame);
		const result = currentState.update({
			currentGame: newGame,
		} as BattlegroundsState);

		this.simulation.startBgsBattleSimulation(
			updatedFaceOff.id,
			battleInfo,
			result?.currentGame?.availableRaces ?? [],
			result.currentGame?.currentTurn ?? 0,
		);
		return result;
	}

	private buildBgsBoardInfo(player: BgsPlayer, playerBoard: PlayerBoard): BgsBoardInfo {
		if (!playerBoard) {
			return null;
		}

		const bgsBoard: BoardEntity[] = player.buildBgsEntities(playerBoard.board, this.allCards);
		const secrets: BoardSecret[] = player.buildBgsEntities(playerBoard.secrets, this.allCards);
		const hand: BoardEntity[] = player.buildBgsEntities(playerBoard.hand, this.allCards);
		let tavernTier =
			playerBoard.hero.Tags?.find((tag) => tag.Name === GameTag.PLAYER_TECH_LEVEL)?.Value ||
			player.getCurrentTavernTier();
		if (!tavernTier) {
			console.warn('[bgs-simulation] no tavern tier', event);
			tavernTier = 1;
		}

		const health =
			(playerBoard.hero.Tags?.find((tag) => tag.Name === GameTag.HEALTH)?.Value ??
				defaultStartingHp(GameType.GT_BATTLEGROUNDS, playerBoard.hero.CardId, this.allCards)) +
			(playerBoard.hero.Tags?.find((tag) => tag.Name === GameTag.ARMOR)?.Value ?? 0);
		const damage = playerBoard.hero?.Tags?.find((tag) => tag.Name === GameTag.DAMAGE)?.Value ?? 0;
		const hpLeft = health - damage;
		if (hpLeft <= 0 || isNaN(hpLeft)) {
			console.warn('hp is 0', health, damage, playerBoard.hero.Tags, playerBoard.hero);
		}
		return {
			player: {
				tavernTier: tavernTier,
				hpLeft: health - damage,
				cardId: playerBoard.hero.CardId, // In case it's the ghost, the hero power is not active
				entityId: playerBoard.hero.Entity,
				nonGhostCardId: player.getNormalizedHeroCardId(this.allCards),
				heroPowerId: playerBoard.heroPowerCardId,
				heroPowerUsed: playerBoard.heroPowerUsed,
				heroPowerInfo: playerBoard.heroPowerInfo,
				heroPowerInfo2: playerBoard.heroPowerInfo2,
				questRewards: playerBoard.questRewards,
				questRewardEntities: playerBoard.questRewardEntities,
				questEntities: playerBoard.questEntities,
				hand: hand,
				globalInfo: {
					EternalKnightsDeadThisGame: playerBoard.globalInfo?.EternalKnightsDeadThisGame ?? 0,
					TavernSpellsCastThisGame: playerBoard.globalInfo?.TavernSpellsCastThisGame ?? 0,
					UndeadAttackBonus: playerBoard.globalInfo?.UndeadAttackBonus ?? 0,
					ChoralAttackBuff: playerBoard.globalInfo?.ChoralAttackBuff ?? 0,
					ChoralHealthBuff: playerBoard.globalInfo?.ChoralHealthBuff ?? 0,
					FrostlingBonus: playerBoard.globalInfo?.FrostlingBonus ?? 0,
					BloodGemAttackBonus: playerBoard.globalInfo?.BloodGemAttackBonus ?? 0,
					BloodGemHealthBonus: playerBoard.globalInfo?.BloodGemHealthBonus ?? 0,
				},
				debugArmor: playerBoard.hero.Tags?.find((tag) => tag.Name === GameTag.ARMOR)?.Value,
				debugHealth: playerBoard.hero.Tags?.find((tag) => tag.Name === GameTag.HEALTH)?.Value,
			} as BgsPlayerEntity & { debugArmor: number; debugHealth: number },
			board: bgsBoard,
			secrets: secrets,
		};
	}

	private updatePlayer(currentState: BattlegroundsState, playerBoard: PlayerBoard): BgsPlayer {
		const playerToUpdate = currentState.currentGame.findPlayer(playerBoard.playerId);
		if (!playerToUpdate) {
			if (!currentState.reconnectOngoing && !this.gameEventsService.isCatchingUpLogLines()) {
				console.warn(
					'[bgs-simulation] Could not idenfity player for whom to update board history',
					currentState.currentGame.reviewId,
					playerBoard.heroCardId,
					playerBoard.playerId,
					currentState.currentGame.players.map((player) => player.playerId),
				);
			}
			return null;
		}
		console.debug(
			'[bgs-simulation] found player board to update',
			playerToUpdate.cardId,
			playerToUpdate.playerId,
			playerToUpdate.damageTaken,
			'with new board',
			playerBoard.board.map((entity) => entity.CardId),
			'from old board',
			playerToUpdate.getLastKnownBoardState()?.map((entity) => entity.cardID),
			playerBoard,
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
		});
		console.debug(
			'[bgs-simulation] update board for player',
			newPlayer.cardId,
			newPlayer.playerId,
			newPlayer.getLastKnownBoardState()?.map((entity) => entity.cardID),
			newPlayer,
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
