import { Injectable } from '@angular/core';
import { captureEvent } from '@sentry/core';
import { GameEvent, GameEventPlayer } from '../models/game-event';
import { DeckParserService } from './decktracker/deck-parser.service';
import { Events } from './events.service';
import { GameEventsEmitterService } from './game-events-emitter.service';
import { LogsUploaderService } from './logs-uploader.service';
import { PlayersInfoService } from './players-info.service';
import { GameEventsPluginService } from './plugins/game-events-plugin.service';
import { PreferencesService } from './preferences.service';
import { ProcessingQueue } from './processing-queue.service';
import { S3FileUploadService } from './s3-file-upload.service';

declare let amplitude;

@Injectable()
export class GameEvents {
	// The start / end spectating can be set outside of game start / end, so we need to keep it separate
	private spectating: boolean;
	private plugin;
	private hasSentToS3 = false;

	private processingQueue = new ProcessingQueue<string>(
		eventQueue => this.processQueue(eventQueue),
		500,
		'game-events',
	);

	constructor(
		private gameEventsPlugin: GameEventsPluginService,
		private logService: LogsUploaderService,
		private s3: S3FileUploadService,
		private events: Events,
		private playersInfoService: PlayersInfoService,
		private gameEventsEmitter: GameEventsEmitterService,
		private deckParser: DeckParserService,
		private prefs: PreferencesService,
	) {
		this.init();
		// window['fakeEvent'] = () => {
		// 	const event = JSON.parse(
		// 		`{"Type":"BATTLEGROUNDS_PLAYER_BOARD","Value":{"CardId":"TB_BaconShop_HERO_17","Board":[{"CardId":"BOT_606","Entity":7595,"Id":7595,"Tags":[{"Name":50,"Value":9},{"Name":202,"Value":4},{"Name":48,"Value":3},{"Name":43,"Value":0},{"Name":45,"Value":2},{"Name":47,"Value":2},{"Name":49,"Value":5},{"Name":53,"Value":7595},{"Name":200,"Value":17},{"Name":203,"Value":1},{"Name":217,"Value":1},{"Name":263,"Value":0},{"Name":313,"Value":6346},{"Name":466,"Value":3},{"Name":479,"Value":2},{"Name":1037,"Value":1},{"Name":1196,"Value":1},{"Name":1254,"Value":0},{"Name":1284,"Value":49279},{"Name":1429,"Value":58369},{"Name":1440,"Value":2},{"Name":1456,"Value":1},{"Name":271,"Value":0},{"Name":36,"Value":0},{"Name":318,"Value":0},{"Name":1173,"Value":0},{"Name":18,"Value":7092},{"Name":44,"Value":0},{"Name":1068,"Value":0}],"TimeStamp":"2019-12-03T11:53:34.0237146","TsForXml":"35:53:34.023714"},{"CardId":"TB_BaconUps_028","Entity":7597,"Id":7597,"Tags":[{"Name":50,"Value":9},{"Name":202,"Value":4},{"Name":48,"Value":3},{"Name":12,"Value":1},{"Name":43,"Value":0},{"Name":45,"Value":4},{"Name":47,"Value":4},{"Name":49,"Value":5},{"Name":53,"Value":7597},{"Name":200,"Value":17},{"Name":203,"Value":1},{"Name":217,"Value":1},{"Name":263,"Value":0},{"Name":313,"Value":7149},{"Name":466,"Value":3},{"Name":479,"Value":4},{"Name":1037,"Value":1},{"Name":1196,"Value":1},{"Name":1254,"Value":0},{"Name":1284,"Value":58369},{"Name":1421,"Value":1},{"Name":1440,"Value":2},{"Name":1471,"Value":49279},{"Name":1475,"Value":3},{"Name":190,"Value":0},{"Name":271,"Value":0},{"Name":38,"Value":0},{"Name":318,"Value":0},{"Name":1173,"Value":0},{"Name":18,"Value":7094},{"Name":44,"Value":0},{"Name":297,"Value":0},{"Name":36,"Value":0},{"Name":1068,"Value":0}],"TimeStamp":"2019-12-03T11:53:34.0247147","TsForXml":"35:53:34.024714"},{"CardId":"GVG_058","Entity":7606,"Id":7606,"Tags":[{"Name":50,"Value":9},{"Name":202,"Value":4},{"Name":48,"Value":2},{"Name":12,"Value":1},{"Name":43,"Value":0},{"Name":45,"Value":4},{"Name":47,"Value":4},{"Name":49,"Value":5},{"Name":53,"Value":7606},{"Name":194,"Value":1},{"Name":200,"Value":17},{"Name":203,"Value":1},{"Name":263,"Value":0},{"Name":313,"Value":7158},{"Name":466,"Value":2},{"Name":479,"Value":4},{"Name":1037,"Value":1},{"Name":1196,"Value":1},{"Name":1254,"Value":0},{"Name":1284,"Value":2026},{"Name":1421,"Value":1},{"Name":1440,"Value":2},{"Name":1456,"Value":1},{"Name":1471,"Value":2026},{"Name":1475,"Value":3},{"Name":190,"Value":0},{"Name":271,"Value":0},{"Name":318,"Value":0},{"Name":1173,"Value":0},{"Name":18,"Value":7106},{"Name":44,"Value":0},{"Name":38,"Value":0},{"Name":297,"Value":0},{"Name":1068,"Value":0}],"TimeStamp":"2019-12-03T11:53:34.0277148","TsForXml":"35:53:34.027714"},{"CardId":"TB_BaconUps_014","Entity":7616,"Id":7616,"Tags":[{"Name":50,"Value":9},{"Name":202,"Value":4},{"Name":48,"Value":1},{"Name":12,"Value":1},{"Name":43,"Value":0},{"Name":45,"Value":2},{"Name":47,"Value":4},{"Name":49,"Value":5},{"Name":53,"Value":7616},{"Name":203,"Value":3},{"Name":217,"Value":1},{"Name":263,"Value":0},{"Name":313,"Value":7167},{"Name":466,"Value":1},{"Name":479,"Value":4},{"Name":1037,"Value":1},{"Name":1196,"Value":1},{"Name":1254,"Value":0},{"Name":1284,"Value":58143},{"Name":1421,"Value":1},{"Name":1440,"Value":1},{"Name":1471,"Value":38740},{"Name":1475,"Value":3},{"Name":190,"Value":0},{"Name":271,"Value":0},{"Name":36,"Value":0},{"Name":318,"Value":0},{"Name":1173,"Value":0},{"Name":18,"Value":7092},{"Name":44,"Value":0},{"Name":1068,"Value":0}],"TimeStamp":"2019-12-03T11:53:34.0317154","TsForXml":"35:53:34.031715"},{"CardId":"GVG_113","Entity":7618,"Id":7618,"Tags":[{"Name":50,"Value":9},{"Name":202,"Value":4},{"Name":48,"Value":8},{"Name":43,"Value":0},{"Name":45,"Value":9},{"Name":47,"Value":6},{"Name":49,"Value":5},{"Name":53,"Value":7618},{"Name":114,"Value":1},{"Name":200,"Value":17},{"Name":203,"Value":5},{"Name":263,"Value":0},{"Name":313,"Value":7568},{"Name":466,"Value":8},{"Name":479,"Value":6},{"Name":1037,"Value":1},{"Name":1196,"Value":1},{"Name":1254,"Value":0},{"Name":1284,"Value":2081},{"Name":1440,"Value":6},{"Name":1456,"Value":1},{"Name":217,"Value":0},{"Name":271,"Value":0},{"Name":38,"Value":0},{"Name":318,"Value":0},{"Name":1173,"Value":0},{"Name":18,"Value":7097},{"Name":44,"Value":0},{"Name":297,"Value":0},{"Name":1068,"Value":0}],"TimeStamp":"2019-12-03T11:53:34.0327175","TsForXml":"35:53:34.032717"},{"CardId":"TB_BaconUps_035","Entity":7620,"Id":7620,"Tags":[{"Name":50,"Value":9},{"Name":202,"Value":4},{"Name":48,"Value":4},{"Name":12,"Value":1},{"Name":43,"Value":0},{"Name":45,"Value":6},{"Name":47,"Value":8},{"Name":49,"Value":5},{"Name":53,"Value":7620},{"Name":200,"Value":17},{"Name":203,"Value":1},{"Name":217,"Value":1},{"Name":263,"Value":0},{"Name":313,"Value":7546},{"Name":466,"Value":4},{"Name":479,"Value":8},{"Name":1037,"Value":1},{"Name":1196,"Value":1},{"Name":1254,"Value":0},{"Name":1284,"Value":58381},{"Name":1421,"Value":1},{"Name":1440,"Value":3},{"Name":1471,"Value":60048},{"Name":1475,"Value":3},{"Name":271,"Value":0},{"Name":194,"Value":0},{"Name":36,"Value":0},{"Name":318,"Value":0},{"Name":1173,"Value":0},{"Name":18,"Value":7102},{"Name":44,"Value":0},{"Name":1068,"Value":0}],"TimeStamp":"2019-12-03T11:53:34.0337153","TsForXml":"35:53:34.033715"},{"CardId":"TB_BaconUps_094","Entity":7628,"Id":7628,"Tags":[{"Name":50,"Value":9},{"Name":202,"Value":4},{"Name":48,"Value":2},{"Name":12,"Value":1},{"Name":32,"Value":1},{"Name":43,"Value":0},{"Name":45,"Value":4},{"Name":47,"Value":2},{"Name":49,"Value":5},{"Name":53,"Value":7628},{"Name":200,"Value":17},{"Name":203,"Value":1},{"Name":263,"Value":0},{"Name":313,"Value":7176},{"Name":466,"Value":2},{"Name":479,"Value":2},{"Name":1037,"Value":1},{"Name":1196,"Value":1},{"Name":1254,"Value":0},{"Name":1284,"Value":60056},{"Name":1421,"Value":1},{"Name":1440,"Value":1},{"Name":1471,"Value":60055},{"Name":1475,"Value":3},{"Name":217,"Value":0},{"Name":271,"Value":0},{"Name":318,"Value":0},{"Name":1173,"Value":0},{"Name":18,"Value":144},{"Name":44,"Value":0},{"Name":194,"Value":0},{"Name":1068,"Value":0}],"TimeStamp":"2019-12-03T11:53:34.0367153","TsForXml":"35:53:34.036715"}]}}`,
		// 	);
		// 	console.log('sending', event);
		// 	this.dispatchGameEvent(event);
		// 	// this.processingQueue.enqueue(event);
		// };
	}

