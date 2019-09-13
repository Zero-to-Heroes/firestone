import { Injectable } from '@angular/core';
import { captureEvent } from '@sentry/core';
import { GameEvent, GameEventPlayer } from '../models/game-event';
import { DeckParserService } from './decktracker/deck-parser.service';
import { Events } from './events.service';
import { GameEventsEmitterService } from './game-events-emitter.service';
import { LogsUploaderService } from './logs-uploader.service';
import { PlayersInfoService } from './players-info.service';
import { GameEventsPluginService } from './plugins/game-events-plugin.service';
import { ProcessingQueue } from './processing-queue.service';
import { S3FileUploadService } from './s3-file-upload.service';

@Injectable()
export class GameEvents {
	// The start / end spectating can be set outside of game start / end, so we need to keep it separate
	private spectating: boolean;
	private plugin;

	private processingQueue = new ProcessingQueue<string>(eventQueue => this.processQueue(eventQueue), 500, 'game-events');

	constructor(
		private gameEventsPlugin: GameEventsPluginService,
		private logService: LogsUploaderService,
		private s3: S3FileUploadService,
		private events: Events,
		private playersInfoService: PlayersInfoService,
		private gameEventsEmitter: GameEventsEmitterService,
		private deckParser: DeckParserService,
	) {
		this.init();
	}

	async init() {
		console.log('init game events monitor');
		this.plugin = await this.gameEventsPlugin.get();
		if (this.plugin) {
			this.plugin.onGlobalEvent.addListener((first: string, second: string) => {
				console.log('[game-events] received global event', first, second);
				if (first.toLowerCase().indexOf('exception') !== -1 || first.toLowerCase().indexOf('error') !== -1) {
					this.uploadLogsAndSendException(first, second);
				}
			});
			this.plugin.onGameEvent.addListener(gameEvent => {
				this.dispatchGameEvent(JSON.parse(gameEvent));
			});
			this.plugin.initRealtimeLogConversion(() => {
				console.log('[game-events] real-time log processing ready to go');
			});
		}
		this.events.on(Events.SCENE_CHANGED).subscribe(event =>
			this.gameEventsEmitter.allEvents.next(
				Object.assign(new GameEvent(), {
					type: GameEvent.SCENE_CHANGED,
					additionalData: { scene: event.data[0] },
				} as GameEvent),
			),
		);
		this.events.on(Events.GAME_STATS_UPDATED).subscribe(event => {
			this.gameEventsEmitter.allEvents.next(
				Object.assign(new GameEvent(), {
					type: GameEvent.GAME_STATS_UPDATED,
					additionalData: { gameStats: event.data[0] },
				} as GameEvent),
			);
		});
	}

	private async processQueue(eventQueue: readonly string[]): Promise<readonly string[]> {
		if (eventQueue.some(data => data.indexOf('CREATE_GAME') !== -1)) {
			console.log('[game-events] preparing log lines that include game creation to feed to the plugin');
		}
		await this.processLogs(eventQueue);
		return [];
	}

	private async processLogs(eventQueue: readonly string[]): Promise<void> {
		return new Promise<void>(resolve => {
			this.plugin.realtimeLogProcessing(eventQueue, () => {
				resolve();
			});
		});
	}