	async init() {
		console.log('init game events monitor');
		this.plugin = await this.gameEventsPlugin.get();
		if (this.plugin) {
			this.plugin.onGlobalEvent.addListener((first: string, second: string) => {
				console.log('[game-events] received global event', first, second);
				if (
					!this.hasSentToS3 &&
					(first.toLowerCase().indexOf('exception') !== -1 || first.toLowerCase().indexOf('error') !== -1)
				) {
					console.info('sending logs to S3', first, second);
					// Avoid race conditions
					setTimeout(() => this.uploadLogsAndSendException(first, second), Math.random() * 10000);
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
		this.events.on(Events.GLOBAL_STATS_UPDATED).subscribe(async event => {
			const prefs = await this.prefs.getPreferences();
			// Don't send the global stats in this case
			if (process.env.NODE_ENV !== 'production' && prefs.resetAchievementsOnAppStart) {
				return;
			}
			console.log('[game-events] broadcasting new GLOBAL_STATS_UPDATED event');
			this.gameEventsEmitter.allEvents.next(
				Object.assign(new GameEvent(), {
					type: GameEvent.GLOBAL_STATS_UPDATED,
					additionalData: { stats: event.data[0] },
				} as GameEvent),
			);
		});
	}

	private async processQueue(eventQueue: readonly string[]): Promise<readonly string[]> {
		if (eventQueue.some(data => data.indexOf('CREATE_GAME') !== -1)) {
			console.log('[game-events] preparing log lines that include game creation to feed to the plugin');
		}
		// console.log('process queue', eventQueue);
		await this.processLogs(eventQueue);
		return [];
	}

	private async processLogs(eventQueue: readonly string[]): Promise<void> {
		return new Promise<void>(resolve => {
			// console.log('calling real time processing', eventQueue);
			this.plugin.realtimeLogProcessing(eventQueue, () => {
				resolve();
			});
		});
	}

	public async dispatchGameEvent(gameEvent) {
		// console.log('game event', gameEvent.Type, gameEvent);
		switch (gameEvent.Type) {
			case 'NEW_GAME':
				console.log(gameEvent.Type + ' event');
				this.hasSentToS3 = false;
				const event = Object.assign(new GameEvent(), { type: GameEvent.GAME_START } as GameEvent);
				this.gameEventsEmitter.onGameStart.next(event);
				this.gameEventsEmitter.allEvents.next(event);
				break;
			case 'MATCH_METADATA':
				console.log(gameEvent.Type + ' event', gameEvent.Value);
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
				console.log(gameEvent.Type + ' event');
				// First try without waiting for a callback, which is most of the cases
				const playerInfo = await this.playersInfoService.getPlayerInfo();
				// console.log('LOCAL_PLAYER info', playerInfo);
				if (!playerInfo) {
					console.warn('[game-events] no local player info returned by mmindvision');
					amplitude.getInstance().logEvent('error-logged', {
						'error-category': 'memory-reading',
						'error-id': 'no-player-info',
					});
				}
				const localPlayer: GameEventPlayer = Object.assign({}, gameEvent.Value, {
					standard: playerInfo?.standard,
					wild: playerInfo?.wild,
					cardBackId: playerInfo ? playerInfo.cardBackId : undefined,
					deck: this.deckParser.currentDeck,
				} as GameEventPlayer);
				console.log('sending LOCAL_PLAYER info', localPlayer);
				this.gameEventsEmitter.allEvents.next(
					Object.assign(new GameEvent(), {
						type: GameEvent.LOCAL_PLAYER,
						localPlayer: localPlayer,
					} as GameEvent),
				);
				break;
			case 'OPPONENT_PLAYER':
				console.log(gameEvent.Type + ' event');
				const opponentInfo = await this.playersInfoService.getOpponentInfo();
				// console.log('OPPONENT_PLAYER info', opponentInfo);
				if (!opponentInfo) {
					console.warn('[game-events] no local player info returned by mmindvision');
					amplitude.getInstance().logEvent('error-logged', {
						'error-category': 'memory-reading',
						'error-id': 'no-player-info',
					});
				}
				const opponentPlayer: GameEventPlayer = Object.assign({}, gameEvent.Value.OpponentPlayer, {
					standard: opponentInfo?.standard,
					wild: opponentInfo?.wild,
					cardBackId: opponentInfo?.cardBackId,
				} as GameEventPlayer);
				console.log('sending OPPONENT_PLAYER info', opponentPlayer);
				this.gameEventsEmitter.allEvents.next(
					Object.assign(new GameEvent(), {
						type: GameEvent.OPPONENT,
						opponentPlayer: opponentPlayer,
						additionalData: {
							gameState: gameEvent.Value.GameState,
						},
					} as GameEvent),
				);
				break;
			case 'INITIAL_CARD_IN_DECK':
				this.gameEventsEmitter.allEvents.next(GameEvent.build(GameEvent.INITIAL_CARD_IN_DECK, gameEvent));
				break;
			case 'HERO_POWER_USED':
				this.gameEventsEmitter.allEvents.next(GameEvent.build(GameEvent.HERO_POWER_USED, gameEvent));
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
			case 'DECKLIST_UPDATE':
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.DECKLIST_UPDATE, gameEvent, {
						deckId: gameEvent.Value.AdditionalProps.DeckId,
					}),
				);
				break;
			case 'RUMBLE_RUN_STEP':
				// console.log(gameEvent.Type + ' event', gameEvent.Value - 1);
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
				// console.log(gameEvent.Type + ' event', gameEvent.Value - 1);
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
				// console.log(gameEvent.Type + ' event', gameEvent.Value - 1);
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
				// console.log(gameEvent.Type + ' event', gameEvent.Value.CardId);
				const props = gameEvent.Value.AdditionalProps
					? {
							targetEntityId: gameEvent.Value.AdditionalProps.TargetEntityId,
							targetCardId: gameEvent.Value.AdditionalProps.TargetCardId,
					  }
					: {};
				this.gameEventsEmitter.allEvents.next(GameEvent.build(GameEvent.CARD_PLAYED, gameEvent, props));
				break;
			case 'DISCARD_CARD':
				// console.log(gameEvent.Type + ' event', gameEvent.Value.CardId);
				this.gameEventsEmitter.allEvents.next(GameEvent.build(GameEvent.DISCARD_CARD, gameEvent));
				break;
			case 'MINION_DIED':
				// console.log(gameEvent.Type + ' event', gameEvent.Value.CardId);
				this.gameEventsEmitter.allEvents.next(GameEvent.build(GameEvent.MINION_DIED, gameEvent));
				break;
			case 'RECRUIT_CARD':
				// console.log(gameEvent.Type + ' event', gameEvent.Value.CardId);
				this.gameEventsEmitter.allEvents.next(GameEvent.build(GameEvent.RECRUIT_CARD, gameEvent));
				break;
			case 'MINION_BACK_ON_BOARD':
				// console.log(gameEvent.Type + ' event', gameEvent.Value.CardId);
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.MINION_BACK_ON_BOARD, gameEvent, {
						creatorCardId: gameEvent.Value.AdditionalProps.CreatorCardId,
					}),
				);
				break;
			case 'SECRET_PLAYED_FROM_DECK':
				// console.log(gameEvent.Type + ' event', gameEvent.Value.CardId);
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.SECRET_PLAYED_FROM_DECK, gameEvent, {
						playerClass: gameEvent.Value.AdditionalProps.PlayerClass
							? gameEvent.Value.AdditionalProps.PlayerClass.toLowerCase()
							: null,
						creatorCardId: gameEvent.Value.AdditionalProps.CreatorCardId,
					}),
				);
				break;
			case 'SECRET_CREATED_IN_GAME':
				// console.log(gameEvent.Type + ' event', gameEvent.Value.CardId);
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.SECRET_CREATED_IN_GAME, gameEvent, {
						playerClass: gameEvent.Value.AdditionalProps.PlayerClass
							? gameEvent.Value.AdditionalProps.PlayerClass.toLowerCase()
							: null,
					}),
				);
				break;
			case 'QUEST_PLAYED_FROM_DECK':
				// console.log(gameEvent.Type + ' event', gameEvent.Value.CardId);
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.QUEST_PLAYED_FROM_DECK, gameEvent, {
						playerClass: gameEvent.Value.AdditionalProps.PlayerClass
							? gameEvent.Value.AdditionalProps.PlayerClass.toLowerCase()
							: null,
						creatorCardId: gameEvent.Value.AdditionalProps.CreatorCardId,
					}),
				);
				break;
			case 'QUEST_CREATED_IN_GAME':
				// console.log(gameEvent.Type + ' event', gameEvent.Value.CardId);
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.QUEST_PLAYED_FROM_DECK, gameEvent, {
						playerClass: gameEvent.Value.AdditionalProps.PlayerClass
							? gameEvent.Value.AdditionalProps.PlayerClass.toLowerCase()
							: null,
					}),
				);
				break;
			case 'MINION_SUMMONED':
				// console.log(gameEvent.Type + ' event', gameEvent.Value.CardId);
				const summonAdditionProps = gameEvent.Value.AdditionalProps
					? {
							creatorCardId: gameEvent.Value.AdditionalProps.CreatorCardId,
					  }
					: null;
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.MINION_SUMMONED, gameEvent, summonAdditionProps),
				);
				break;
			case 'HERO_POWER_CHANGED':
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.HERO_POWER_CHANGED, gameEvent, {
						creatorCardId: gameEvent.Value.AdditionalProps.CreatorCardId,
					}),
				);
				break;
			case 'CARD_REVEALED':
				// console.log(gameEvent.Type + ' event', gameEvent.Value.CardId);
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.CARD_REVEALED, gameEvent, {
						creatorCardId: gameEvent.Value.AdditionalProps.CreatorCardId,
					}),
				);
				break;
			case 'CARD_CHANGED_ON_BOARD':
				// console.log(gameEvent.Type + ' event', gameEvent.Value.CardId);
				const summonAdditionProps2 = gameEvent.Value.AdditionalProps
					? {
							creatorCardId: gameEvent.Value.AdditionalProps.CreatorCardId,
					  }
					: null;
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.CARD_CHANGED_ON_BOARD, gameEvent, summonAdditionProps2),
				);
				break;
			case 'RECEIVE_CARD_IN_HAND':
				// console.log(gameEvent.Type + ' event', gameEvent.Value.CardId);
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.RECEIVE_CARD_IN_HAND, gameEvent, {
						// Not always present?
						creatorCardId: gameEvent.Value.AdditionalProps && gameEvent.Value.AdditionalProps.CreatorCardId,
						isPremium: gameEvent.Value.AdditionalProps && gameEvent.Value.AdditionalProps.IsPremium,
					}),
				);
				break;
			case 'CARD_CREATOR_CHANGED':
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.CARD_CREATOR_CHANGED, gameEvent, {
						creatorCardId: gameEvent.Value.AdditionalProps.CreatorCardId,
					}),
				);
				break;
			case 'END_OF_ECHO_IN_HAND':
				this.gameEventsEmitter.allEvents.next(GameEvent.build(GameEvent.END_OF_ECHO_IN_HAND, gameEvent));
				break;
			case 'CREATE_CARD_IN_DECK':
				// console.log(gameEvent.Type + ' event', gameEvent.Value.CardId, gameEvent.Value.EntityId, gameEvent);
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.CREATE_CARD_IN_DECK, gameEvent, {
						creatorCardId: gameEvent.Value.AdditionalProps && gameEvent.Value.AdditionalProps.CreatorCardId,
					}),
				);
				break;
			case 'SECRET_PLAYED':
				// console.log(gameEvent.Type + ' event', gameEvent.Value.CardId);
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.SECRET_PLAYED, gameEvent, {
						playerClass:
							// Should always be the case, except in some older tests
							gameEvent.Value.AdditionalProps && gameEvent.Value.AdditionalProps.PlayerClass
								? gameEvent.Value.AdditionalProps.PlayerClass.toLowerCase()
								: null,
					}),
				);
				break;
			case 'SECRET_TRIGGERED':
				// console.log(gameEvent.Type + ' event', gameEvent.Value.CardId);
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(
						GameEvent.SECRET_TRIGGERED,
						gameEvent,
						gameEvent.Value.AdditionalProps
							? {
									// Reuse the same props name as the ATTACKING events to make it easier to share code
									attackerCardId: gameEvent.Value.AdditionalProps.ProposedAttackerCardId,
									attackerEntityId: gameEvent.Value.AdditionalProps.ProposedAttackerEntityId,
									attackerControllerId: gameEvent.Value.AdditionalProps.ProposedAttackerControllerId,
									defenderCardId: gameEvent.Value.AdditionalProps.ProposedDefenderCardId,
									defenderEntityId: gameEvent.Value.AdditionalProps.ProposedDefenderEntityId,
									defenderControllerId: gameEvent.Value.AdditionalProps.ProposedDefenderControllerId,
							  }
							: null,
					),
				);
				break;
			case 'SECRET_DESTROYED':
				// console.log(gameEvent.Type + ' event', gameEvent.Value.CardId);
				this.gameEventsEmitter.allEvents.next(GameEvent.build(GameEvent.SECRET_DESTROYED, gameEvent));
				break;
			case 'QUEST_PLAYED':
				// console.log(gameEvent.Type + ' event', gameEvent.Value.CardId);
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.QUEST_PLAYED, gameEvent, {
						playerClass:
							// Should always be the case, except in some older tests
							gameEvent.Value.AdditionalProps && gameEvent.Value.AdditionalProps.PlayerClass
								? gameEvent.Value.AdditionalProps.PlayerClass.toLowerCase()
								: null,
					}),
				);
				break;
			case 'QUEST_DESTROYED':
				// console.log(gameEvent.Type + ' event', gameEvent.Value.CardId);
				this.gameEventsEmitter.allEvents.next(GameEvent.build(GameEvent.QUEST_DESTROYED, gameEvent));
				break;
			case 'DEATHRATTLE_TRIGGERED':
				// console.log(gameEvent.Type + ' event', gameEvent.Value.CardId);
				this.gameEventsEmitter.allEvents.next(GameEvent.build(GameEvent.DEATHRATTLE_TRIGGERED, gameEvent));
				break;
			case 'CARD_DRAW_FROM_DECK':
				// console.log(gameEvent.Type + ' event', gameEvent.Value.CardId, gameEvent.Value.EntityId);
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.CARD_DRAW_FROM_DECK, gameEvent, {
						isPremium: gameEvent.Value.AdditionalProps && gameEvent.Value.AdditionalProps.IsPremium,
						creatorCardId: gameEvent.Value.AdditionalProps?.CreatorCardId,
					}),
				);
				break;
			case 'GAME_RUNNING':
				console.log(gameEvent.Type + ' event', gameEvent.Value);
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.GAME_RUNNING, gameEvent, {
						playerDeckCount: gameEvent.Value.AdditionalProps.PlayerDeckCount,
						opponentDeckCount: gameEvent.Value.AdditionalProps.OpponentDeckCount,
					}),
				);
				break;
			case 'CARD_BACK_TO_DECK':
				// console.log(gameEvent.Type + ' event', gameEvent.Value.CardId, gameEvent.Value.EntityId);
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.CARD_BACK_TO_DECK, gameEvent, {
						initialZone: gameEvent.Value.AdditionalProps.InitialZone,
					}),
				);
				break;
			case 'CARD_REMOVED_FROM_DECK':
				// console.log(gameEvent.Type + ' event', gameEvent.Value.CardId, gameEvent.Value.EntityId);
				this.gameEventsEmitter.allEvents.next(GameEvent.build(GameEvent.CARD_REMOVED_FROM_DECK, gameEvent));
				break;
			case 'CARD_REMOVED_FROM_HAND':
				// console.log(gameEvent.Type + ' event', gameEvent.Value.CardId, gameEvent.Value.EntityId);
				this.gameEventsEmitter.allEvents.next(GameEvent.build(GameEvent.CARD_REMOVED_FROM_HAND, gameEvent));
				break;
			case 'CARD_REMOVED_FROM_BOARD':
				// console.log(gameEvent.Type + ' event', gameEvent.Value.CardId, gameEvent.Value.EntityId);
				this.gameEventsEmitter.allEvents.next(GameEvent.build(GameEvent.CARD_REMOVED_FROM_BOARD, gameEvent));
				break;
			case 'BURNED_CARD':
				// console.log(gameEvent.Type + ' event', gameEvent.Value.CardId, gameEvent.Value.EntityId);
				this.gameEventsEmitter.allEvents.next(GameEvent.build(GameEvent.BURNED_CARD, gameEvent));
				break;
			case 'MULLIGAN_INITIAL_OPTION':
				this.gameEventsEmitter.allEvents.next(GameEvent.build(GameEvent.MULLIGAN_INITIAL_OPTION, gameEvent));
				break;
			case 'CARD_ON_BOARD_AT_GAME_START':
				// console.log(gameEvent.Type + ' event', gameEvent.Value.CardId, gameEvent.Value.EntityId);
				const additionalProps = gameEvent.Value.AdditionalProps
					? {
							health: gameEvent.Value.AdditionalProps.Health,
					  }
					: null;
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.CARD_ON_BOARD_AT_GAME_START, gameEvent, additionalProps),
				);
				break;
			case 'CARD_STOLEN':
				// console.log(gameEvent.Type + ' event', gameEvent.Value.CardId, gameEvent.Value.EntityId);
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.CARD_STOLEN, gameEvent, {
						newControllerId: gameEvent.Value.AdditionalProps.newControllerId,
					}),
				);
				break;
			case 'FIRST_PLAYER':
				this.gameEventsEmitter.allEvents.next(GameEvent.build(GameEvent.FIRST_PLAYER, gameEvent));
				break;
			case 'PASSIVE_BUFF':
				// console.log(gameEvent.Type + ' event', gameEvent.Value.CardId);
				this.gameEventsEmitter.allEvents.next(GameEvent.build(GameEvent.PASSIVE_BUFF, gameEvent));
				break;
			case 'MINION_ON_BOARD_ATTACK_UPDATED':
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.MINION_ON_BOARD_ATTACK_UPDATED, gameEvent, {
						initialAttack: gameEvent.Value.AdditionalProps
							? gameEvent.Value.AdditionalProps.InitialAttack
							: undefined,
						newAttack: gameEvent.Value.AdditionalProps
							? gameEvent.Value.AdditionalProps.NewAttack
							: undefined,
					}),
				);
				break;
			case 'CARD_CHANGED_IN_HAND':
				this.gameEventsEmitter.allEvents.next(GameEvent.build(GameEvent.CARD_CHANGED_IN_HAND, gameEvent));
				break;
			case 'CARD_CHANGED_IN_DECK':
				this.gameEventsEmitter.allEvents.next(GameEvent.build(GameEvent.CARD_CHANGED_IN_DECK, gameEvent));
				break;
			case 'ARMOR_CHANGED':
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.ARMOR_CHANGED, gameEvent, {
						armorChange: gameEvent.Value.ArmorChange,
					}),
				);
				break;
			case 'HEALTH_DEF_CHANGED':
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.HEALTH_DEF_CHANGED, gameEvent, {
						newHealth: gameEvent.Value.AdditionalProps.NewHealth,
					}),
				);
				break;
			case 'NUM_CARDS_PLAYED_THIS_TURN':
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.NUM_CARDS_PLAYED_THIS_TURN, gameEvent, {
						cardsPlayed: gameEvent.Value.AdditionalProps.NumCardsPlayed,
					}),
				);
				break;
			case 'ATTACKING_HERO':
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.ATTACKING_HERO, gameEvent, {
						attackerCardId: gameEvent.Value.AdditionalProps.AttackerCardId,
						attackerEntityId: gameEvent.Value.AdditionalProps.AttackerEntityId,
						attackerControllerId: gameEvent.Value.AdditionalProps.AttackerControllerId,
						defenderCardId: gameEvent.Value.AdditionalProps.DefenderCardId,
						defenderEntityId: gameEvent.Value.AdditionalProps.DefenderEntityId,
						defenderControllerId: gameEvent.Value.AdditionalProps.DefenderControllerId,
					}),
				);
				break;
			case 'ATTACKING_MINION':
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.ATTACKING_MINION, gameEvent, {
						attackerCardId: gameEvent.Value.AdditionalProps.AttackerCardId,
						attackerEntityId: gameEvent.Value.AdditionalProps.AttackerEntityId,
						attackerControllerId: gameEvent.Value.AdditionalProps.AttackerControllerId,
						attackerTags: gameEvent.Value.AdditionalProps.AttackerTags,
						defenderCardId: gameEvent.Value.AdditionalProps.DefenderCardId,
						defenderEntityId: gameEvent.Value.AdditionalProps.DefenderEntityId,
						defenderControllerId: gameEvent.Value.AdditionalProps.DefenderControllerId,
						defenderTags: gameEvent.Value.AdditionalProps.DefenderTags,
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
							entityId: gameEvent.Value.EntityId,
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
						gameState: gameEvent.Value.GameState,
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
							sourceEntityId: gameEvent.Value.SourceEntityId,
							sourceControllerId: gameEvent.Value.SourceControllerId,
							targets: gameEvent.Value.Targets,
						},
					} as GameEvent),
				);
				break;
			case 'TURN_START':
				// console.log(gameEvent.Type + ' event', gameEvent.Value);
				this.gameEventsEmitter.allEvents.next(
					Object.assign(new GameEvent(), {
						type: GameEvent.TURN_START,
						gameState: gameEvent.Value.GameState,
						localPlayer: gameEvent.Value.LocalPlayer,
						opponentPlayer: gameEvent.Value.OpponentPlayer,
						additionalData: {
							// Legacy, to avoid regenerating all the tests
							turnNumber: gameEvent.Value.Turn || gameEvent.Value,
						},
					} as GameEvent),
				);
				break;
			case 'LOCAL_PLAYER_LEADERBOARD_PLACE_CHANGED':
				// console.log(gameEvent.Type + ' event', gameEvent.Value.AdditionalProps.NewPlace);
				this.gameEventsEmitter.allEvents.next(
					Object.assign(new GameEvent(), {
						type: GameEvent.LOCAL_PLAYER_LEADERBOARD_PLACE_CHANGED,
						additionalData: {
							newPlace: gameEvent.Value.AdditionalProps.NewPlace,
						},
					} as GameEvent),
				);
				break;
			case 'BATTLEGROUNDS_HERO_SELECTION':
				// console.log(gameEvent.Type + ' event', gameEvent.Value.AdditionalProps.NewPlace);
				this.gameEventsEmitter.allEvents.next(
					Object.assign(new GameEvent(), {
						type: GameEvent.BATTLEGROUNDS_HERO_SELECTION,
						additionalData: {
							heroCardIds: gameEvent.Value.CardIds,
						},
					} as GameEvent),
				);
				break;
			case 'BATTLEGROUNDS_PLAYER_BOARD':
				// console.log(gameEvent.Type + ' event', gameEvent.Value.AdditionalProps.NewPlace);
				this.gameEventsEmitter.allEvents.next(
					Object.assign(new GameEvent(), {
						type: GameEvent.BATTLEGROUNDS_PLAYER_BOARD,
						additionalData: {
							// turn =
							cardId: gameEvent.Value.CardId,
							board: gameEvent.Value.Board, // as is
							hero: gameEvent.Value.Hero, // as is
						},
					} as GameEvent),
				);
				break;
			case 'BATTLEGROUNDS_LEADERBOARD_PLACE':
				// console.log(gameEvent.Type + ' event', gameEvent.Value.AdditionalProps.NewPlace);
				this.gameEventsEmitter.allEvents.next(
					Object.assign(new GameEvent(), {
						type: GameEvent.BATTLEGROUNDS_LEADERBOARD_PLACE,
						additionalData: {
							// turn =
							cardId: gameEvent.Value.CardId,
							leaderboardPlace: gameEvent.Value.LeaderboardPlace,
						},
					} as GameEvent),
				);
				break;
			case 'BATTLEGROUNDS_TAVERN_UPGRADE':
				// console.log(gameEvent.Type + ' event', gameEvent.Value.AdditionalProps.NewPlace);
				this.gameEventsEmitter.allEvents.next(
					Object.assign(new GameEvent(), {
						type: GameEvent.BATTLEGROUNDS_TAVERN_UPGRADE,
						additionalData: {
							// turn =
							cardId: gameEvent.Value.CardId,
							tavernLevel: gameEvent.Value.TavernLevel,
						},
					} as GameEvent),
				);
				break;
			case 'WINNER':
				console.log(gameEvent.Type + ' event', gameEvent.Value.Winner);
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
				console.log(gameEvent.Type + ' event');
				this.gameEventsEmitter.allEvents.next(
					Object.assign(new GameEvent(), {
						type: GameEvent.TIE,
					} as GameEvent),
				);
				break;
			case 'GAME_END':
				console.log(gameEvent.Type + ' event');
				this.gameEventsEmitter.allEvents.next(
					Object.assign(new GameEvent(), {
						type: GameEvent.GAME_END,
						localPlayer: gameEvent.Value.LocalPlayer,
						opponentPlayer: gameEvent.Value.OpponentPlayer,
						additionalData: {
							game: gameEvent.Value.Game,
							report: gameEvent.Value.GameStateReport,
							replayXml: gameEvent.Value.ReplayXml,
						},
					} as GameEvent),
				);
				break;
			default:
				console.log('unsupported game event', gameEvent);
		}
	}

	public receiveLogLine(data: string) {
		// console.log('received log line', data);
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
			// console.log('spectating, doing nothing');
			return;
		}

		if (data.indexOf('CREATE_GAME') !== -1) {
			console.log('[game-events] received CREATE_GAME log', data);
		}

		this.processingQueue.enqueue(data);
	}

	private existingLogLines: string[] = [];

	// Handles reading a log file mid-game, i.e. this data is already
	// present in the log file when we're trying to read it
	public receiveExistingLogLine(existingLine: string) {
		// console.log('received existing', existingLine);
		if (existingLine.indexOf('Begin Spectating') !== -1) {
			console.log('[game-events] [existing] begin spectating', existingLine);
			this.spectating = true;
		}
		if (existingLine.indexOf('End Spectator Mode') !== -1) {
			console.log('[game-events] [existing] end spectating', existingLine);
			this.spectating = false;
		}
		if (existingLine === 'end_of_existing_data' && this.existingLogLines.length > 0) {
			// There is no automatic reconnect when spectating, so we can always safely say
			// that when we finish catching up with the actual contents of the file, we are
			// not spectating
			this.spectating = false;
			const lastLineTimestamp = this.extractLastTimestamp(this.existingLogLines);
			console.log(
				'[game-events] [existing] last line timestamp',
				lastLineTimestamp,
				Date.now(),
				this.existingLogLines[this.existingLogLines.length - 1],
			);
			// Sometimes there is a one hour offset that breaks everything, and I couldn't find where it came from
			// See the following log lines that produced the issue
			// 2019-12-11 12:46:06,017 (INFO) </Files/vendor.js> (:1620) - "[game-events] [existing] received CREATE_GAME log" | "D 12:46:05.5537105 GameState.DebugPrintPower() - CREATE_GAME" |
			// 2019-12-11 12:46:06,026 (INFO) </Files/vendor.js> (:1620) - "[game-events] [existing] last line timestamp" | 1576075565000 | 1576079166026 | "D 12:46:05.9928156 GameState.DebugPrintGame() - PlayerID=2, PlayerName=UNKNOWN HUMAN PLAYER" |
			// 2019-12-11 12:46:06,026 (INFO) </Files/vendor.js> (:1620) - "[game-events] [existing] last line is too old, not doing anything" | "D 12:46:05.9928156 GameState.DebugPrintGame() - PlayerID=2, PlayerName=UNKNOWN HUMAN PLAYER" |
			// 2019-12-11 12:46:06,223 (INFO) </Files/vendor.js> (:1620) - "[game-events] received CREATE_GAME log" | "D 12:46:06.1966960 PowerTaskList.DebugPrintPower() -     CREATE_GAME" |
			// DISCARDED COMMENT: However (20/01/2020), having a 1-hour timeout on this is too long, and I'd rather have some missing reconnects
			// than some issues after a long reconnect where part of the tracker remains visible on home screen
			if (lastLineTimestamp && Date.now() - lastLineTimestamp > (60 + 5) * 60 * 1000) {
				console.log(
					'[game-events] [existing] last line is too old, not doing anything',
					this.existingLogLines[this.existingLogLines.length - 1],
				);
				this.existingLogLines = [];
				return;
			}
			console.log(
				'[game-events] [existing] caught up, enqueueing all events',
				this.existingLogLines.length,
				this.spectating,
			);
			if (this.existingLogLines.length > 0) {
				this.processingQueue.enqueueAll(['START_CATCHING_UP', ...this.existingLogLines, 'END_CATCHING_UP']);
			}
			this.existingLogLines = [];
			return;
		}

		if (this.spectating) {
			// For now we're not interested in spectating events, but that will come out later
			return;
		}

		if (existingLine.indexOf('CREATE_GAME') !== -1 && existingLine.indexOf('GameState') !== -1) {
			console.log('[game-events] [existing] received CREATE_GAME log', existingLine);
			this.existingLogLines = [];
		}
		if (existingLine.indexOf('GOLD_REWARD_STATE') !== -1) {
			// Complete game, we don't handle it
			this.existingLogLines = [];
		}
		this.existingLogLines.push(existingLine);
	}

	private extractLastTimestamp(lines: string[]): number | undefined {
		for (let i = lines.length - 1; i >= 0; i--) {
			const timestamp = this.extractTimestamp(lines[i]);
			if (timestamp) {
				return timestamp;
			}
		}
		return undefined;
	}

	private lineRegex = new RegExp('D (\\d*):(\\d*):(\\d*).(\\d*).*');

	private extractTimestamp(line: string): number | undefined {
		const match = this.lineRegex.exec(line);
		if (match) {
			const now = new Date();
			const day = now.getHours() < parseInt(match[1]) ? now.getDate() - 1 : now.getDate();
			const dateWithMillis = new Date(
				now.getFullYear(),
				now.getMonth(),
				day,
				parseInt(match[1]),
				parseInt(match[2]),
				parseInt(match[3]),
			);
			return dateWithMillis.getTime();
		}
	}

	private async uploadLogsAndSendException(first, second) {
		if (this.hasSentToS3) {
			return;
		}

		this.hasSentToS3 = true;
		try {
			const s3LogFileKey = await this.logService.uploadGameLogs();
			const fullLogsFromPlugin = second.indexOf('/#/') !== -1 ? second.split('/#/')[0] : second;
			const pluginLogsFileKey = await this.s3.postLogs(fullLogsFromPlugin);
			// console.log('uploaded fullLogsFromPlugin to S3', pluginLogsFileKey);
			const lastLogsReceivedInPlugin = second.indexOf('/#/') !== -1 ? second.split('/#/')[1] : second;
			const firstoneLogsKey = await this.logService.uploadAppLogs();
			captureEvent({
				message: 'Exception while running plugin: ' + first,
				extra: {
					first: first,
					firstProcessedLine:
						fullLogsFromPlugin.indexOf('\n') !== -1
							? fullLogsFromPlugin.split('\n')[0]
							: fullLogsFromPlugin,
					lastLogsReceivedInPlugin: lastLogsReceivedInPlugin,
					logFileKey: s3LogFileKey,
					pluginLogsFileKey: pluginLogsFileKey,
					firestoneLogs: firstoneLogsKey,
				},
			});
			// console.log('uploaded event to sentry');
		} catch (e) {
			console.error('Exception while uploading logs for troubleshooting', e);
		}
	}
}