	public async dispatchGameEvent(gameEvent) {
		console.log(gameEvent.Type + ' event');
		switch (gameEvent.Type) {
			case 'NEW_GAME':
				const event = Object.assign(new GameEvent(), { type: GameEvent.GAME_START } as GameEvent);
				this.gameEventsEmitter.allEvents.next(event);
				this.gameEventsEmitter.onGameStart.next(event);
				break;
			case 'MATCH_METADATA':
				this.gameEventsEmitter.allEvents.next(
					Object.assign(new GameEvent(), {
						type: GameEvent.MATCH_METADATA,
						additionalData: {
							metaData: gameEvent.Value,
						},
					} as GameEvent),
				);
				break;
			case 'LOCAL_PLAYER':
				// First try without waiting for a callback, which is most of the cases
				const playerInfo = this.playersInfoService.playerInfo || (await this.playersInfoService.getPlayerInfo());
				const localPlayer: GameEventPlayer = Object.assign({}, gameEvent.Value, {
					standardRank: playerInfo ? playerInfo.standardRank : undefined,
					standardLegendRank: playerInfo ? playerInfo.standardLegendRank : undefined,
					wildRank: playerInfo ? playerInfo.wildRank : undefined,
					wildLegendRank: playerInfo ? playerInfo.wildLegendRank : undefined,
					cardBackId: playerInfo ? playerInfo.cardBackId : undefined,
					deck: this.deckParser.currentDeck,
				});
				console.log('sending LOCAL_PLAYER info', localPlayer);
				this.gameEventsEmitter.allEvents.next(
					Object.assign(new GameEvent(), {
						type: GameEvent.LOCAL_PLAYER,
						localPlayer: localPlayer,
					} as GameEvent),
				);
				break;
			case 'OPPONENT_PLAYER':
				const opponentInfo = this.playersInfoService.opponentInfo || (await this.playersInfoService.getOpponentInfo());
				const opponentPlayer: GameEventPlayer = Object.assign({}, gameEvent.Value, {
					standardRank: opponentInfo ? opponentInfo.standardRank : undefined,
					standardLegendRank: opponentInfo ? opponentInfo.standardLegendRank : undefined,
					wildRank: opponentInfo ? opponentInfo.wildRank : undefined,
					wildLegendRank: opponentInfo ? opponentInfo.wildLegendRank : undefined,
					cardBackId: opponentInfo ? opponentInfo.cardBackId : undefined,
				});
				console.log('sending OPPONENT_PLAYER info', opponentPlayer);
				this.gameEventsEmitter.allEvents.next(
					Object.assign(new GameEvent(), {
						type: GameEvent.OPPONENT,
						opponentPlayer: opponentPlayer,
					} as GameEvent),
				);
				break;
			case 'MULLIGAN_INPUT':
				this.gameEventsEmitter.allEvents.next(
					Object.assign(new GameEvent(), {
						type: GameEvent.MULLIGAN_INPUT,
					} as GameEvent),
				);
				break;
			case 'MULLIGAN_DONE':
				this.gameEventsEmitter.allEvents.next(
					Object.assign(new GameEvent(), {
						type: GameEvent.MULLIGAN_DONE,
					} as GameEvent),
				);
				break;
			case 'MAIN_STEP_READY':
				this.gameEventsEmitter.allEvents.next(
					Object.assign(new GameEvent(), {
						type: GameEvent.MAIN_STEP_READY,
					} as GameEvent),
				);
				break;
			case 'RUMBLE_RUN_STEP':
				this.gameEventsEmitter.allEvents.next(
					Object.assign(new GameEvent(), {
						type: GameEvent.RUMBLE_RUN_STEP,
						additionalData: {
							step: gameEvent.Value - 1,
						},
					} as GameEvent),
				);
				break;
			case 'DUNGEON_RUN_STEP':
				this.gameEventsEmitter.allEvents.next(
					Object.assign(new GameEvent(), {
						type: GameEvent.DUNGEON_RUN_STEP,
						additionalData: {
							step: gameEvent.Value - 1,
						},
					} as GameEvent),
				);
				break;
			case 'MONSTER_HUNT_STEP':
				this.gameEventsEmitter.allEvents.next(
					Object.assign(new GameEvent(), {
						type: GameEvent.MONSTER_HUNT_STEP,
						additionalData: {
							step: gameEvent.Value - 1,
						},
					} as GameEvent),
				);
				break;
			case 'CARD_PLAYED':
				this.gameEventsEmitter.allEvents.next(GameEvent.build(GameEvent.CARD_PLAYED, gameEvent));
				break;
			case 'DISCARD_CARD':
				this.gameEventsEmitter.allEvents.next(GameEvent.build(GameEvent.DISCARD_CARD, gameEvent));
				break;
			case 'MINION_DIED':
				this.gameEventsEmitter.allEvents.next(GameEvent.build(GameEvent.MINION_DIED, gameEvent));
				break;
			case 'RECRUIT_CARD':
				this.gameEventsEmitter.allEvents.next(GameEvent.build(GameEvent.RECRUIT_CARD, gameEvent));
				break;
			case 'SECRET_PLAYED_FROM_DECK':
				this.gameEventsEmitter.allEvents.next(GameEvent.build(GameEvent.SECRET_PLAYED_FROM_DECK, gameEvent));
				break;
			case 'MINION_SUMMONED':
				const summonAdditionProps = gameEvent.Value.AdditionalProps
					? {
							creatorCardId: gameEvent.Value.AdditionalProps.CreatorCardId,
					  }
					: null;
				this.gameEventsEmitter.allEvents.next(GameEvent.build(GameEvent.MINION_SUMMONED, gameEvent, summonAdditionProps));
				break;
			case 'CARD_CHANGED_ON_BOARD':
				this.gameEventsEmitter.allEvents.next(GameEvent.build(GameEvent.CARD_CHANGED_ON_BOARD, gameEvent));
				break;
			case 'RECEIVE_CARD_IN_HAND':
				this.gameEventsEmitter.allEvents.next(GameEvent.build(GameEvent.RECEIVE_CARD_IN_HAND, gameEvent));
				break;
			case 'END_OF_ECHO_IN_HAND':
				this.gameEventsEmitter.allEvents.next(GameEvent.build(GameEvent.END_OF_ECHO_IN_HAND, gameEvent));
				break;
			case 'CREATE_CARD_IN_DECK':
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.CREATE_CARD_IN_DECK, gameEvent, {
						creatorCardId: gameEvent.Value.AdditionalProps && gameEvent.Value.AdditionalProps.CreatorCardId,
					}),
				);
				break;
			case 'SECRET_PLAYED':
				this.gameEventsEmitter.allEvents.next(GameEvent.build(GameEvent.SECRET_PLAYED, gameEvent));
				break;
			case 'CARD_DRAW_FROM_DECK':
				this.gameEventsEmitter.allEvents.next(GameEvent.build(GameEvent.CARD_DRAW_FROM_DECK, gameEvent));
				break;
			case 'CARD_BACK_TO_DECK':
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.CARD_BACK_TO_DECK, gameEvent, {
						initialZone: gameEvent.Value.AdditionalProps.InitialZone,
					}),
				);
				break;
			case 'CARD_REMOVED_FROM_DECK':
				this.gameEventsEmitter.allEvents.next(GameEvent.build(GameEvent.CARD_REMOVED_FROM_DECK, gameEvent));
				break;
			case 'CARD_REMOVED_FROM_HAND':
				this.gameEventsEmitter.allEvents.next(GameEvent.build(GameEvent.CARD_REMOVED_FROM_HAND, gameEvent));
				break;
			case 'BURNED_CARD':
				this.gameEventsEmitter.allEvents.next(GameEvent.build(GameEvent.BURNED_CARD, gameEvent));
				break;
			case 'MULLIGAN_INITIAL_OPTION':
				this.gameEventsEmitter.allEvents.next(GameEvent.build(GameEvent.MULLIGAN_INITIAL_OPTION, gameEvent));
				break;
			case 'CARD_ON_BOARD_AT_GAME_START':
				this.gameEventsEmitter.allEvents.next(GameEvent.build(GameEvent.CARD_ON_BOARD_AT_GAME_START, gameEvent));
			case 'FIRST_PLAYER':
				this.gameEventsEmitter.allEvents.next(GameEvent.build(GameEvent.FIRST_PLAYER, gameEvent));
				break;
			case 'PASSIVE_BUFF':
				this.gameEventsEmitter.allEvents.next(GameEvent.build(GameEvent.PASSIVE_BUFF, gameEvent));
				break;
			case 'MINION_ON_BOARD_ATTACK_UPDATED':
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.MINION_ON_BOARD_ATTACK_UPDATED, gameEvent, {
						initialAttack: gameEvent.Value.InitialAttack,
						newAttack: gameEvent.Value.NewAttack,
					}),
				);
				break;
			case 'ARMOR_CHANGED':
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.ARMOR_CHANGED, gameEvent, {
						armorChange: gameEvent.Value.ArmorChange,
					}),
				);
				break;
			case 'FATIGUE_DAMAGE':
				this.gameEventsEmitter.allEvents.next(
					Object.assign(new GameEvent(), {
						type: GameEvent.FATIGUE_DAMAGE,
						localPlayer: gameEvent.Value.LocalPlayer,
						opponentPlayer: gameEvent.Value.OpponentPlayer,
						additionalData: {
							playerId: gameEvent.Value.PlayerId,
							fatigueDamage: gameEvent.Value.FatigueDamage,
						},
					} as GameEvent),
				);
				break;
			case 'DAMAGE':
				this.gameEventsEmitter.allEvents.next(
					Object.assign(new GameEvent(), {
						type: GameEvent.DAMAGE,
						localPlayer: gameEvent.Value.LocalPlayer,
						opponentPlayer: gameEvent.Value.OpponentPlayer,
						additionalData: {
							sourceCardId: gameEvent.Value.SourceCardId,
							sourceControllerId: gameEvent.Value.SourceControllerId,
							targets: gameEvent.Value.Targets,
						},
					} as GameEvent),
				);
				break;
			case 'HEALING':
				this.gameEventsEmitter.allEvents.next(
					Object.assign(new GameEvent(), {
						type: GameEvent.HEALING,
						localPlayer: gameEvent.Value.LocalPlayer,
						opponentPlayer: gameEvent.Value.OpponentPlayer,
						additionalData: {
							sourceCardId: gameEvent.Value.SourceCardId,
							sourceControllerId: gameEvent.Value.SourceControllerId,
							targets: gameEvent.Value.Targets,
						},
					} as GameEvent),
				);
				break;
			case 'TURN_START':
				this.gameEventsEmitter.allEvents.next(
					Object.assign(new GameEvent(), {
						type: GameEvent.TURN_START,
						additionalData: {
							turnNumber: gameEvent.Value,
						},
					} as GameEvent),
				);
				break;
			case 'WINNER':
				this.gameEventsEmitter.allEvents.next(
					Object.assign(new GameEvent(), {
						type: GameEvent.WINNER,
						localPlayer: gameEvent.Value.LocalPlayer,
						opponentPlayer: gameEvent.Value.OpponentPlayer,
						additionalData: {
							winner: gameEvent.Value.Winner,
							report: gameEvent.Value.GameStateReport,
						},
					} as GameEvent),
				);
				break;
			case 'TIE':
				this.gameEventsEmitter.allEvents.next(
					Object.assign(new GameEvent(), {
						type: GameEvent.TIE,
					} as GameEvent),
				);
				break;
			case 'GAME_END':
				this.gameEventsEmitter.allEvents.next(
					Object.assign(new GameEvent(), {
						type: GameEvent.GAME_END,
						localPlayer: gameEvent.Value.LocalPlayer,
						opponentPlayer: gameEvent.Value.OpponentPlayer,
						additionalData: {
							game: gameEvent.Value.Game,
							report: gameEvent.Value.GameStateReport,
							replayXWml: gameEvent.Value.ReplayXml,
						},
					} as GameEvent),
				);
				break;
			default:
				console.log('unsupported game event', gameEvent);
		}
	}

	public receiveLogLine(data: string) {
		if (data.indexOf('Begin Spectating') !== -1) {
			console.log('begin spectating', data);
			this.spectating = true;
		}
		if (data.indexOf('End Spectator Mode') !== -1) {
			console.log('end spectating', data);
			this.spectating = false;
		}

		if (this.spectating) {
			// For now we're not interested in spectating events, but that will come out later
			return;
		}

		this.processingQueue.enqueue(data);

		if (data.indexOf('CREATE_GAME') !== -1) {
			console.log('[game-events] received CREATE_GAME log', data);
		}
	}

	private async uploadLogsAndSendException(first, second) {
		try {
			const s3LogFileKey = await this.logService.uploadGameLogs();
			const fullLogsFromPlugin = second.indexOf('/#/') !== -1 ? second.split('/#/')[0] : second;
			const pluginLogsFileKey = await this.s3.postLogs(fullLogsFromPlugin);
			console.log('uploaded fullLogsFromPlugin to S3', pluginLogsFileKey);
			const lastLogsReceivedInPlugin = second.indexOf('/#/') !== -1 ? second.split('/#/')[1] : second;
			const firstoneLogsKey = await this.logService.uploadAppLogs();
			captureEvent({
				message: 'Exception while running plugin: ' + first,
				extra: {
					first: first,
					firstProcessedLine: fullLogsFromPlugin.indexOf('\n') !== -1 ? fullLogsFromPlugin.split('\n')[0] : fullLogsFromPlugin,
					lastLogsReceivedInPlugin: lastLogsReceivedInPlugin,
					logFileKey: s3LogFileKey,
					pluginLogsFileKey: pluginLogsFileKey,
					firestoneLogs: firstoneLogsKey,
				},
			});
			console.log('uploaded event to sentry');
		} catch (e) {
			console.error('Exception while uploading logs for troubleshooting', e);
		}
	}
}
