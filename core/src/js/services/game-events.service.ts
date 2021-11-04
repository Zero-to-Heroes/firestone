import { Injectable } from '@angular/core';
import { GameEvent, GameEventPlayer } from '../models/game-event';
import { CopiedFromEntityIdGameEvent } from '../models/mainwindow/game-events/copied-from-entity-id-game-event';
import { DamageGameEvent } from '../models/mainwindow/game-events/damage-game-event';
import { GameSettingsEvent } from '../models/mainwindow/game-events/game-settings-event';
import { MinionsDiedEvent } from '../models/mainwindow/game-events/minions-died-event';
import { MemoryUpdate } from '../models/memory/memory-update';
import { DeckParserService } from './decktracker/deck-parser.service';
import { Events } from './events.service';
import { GameEventsEmitterService } from './game-events-emitter.service';
import { MainWindowStoreService } from './mainwindow/store/main-window-store.service';
import { OverwolfService } from './overwolf.service';
import { PlayersInfoService } from './players-info.service';
import { GameEventsPluginService } from './plugins/game-events-plugin.service';
import { MemoryInspectionService } from './plugins/memory-inspection.service';
import { PreferencesService } from './preferences.service';
import { ProcessingQueue } from './processing-queue.service';
import { freeRegexp } from './utils';

declare let amplitude;

@Injectable()
export class GameEvents {
	private plugin;

	private processingQueue = new ProcessingQueue<string>(
		(eventQueue) => this.processQueue(eventQueue),
		500,
		'game-events',
	);

	constructor(
		private gameEventsPlugin: GameEventsPluginService,
		private events: Events,
		private playersInfoService: PlayersInfoService,
		private gameEventsEmitter: GameEventsEmitterService,
		private deckParser: DeckParserService,
		private prefs: PreferencesService,
		private ow: OverwolfService,
		private store: MainWindowStoreService,
		private memoryService: MemoryInspectionService,
	) {
		this.init();
	}

	async init() {
		console.log('init game events monitor');
		this.plugin = await this.gameEventsPlugin.get();
		if (this.plugin) {
			this.plugin.onGlobalEvent.addListener((first: string, second: string) => {
				console.log('[game-events] received global event', first, second);
				// if (
				// 	!this.hasSentToS3 &&
				// 	(first.toLowerCase().indexOf('exception') !== -1 || first.toLowerCase().indexOf('error') !== -1)
				// ) {
				// 	console.info('sending logs to S3', first, second);
				// 	// Avoid race conditions
				// 	setTimeout(() => this.uploadLogsAndSendException(first, second), Math.random() * 10000);
				// }
			});
			this.plugin.onGameEvent.addListener((gameEvent) => {
				const events: any | readonly any[] = JSON.parse(gameEvent);
				if (!!(events as readonly any[]).length) {
					for (const event of events as readonly any[]) {
						this.dispatchGameEvent(event);
					}
				} else {
					this.dispatchGameEvent(events);
				}
			});
			this.plugin.initRealtimeLogConversion(() => {
				console.log('[game-events] real-time log processing ready to go');
			});
		}
		// TODO: progressively deprecate this, as the GEP doesn't fire events as well as
		// mind vision
		// this.events.on(Events.SCENE_CHANGED).subscribe((event) =>
		// 	this.gameEventsEmitter.allEvents.next(
		// 		Object.assign(new GameEvent(), {
		// 			type: GameEvent.SCENE_CHANGED,
		// 			additionalData: { scene: event.data[0] },
		// 		} as GameEvent),
		// 	),
		// );
		this.events.on(Events.MEMORY_UPDATE).subscribe((event) => {
			const changes: MemoryUpdate = event.data[0];
			if (changes.CurrentScene) {
				try {
					this.gameEventsEmitter.allEvents.next(
						Object.assign(new GameEvent(), {
							type: GameEvent.SCENE_CHANGED_MINDVISION,
							additionalData: { scene: changes.CurrentScene },
						} as GameEvent),
					);
				} catch (e) {
					console.warn('missing scene enum', changes.CurrentScene);
				}
			}
		});
		this.events.on(Events.GAME_STATS_UPDATED).subscribe((event) => {
			this.gameEventsEmitter.allEvents.next(
				Object.assign(new GameEvent(), {
					type: GameEvent.GAME_STATS_UPDATED,
					additionalData: { gameStats: event.data[0] },
				} as GameEvent),
			);
		});
		this.events.on(Events.GLOBAL_STATS_UPDATED).subscribe(async (event) => {
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
		// this.ow?.addGameInfoUpdatedListener(async (res: any) => {
		//
		// 	if (this.ow.exitGame(res)) {
		// 		this.setSpectating(false);
		// 	}
		// });
	}

	private async processQueue(eventQueue: readonly string[]): Promise<readonly string[]> {
		if (eventQueue.some((data) => data.indexOf('CREATE_GAME') !== -1)) {
			console.log('[game-events] preparing log lines that include game creation to feed to the plugin');
		}
		await this.processLogs(eventQueue);
		return [];
	}

	private async processLogs(eventQueue: readonly string[]): Promise<void> {
		return new Promise<void>((resolve) => {
			this.plugin.realtimeLogProcessing(eventQueue, () => {
				resolve();
			});
		});
	}

	public async dispatchGameEvent(gameEvent) {
		if (!gameEvent) {
			return;
		}
		// if (gameEvent.Type !== 'GAME_STATE_UPDATE') {
		// 	console.debug('[debug] game event', gameEvent.Type, gameEvent);
		// }
		switch (gameEvent.Type) {
			case 'NEW_GAME':
				console.log(gameEvent.Type + ' event');
				// this.hasSentToS3 = false;
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.GAME_START,
					additionalData: {
						spectating: gameEvent.Value?.Spectating,
					},
				} as GameEvent);
				this.gameEventsEmitter.onGameStart.next(event);
				this.gameEventsEmitter.allEvents.next(event);
				break;
			case 'GAME_SETTINGS':
				console.log(gameEvent.Type + ' event', gameEvent);
				this.gameEventsEmitter.allEvents.next(
					Object.assign(new GameSettingsEvent(), {
						type: GameEvent.GAME_SETTINGS,
						additionalData: {
							battlegroundsPrizes: gameEvent.Value?.BattlegroundsPrizes,
						},
					} as GameEvent),
				);
				break;
			case 'MATCH_METADATA':
				console.log(gameEvent.Type + ' event', gameEvent.Value);
				this.gameEventsEmitter.allEvents.next(
					Object.assign(new GameEvent(), {
						type: GameEvent.MATCH_METADATA,
						additionalData: {
							metaData: gameEvent.Value?.MetaData ?? {},
							spectating: gameEvent.Value?.Spectating,
							stats: this.store.state?.stats,
							state: this.store.state,
						},
					} as GameEvent),
				);
				break;
			case 'LOCAL_PLAYER':
				console.log(gameEvent.Type + ' event');
				const localPlayer: GameEventPlayer = gameEvent.Value;
				console.log('sending LOCAL_PLAYER info', localPlayer);
				this.gameEventsEmitter.allEvents.next(
					Object.assign(new GameEvent(), {
						type: GameEvent.LOCAL_PLAYER,
						localPlayer: localPlayer,
					} as GameEvent),
				);

				// Send the info separately and asynchronously, so that we don't block
				// the main processing loop
				// This info is not needed by the tracker, but it is needed by some achievements
				// that rely on the rank
				setTimeout(async () => {
					const [playerInfo, opponentInfo, playerDeck] = await Promise.all([
						this.playersInfoService.getPlayerInfo(),
						this.playersInfoService.getOpponentInfo(),
						this.deckParser.getCurrentDeck(10000),
					]);
					console.log('players info', playerInfo, opponentInfo);
					if (!playerInfo || !opponentInfo) {
						console.warn('[game-events] no player info returned by mmindvision', playerInfo, opponentInfo);
						amplitude.getInstance().logEvent('error-logged', {
							'error-category': 'memory-reading',
							'error-id': 'no-player-info',
						});
					}
					this.gameEventsEmitter.allEvents.next(
						Object.assign(new GameEvent(), {
							type: GameEvent.PLAYERS_INFO,
							additionalData: {
								playerInfo: playerInfo,
								opponentInfo: opponentInfo,
							},
							localPlayer: {
								deck: playerDeck,
							},
						} as GameEvent),
					);
				});
				break;
			case 'OPPONENT_PLAYER':
				console.log(gameEvent.Type + ' event');
				const opponentPlayer: GameEventPlayer = Object.assign(
					{},
					gameEvent.Value.OpponentPlayer,
					{} as GameEventPlayer,
				);
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
			case 'MULLIGAN_DEALING':
				this.gameEventsEmitter.allEvents.next(
					Object.assign(new GameEvent(), {
						type: GameEvent.MULLIGAN_DEALING,
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
			case 'SUB_SPELL_START':
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.SUB_SPELL_START, gameEvent, {
						prefabId: gameEvent.Value.PrefabId,
					}),
				);
				break;
			case 'RUMBLE_RUN_STEP':
				console.log(gameEvent.Type + ' event', gameEvent.Value - 1);
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
				console.log(gameEvent.Type + ' event', gameEvent.Value - 1);
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
				console.log(gameEvent.Type + ' event', gameEvent.Value - 1);
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
				const props = gameEvent.Value.AdditionalProps
					? {
							targetEntityId: gameEvent.Value.AdditionalProps.TargetEntityId,
							targetCardId: gameEvent.Value.AdditionalProps.TargetCardId,
							creatorCardId: gameEvent.Value.AdditionalProps.CreatorCardId,
							transientCard: gameEvent.Value.AdditionalProps.TransientCard,
					  }
					: {};
				this.gameEventsEmitter.allEvents.next(GameEvent.build(GameEvent.CARD_PLAYED, gameEvent, props));
				break;
			case 'CARD_PLAYED_BY_EFFECT':
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(
						GameEvent.CARD_PLAYED_BY_EFFECT,
						gameEvent,
						gameEvent.Value.AdditionalProps
							? {
									creatorCardId: gameEvent.Value.AdditionalProps.CreatorCardId,
							  }
							: {},
					),
				);
				break;
			case 'MINION_SUMMONED_FROM_HAND':
				const summonFromHandAdditionProps = gameEvent.Value.AdditionalProps
					? {
							creatorCardId: gameEvent.Value.AdditionalProps.CreatorCardId,
					  }
					: null;
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.MINION_SUMMONED_FROM_HAND, gameEvent, summonFromHandAdditionProps),
				);
				break;
			case 'DISCARD_CARD':
				this.gameEventsEmitter.allEvents.next(GameEvent.build(GameEvent.DISCARD_CARD, gameEvent));
				break;
			case 'MINIONS_DIED':
				this.gameEventsEmitter.allEvents.next(
					Object.assign(new MinionsDiedEvent(), {
						type: GameEvent.MINIONS_DIED,
						localPlayer: gameEvent.Value.LocalPlayer,
						opponentPlayer: gameEvent.Value.OpponentPlayer,
						gameState: gameEvent.Value.GameState,
						additionalData: {
							deadMinions: gameEvent.Value.AdditionalProps.DeadMinions,
						},
					} as MinionsDiedEvent),
				);
				break;
			case 'MINIONS_WILL_DIE':
				this.gameEventsEmitter.allEvents.next(
					Object.assign(new MinionsDiedEvent(), {
						type: GameEvent.MINIONS_WILL_DIE,
						localPlayer: gameEvent.Value.LocalPlayer,
						opponentPlayer: gameEvent.Value.OpponentPlayer,
						gameState: gameEvent.Value.GameState,
						additionalData: {
							deadMinions: gameEvent.Value.AdditionalProps.DeadMinions,
						},
					} as MinionsDiedEvent),
				);
				break;
			case 'RECRUIT_CARD':
				this.gameEventsEmitter.allEvents.next(GameEvent.build(GameEvent.RECRUIT_CARD, gameEvent));
				break;
			case 'MINION_BACK_ON_BOARD':
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.MINION_BACK_ON_BOARD, gameEvent, {
						creatorCardId: gameEvent.Value.AdditionalProps?.CreatorCardId,
					}),
				);
				break;
			case 'SECRET_PLAYED_FROM_DECK':
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
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.SECRET_CREATED_IN_GAME, gameEvent, {
						playerClass: gameEvent.Value.AdditionalProps.PlayerClass
							? gameEvent.Value.AdditionalProps.PlayerClass.toLowerCase()
							: null,
					}),
				);
				break;
			case 'QUEST_PLAYED_FROM_DECK':
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
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.QUEST_CREATED_IN_GAME, gameEvent, {
						playerClass: gameEvent.Value.AdditionalProps.PlayerClass
							? gameEvent.Value.AdditionalProps.PlayerClass.toLowerCase()
							: null,
					}),
				);
				break;
			case 'MINION_SUMMONED':
				const summonAdditionProps = gameEvent.Value.AdditionalProps
					? {
							creatorCardId: gameEvent.Value.AdditionalProps.CreatorCardId,
					  }
					: null;
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.MINION_SUMMONED, gameEvent, summonAdditionProps),
				);
				break;
			case 'JADE_GOLEM':
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.JADE_GOLEM, gameEvent, {
						golemSize: gameEvent.Value.AdditionalProps.GolemSize,
					}),
				);
				break;
			case 'CTHUN':
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.CTHUN, gameEvent, {
						cthunSize: gameEvent.Value.AdditionalProps.CthunSize,
					}),
				);
				break;
			case 'MINDRENDER_ILLUCIA_START':
				this.gameEventsEmitter.allEvents.next(GameEvent.build(GameEvent.MINDRENDER_ILLUCIA_START, gameEvent));
				break;
			case 'MINDRENDER_ILLUCIA_END':
				this.gameEventsEmitter.allEvents.next(GameEvent.build(GameEvent.MINDRENDER_ILLUCIA_END, gameEvent));
				break;
			case 'HERO_POWER_CHANGED':
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.HERO_POWER_CHANGED, gameEvent, {
						creatorCardId: gameEvent.Value.AdditionalProps.CreatorCardId,
					}),
				);
				break;
			case 'WEAPON_EQUIPPED':
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.WEAPON_EQUIPPED, gameEvent, {
						creatorCardId: gameEvent.Value.AdditionalProps.CreatorCardId,
					}),
				);
				break;
			case 'CARD_REVEALED':
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.CARD_REVEALED, gameEvent, {
						creatorCardId: gameEvent.Value.AdditionalProps.CreatorCardId,
					}),
				);
				break;
			case 'LINKED_ENTITY':
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.LINKED_ENTITY, gameEvent, {
						linkedEntityId: gameEvent.Value.AdditionalProps.LinkedEntityId,
						linkedEntityControllerId: gameEvent.Value.AdditionalProps.LinkedEntityControllerId,
						linkedEntityZone: gameEvent.Value.AdditionalProps.LinkedEntityZone,
					}),
				);
				break;
			case 'CARD_CHANGED_ON_BOARD':
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
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.RECEIVE_CARD_IN_HAND, gameEvent, {
						// Not always present?
						creatorCardId: gameEvent.Value.AdditionalProps && gameEvent.Value.AdditionalProps.CreatorCardId,
						isPremium: gameEvent.Value.AdditionalProps && gameEvent.Value.AdditionalProps.IsPremium,
						buffingEntityCardId: gameEvent.Value.AdditionalProps.BuffingEntityCardId,
						buffCardId: gameEvent.Value.AdditionalProps.BuffCardId,
					}),
				);
				break;
			case 'CREATE_CARD_IN_GRAVEYARD':
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.CREATE_CARD_IN_GRAVEYARD, gameEvent, {
						// Not always present?
						creatorCardId: gameEvent.Value.AdditionalProps && gameEvent.Value.AdditionalProps.CreatorCardId,
						isPremium: gameEvent.Value.AdditionalProps && gameEvent.Value.AdditionalProps.IsPremium,
					}),
				);
				break;
			case 'CARD_BUFFED_IN_HAND':
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.CARD_BUFFED_IN_HAND, gameEvent, {
						buffingEntityCardId: gameEvent.Value.AdditionalProps.BuffingEntityCardId,
						buffCardId: gameEvent.Value.AdditionalProps.BuffCardId,
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
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.CREATE_CARD_IN_DECK, gameEvent, {
						creatorCardId: gameEvent.Value.AdditionalProps && gameEvent.Value.AdditionalProps.CreatorCardId,
						creatorEntityId:
							gameEvent.Value.AdditionalProps && gameEvent.Value.AdditionalProps.CreatorEntityId,
					}),
				);
				break;
			case 'SECRET_PLAYED':
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
			case 'SECRET_PUT_IN_PLAY':
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.SECRET_PUT_IN_PLAY, gameEvent, {
						playerClass:
							// Should always be the case, except in some older tests
							gameEvent.Value.AdditionalProps && gameEvent.Value.AdditionalProps.PlayerClass
								? gameEvent.Value.AdditionalProps.PlayerClass.toLowerCase()
								: null,
					}),
				);
				break;
			case 'SECRET_WILL_TRIGGER':
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(
						GameEvent.SECRET_WILL_TRIGGER,
						gameEvent,
						gameEvent.Value.AdditionalProps
							? {
									reactingToCardId: gameEvent.Value.AdditionalProps.InReactionToCardId,
									reactingToEntityId: gameEvent.Value.AdditionalProps.InReactionToEntityId,
							  }
							: null,
					),
				);
				break;
			case 'SECRET_TRIGGERED':
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
				this.gameEventsEmitter.allEvents.next(GameEvent.build(GameEvent.SECRET_DESTROYED, gameEvent));
				break;
			case 'WEAPON_DESTROYED':
				this.gameEventsEmitter.allEvents.next(GameEvent.build(GameEvent.WEAPON_DESTROYED, gameEvent));
				break;
			case 'MINION_GO_DORMANT':
				this.gameEventsEmitter.allEvents.next(GameEvent.build(GameEvent.MINION_GO_DORMANT, gameEvent));
				break;
			case 'QUEST_PLAYED':
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
				this.gameEventsEmitter.allEvents.next(GameEvent.build(GameEvent.QUEST_DESTROYED, gameEvent));
				break;
			case 'DEATHRATTLE_TRIGGERED':
				this.gameEventsEmitter.allEvents.next(GameEvent.build(GameEvent.DEATHRATTLE_TRIGGERED, gameEvent));
				break;
			case 'CARD_DRAW_FROM_DECK':
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.CARD_DRAW_FROM_DECK, gameEvent, {
						isPremium: gameEvent.Value.AdditionalProps && gameEvent.Value.AdditionalProps.IsPremium,
						creatorCardId: gameEvent.Value.AdditionalProps?.CreatorCardId,
						lastInfluencedByCardId: gameEvent.Value.AdditionalProps?.LastInfluencedByCardId,
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
			case 'CARD_REMOVED_FROM_BOARD':
				this.gameEventsEmitter.allEvents.next(GameEvent.build(GameEvent.CARD_REMOVED_FROM_BOARD, gameEvent));
				break;
			case 'BURNED_CARD':
				this.gameEventsEmitter.allEvents.next(GameEvent.build(GameEvent.BURNED_CARD, gameEvent));
				break;
			case 'MULLIGAN_INITIAL_OPTION':
				this.gameEventsEmitter.allEvents.next(GameEvent.build(GameEvent.MULLIGAN_INITIAL_OPTION, gameEvent));
				break;
			case 'CARD_ON_BOARD_AT_GAME_START':
				const additionalProps = gameEvent.Value.AdditionalProps
					? {
							health: gameEvent.Value.AdditionalProps.Health,
							creatorCardId: gameEvent.Value.AdditionalProps.CreatorCardId,
					  }
					: null;
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.CARD_ON_BOARD_AT_GAME_START, gameEvent, additionalProps),
				);
				break;
			case 'CARD_STOLEN':
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
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.CARD_CHANGED_IN_HAND, gameEvent, {
						creatorCardId: gameEvent.Value.AdditionalProps.CreatorCardId,
					}),
				);
				break;
			case 'CARD_CHANGED_IN_DECK':
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.CARD_CHANGED_IN_DECK, gameEvent, {
						creatorCardId: gameEvent.Value.AdditionalProps.CreatorCardId,
						lastInfluencedByCardId: gameEvent.Value.AdditionalProps.LastInfluencedByCardId,
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
			case 'NUM_CARDS_DRAWN_THIS_TURN':
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.NUM_CARDS_DRAW_THIS_TURN, gameEvent, {
						cardsDrawn: gameEvent.Value.AdditionalProps.NumCardsDrawn,
					}),
				);
				break;
			case 'RESOURCES_THIS_TURN':
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.RESOURCES_THIS_TURN, gameEvent, {
						resources: gameEvent.Value.AdditionalProps.Resources,
					}),
				);
				break;
			case 'RESOURCES_USED_THIS_TURN':
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.RESOURCES_USED_THIS_TURN, gameEvent, {
						resources: gameEvent.Value.AdditionalProps.Resources,
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
					Object.assign(new DamageGameEvent(), {
						type: GameEvent.DAMAGE,
						localPlayer: gameEvent.Value.LocalPlayer,
						opponentPlayer: gameEvent.Value.OpponentPlayer,
						gameState: gameEvent.Value.GameState,
						additionalData: {
							sourceCardId: gameEvent.Value.SourceCardId,
							sourceEntityId: gameEvent.Value.SourceEntityId,
							sourceControllerId: gameEvent.Value.SourceControllerId,
							targets: gameEvent.Value.Targets,
						},
					} as DamageGameEvent),
				);
				break;
			case 'COPIED_FROM_ENTITY_ID':
				this.gameEventsEmitter.allEvents.next(
					CopiedFromEntityIdGameEvent.build(GameEvent.COPIED_FROM_ENTITY_ID, gameEvent, {
						copiedCardControllerId: gameEvent.Value.AdditionalProps.CopiedCardControllerId,
						copiedCardEntityId: gameEvent.Value.AdditionalProps.CopiedCardEntityId,
					}),
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
				this.gameEventsEmitter.allEvents.next(
					Object.assign(new GameEvent(), {
						type: GameEvent.LOCAL_PLAYER_LEADERBOARD_PLACE_CHANGED,
						additionalData: {
							newPlace: gameEvent.Value.AdditionalProps.NewPlace,
						},
					} as GameEvent),
				);
				break;
			case 'GALAKROND_INVOKED':
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.GALAKROND_INVOKED, gameEvent, {
						totalInvoke: gameEvent.Value.AdditionalProps.TotalInvoke,
					}),
				);
				break;
			case 'BATTLEGROUNDS_HERO_SELECTION':
				console.log(gameEvent.Type + ' event', gameEvent);
				this.gameEventsEmitter.allEvents.next(
					Object.assign(new GameEvent(), {
						type: GameEvent.BATTLEGROUNDS_HERO_SELECTION,
						additionalData: {
							heroCardIds: gameEvent.Value.CardIds,
						},
					} as GameEvent),
				);
				break;
			case 'BATTLEGROUNDS_HERO_SELECTED':
				console.log(gameEvent.Type + ' event', gameEvent);
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.BATTLEGROUNDS_HERO_SELECTED, gameEvent, {
						// These are set after a reconnect, and usually not present when the match starts
						leaderboardPlace: gameEvent.Value.LeaderboardPlace,
						health: gameEvent.Value.Health,
						damage: gameEvent.Value.Damage,
						tavernLevel: gameEvent.Value.TavernLevel,
						nextOpponentCardId: gameEvent.Value.NextOpponentCardId,
					}),
				);
				break;
			case 'BATTLEGROUNDS_TRIPLE':
				this.gameEventsEmitter.allEvents.next(
					Object.assign(new GameEvent(), {
						type: GameEvent.BATTLEGROUNDS_TRIPLE,
						cardId: gameEvent.Value.CardId,
					} as GameEvent),
				);
				break;
			case 'BATTLEGROUNDS_REROLL':
				this.gameEventsEmitter.allEvents.next(
					Object.assign(new GameEvent(), {
						type: GameEvent.BATTLEGROUNDS_REROLL,
					} as GameEvent),
				);
				break;
			case 'BATTLEGROUNDS_FREEZE':
				this.gameEventsEmitter.allEvents.next(
					Object.assign(new GameEvent(), {
						type: GameEvent.BATTLEGROUNDS_FREEZE,
					} as GameEvent),
				);
				break;
			case 'BATTLEGROUNDS_COMBAT_START':
				console.log(gameEvent.Type + ' event');
				this.gameEventsEmitter.allEvents.next(
					Object.assign(new GameEvent(), {
						type: GameEvent.BATTLEGROUNDS_COMBAT_START,
					} as GameEvent),
				);
				break;
			case 'BATTLEGROUNDS_RECRUIT_PHASE':
				console.log(gameEvent.Type + ' event');
				this.gameEventsEmitter.allEvents.next(
					Object.assign(new GameEvent(), {
						type: GameEvent.BATTLEGROUNDS_RECRUIT_PHASE,
					} as GameEvent),
				);
				break;
			case 'BATTLEGROUNDS_BATTLE_RESULT':
				console.log(gameEvent.Type + ' event', gameEvent.Value.Opponent, gameEvent.Value.Result);
				this.gameEventsEmitter.allEvents.next(
					Object.assign(new GameEvent(), {
						type: GameEvent.BATTLEGROUNDS_BATTLE_RESULT,
						additionalData: {
							opponent: gameEvent.Value.Opponent,
							result: gameEvent.Value.Result,
							damage: gameEvent.Value.Damage,
						},
					} as GameEvent),
				);
				break;
			case 'BATTLEGROUNDS_NEXT_OPPONENT':
				this.gameEventsEmitter.allEvents.next(
					Object.assign(new GameEvent(), {
						type: GameEvent.BATTLEGROUNDS_NEXT_OPPONENT,
						additionalData: {
							nextOpponentCardId: gameEvent.Value.CardId,
							isSameOpponent: gameEvent.Value.IsSameOpponent,
						},
					} as GameEvent),
				);
				break;
			case 'BATTLEGROUNDS_OPPONENT_REVEALED':
				console.log(gameEvent.Type + ' event', gameEvent.Value.CardId);
				this.gameEventsEmitter.allEvents.next(
					Object.assign(new GameEvent(), {
						type: GameEvent.BATTLEGROUNDS_OPPONENT_REVEALED,
						additionalData: {
							cardId: gameEvent.Value.CardId,
							leaderboardPlace: gameEvent.Value.LeaderboardPlace,
						},
					} as GameEvent),
				);
				break;
			case 'BATTLEGROUNDS_MINION_BOUGHT':
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.BATTLEGROUNDS_MINION_BOUGHT, gameEvent),
				);
				break;
			case 'BATTLEGROUNDS_MINION_SOLD':
				this.gameEventsEmitter.allEvents.next(GameEvent.build(GameEvent.BATTLEGROUNDS_MINION_SOLD, gameEvent));
				break;
			case 'BATTLEGROUNDS_ENEMY_HERO_KILLED':
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.BATTLEGROUNDS_ENEMY_HERO_KILLED, gameEvent),
				);
				break;
			case 'BATTLEGROUNDS_PLAYER_BOARD':
				this.gameEventsEmitter.allEvents.next(
					Object.assign(new GameEvent(), {
						type: GameEvent.BATTLEGROUNDS_PLAYER_BOARD,
						additionalData: {
							playerBoard: {
								cardId: gameEvent.Value.PlayerBoard.CardId,
								board: gameEvent.Value.PlayerBoard.Board, // as is
								secrets: gameEvent.Value.PlayerBoard.Secrets, // as is
								hero: gameEvent.Value.PlayerBoard.Hero, // as is
								heroPowerCardId: gameEvent.Value.PlayerBoard.HeroPowerCardId,
								heroPowerUsed: gameEvent.Value.PlayerBoard.HeroPowerUsed,
							},
							opponentBoard: {
								cardId: gameEvent.Value.OpponentBoard.CardId,
								board: gameEvent.Value.OpponentBoard.Board, // as is
								secrets: gameEvent.Value.OpponentBoard.Secrets, // as is
								hero: gameEvent.Value.OpponentBoard.Hero, // as is
								heroPowerCardId: gameEvent.Value.OpponentBoard.HeroPowerCardId,
								heroPowerUsed: gameEvent.Value.OpponentBoard.HeroPowerUsed,
							},
						},
					} as GameEvent),
				);
				break;
			case 'BATTLEGROUNDS_LEADERBOARD_PLACE':
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
				console.log(gameEvent.Type + ' event', { ...gameEvent.Value.Winner, Tags: null });
				this.gameEventsEmitter.allEvents.next(
					Object.assign(new GameEvent(), {
						type: GameEvent.WINNER,
						localPlayer: gameEvent.Value.LocalPlayer,
						opponentPlayer: gameEvent.Value.OpponentPlayer,
						additionalData: {
							winner: gameEvent.Value.Winner,
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
							spectating: gameEvent.Value.Spectating,
						},
					} as GameEvent),
				);
				break;
			// TODO: at some point we might want to debounce these events
			case 'GAME_STATE_UPDATE':
				this.gameEventsEmitter.allEvents.next(GameEvent.build(GameEvent.GAME_STATE_UPDATE, gameEvent));
				break;
			case 'ENTITY_UPDATE':
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.ENTITY_UPDATE, gameEvent, {
						mercenariesExperience: gameEvent.Value.AdditionalProps?.MercenariesExperience,
						mercenariesEquipmentId: gameEvent.Value.AdditionalProps?.MercenariesEquipmentId,
						abilityOwnerEntityId: gameEvent.Value.AdditionalProps?.AbilityOwnerEntityId,
						abilityCooldownConfig: gameEvent.Value.AdditionalProps?.AbilityCooldownConfig,
						abilityCurrentCooldown: gameEvent.Value.AdditionalProps?.AbilityCurrentCooldown,
						abilitySpeed: gameEvent.Value.AdditionalProps?.AbilitySpeed,
						zonePosition: gameEvent.Value.AdditionalProps?.ZonePosition,
						zone: gameEvent.Value.AdditionalProps?.Zone,
					}),
				);
				break;
			case 'ZONE_CHANGED':
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.ZONE_CHANGED, gameEvent, {
						zone: gameEvent.Value.AdditionalProps.Zone,
					}),
				);
				break;
			case 'COST_CHANGED':
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.COST_CHANGED, gameEvent, {
						cost: gameEvent.Value.AdditionalProps.NewCost,
						abilityOwnerEntityId: gameEvent.Value.AdditionalProps.AbilityOwnerEntityId,
					}),
				);
				break;
			case 'ZONE_POSITION_CHANGED':
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.ZONE_POSITION_CHANGED, gameEvent, {
						zonePosition: gameEvent.Value.AdditionalProps.ZonePosition,
					}),
				);
				break;
			case 'WHIZBANG_DECK_ID':
				this.gameEventsEmitter.allEvents.next(
					Object.assign(new GameEvent(), {
						type: GameEvent.WHIZBANG_DECK_ID,
						additionalData: {
							deckId: gameEvent.Value.DeckId,
						},
					} as GameEvent),
				);
				break;
			case 'RECONNECT_START':
				this.gameEventsEmitter.allEvents.next(
					Object.assign(new GameEvent(), { type: GameEvent.RECONNECT_START }),
				);
				break;
			case 'RECONNECT_OVER':
				this.gameEventsEmitter.allEvents.next(
					Object.assign(new GameEvent(), { type: GameEvent.RECONNECT_OVER }),
				);
				break;
			case 'SPECTATING':
				this.gameEventsEmitter.allEvents.next(
					Object.assign(new GameEvent(), {
						type: GameEvent.SPECTATING,
						additionalData: { spectating: gameEvent.Value?.Spectating },
					} as GameEvent),
				);
				break;

			case 'MERCENARIES_HERO_REVEALED':
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.MERCENARIES_HERO_REVEALED, gameEvent, {
						creatorCardId: gameEvent.Value.AdditionalProps.CreatorCardId,
						mercenariesExperience: gameEvent.Value.AdditionalProps.MercenariesExperience,
						mercenariesEquipmentId: gameEvent.Value.AdditionalProps.MercenariesEquipmentId,
						isDead: gameEvent.Value.AdditionalProps.IsDead,
						zonePosition: gameEvent.Value.AdditionalProps.ZonePosition,
						zone: gameEvent.Value.AdditionalProps.Zone,
					}),
				);
				break;
			case 'MERCENARIES_ABILITY_REVEALED':
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.MERCENARIES_ABILITY_REVEALED, gameEvent, {
						abilityOwnerEntityId: gameEvent.Value.AdditionalProps.AbilityOwnerEntityId,
						abilityCooldownConfig: gameEvent.Value.AdditionalProps.AbilityCooldownConfig,
						abilityCurrentCooldown: gameEvent.Value.AdditionalProps.AbilityCurrentCooldown,
						abilitySpeed: gameEvent.Value.AdditionalProps.AbilitySpeed,
						isTreasure: gameEvent.Value.AdditionalProps.IsTreasure,
					}),
				);
				break;
			case 'MERCENARIES_EQUIPMENT_REVEALED':
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.MERCENARIES_EQUIPMENT_REVEALED, gameEvent, {
						equipmentOwnerEntityId: gameEvent.Value.AdditionalProps.AbilityOwnerEntityId,
					}),
				);
				break;
			case 'MERCENARIES_ABILITY_UPDATE':
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.MERCENARIES_ABILITY_UPDATE, gameEvent, {
						abilityOwnerEntityId: gameEvent.Value.AdditionalProps.AbilityOwnerEntityId,
						abilityCooldownConfig: gameEvent.Value.AdditionalProps.AbilityCooldownConfig,
						abilityCurrentCooldown: gameEvent.Value.AdditionalProps.AbilityCurrentCooldown,
						abilitySpeed: gameEvent.Value.AdditionalProps.AbilitySpeed,
						isTreasure: gameEvent.Value.AdditionalProps.IsTreasure,
					}),
				);
				break;
			case 'MERCENARIES_ABILITY_ACTIVATED':
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.MERCENARIES_ABILITY_ACTIVATED, gameEvent, {
						abilityOwnerEntityId: gameEvent.Value.AdditionalProps.AbilityOwnerEntityId,
					}),
				);
				break;
			case 'MERCENARIES_EQUIPMENT_UPDATE':
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.MERCENARIES_EQUIPMENT_UPDATE, gameEvent, {
						equipmentOwnerEntityId: gameEvent.Value.AdditionalProps.AbilityOwnerEntityId,
						equipmentCooldownConfig: gameEvent.Value.AdditionalProps.AbilityCooldownConfig,
						equipmentCurrentCooldown: gameEvent.Value.AdditionalProps.AbilityCurrentCooldown,
						equipmentSpeed: gameEvent.Value.AdditionalProps.AbilitySpeed,
					}),
				);
				break;
			case 'MERCENARIES_COOLDOWN_UPDATED':
				this.gameEventsEmitter.allEvents.next(
					GameEvent.build(GameEvent.MERCENARIES_COOLDOWN_UPDATED, gameEvent, {
						newCooldown: gameEvent.Value.AdditionalProps.NewCooldown,
						abilityOwnerEntityId: gameEvent.Value.AdditionalProps.AbilityOwnerEntityId,
					}),
				);
				break;
			default:
				console.warn('unsupported game event', gameEvent);
		}
	}

	public receiveLogLine(data: string) {
		// In case the game overrides the info during the process, we stop everything and start from scratch
		if (data === 'truncated') {
			console.log(
				'[game-events] HS log file truncated, clearing queue',
				this.existingLogLines?.length,
				this.processingQueue.eventsPendingCount(),
			);
			// this.setSpectating(false);
			this.existingLogLines = [];
			this.processingQueue.clear();
			return;
		}
		if (data.indexOf('Begin Spectating') !== -1) {
			console.log('begin spectating', data);
		}
		if (data.indexOf('End Spectator Mode') !== -1) {
			console.log('end spectating', data);
		}

		if (data.indexOf('CREATE_GAME') !== -1) {
			console.log('[game-events] received CREATE_GAME log', data);
		}

		if (data.indexOf('tag=PLAYSTATE value=WON') !== -1) {
			console.log('[game-events] received tag=PLAYSTATE value=WON log', data);
		}

		if (data.indexOf('tag=STATE value=COMPLETE') !== -1) {
			console.log('[game-events] received tag=STATE value=COMPLETE log', data);
		}

		this.processingQueue.enqueue(data);
	}

	private existingLogLines: string[] = [];
	private catchingUp: boolean;

	public isCatchingUpLogLines(): boolean {
		return this.catchingUp;
	}

	// Handles reading a log file mid-game, i.e. this data is already
	// present in the log file when we're trying to read it
	public receiveExistingLogLine(existingLine: string) {
		if (existingLine.indexOf('Begin Spectating') !== -1) {
			console.log('[game-events] [existing] begin spectating', existingLine);
		}
		if (existingLine.indexOf('End Spectator Mode') !== -1) {
			console.log('[game-events] [existing] end spectating', existingLine);
		}

		if (existingLine === 'end_of_existing_data' && this.existingLogLines.length > 0) {
			// There is no automatic reconnect when spectating, so we can always safely say
			// that when we finish catching up with the actual contents of the file, we are
			// not spectating
			console.log('[game-events] [existing] end_of_existing_data');
			this.triggerCatchUp();
			return;
		}

		if (existingLine.indexOf('CREATE_GAME') !== -1 && existingLine.indexOf('GameState') !== -1) {
			console.log('[game-events] [existing] received CREATE_GAME log', existingLine);
			this.existingLogLines = [];
		}
		if (existingLine.indexOf('tag=PLAYSTATE value=WON') !== -1) {
			console.log('[game-events] [existing] received tag=PLAYSTATE value=WON log', existingLine);
		}
		if (existingLine.indexOf('tag=STATE value=COMPLETE') !== -1 || existingLine.includes('End Spectator Mode')) {
			// Complete game, we don't handle it
			console.log('[game-events] [existing] complete game, trashing all logs');
			this.existingLogLines = [];
		}
		this.existingLogLines.push(existingLine);
	}

	private async triggerCatchUp() {
		this.catchingUp = true;
		const lastLineTimestamp = this.extractLastTimestamp(this.existingLogLines);
		console.log(
			'[game-events] [existing] last line timestamp',
			lastLineTimestamp,
			Date.now(),
			this.existingLogLines[this.existingLogLines.length - 1],
		);
		// If we're in a game, we want to ignore the past time restriction, as it's not a reconnect but
		// rather the user launching the app once the game is running
		if (
			lastLineTimestamp &&
			Date.now() - lastLineTimestamp > 5 * 60 * 1000 &&
			!['scene_gameplay'].includes(await this.memoryService.getCurrentScene())
		) {
			console.log(
				'[game-events] [existing] last line is too old, not doing anything',
				this.existingLogLines[this.existingLogLines.length - 1],
			);
			this.catchingUp = false;
			this.existingLogLines = [];
			return;
		}
		console.log('[game-events] [existing] caught up, enqueueing all events', this.existingLogLines.length);

		if (this.existingLogLines.length > 0) {
			this.processingQueue.enqueueAll(['START_CATCHING_UP', ...this.existingLogLines, 'END_CATCHING_UP']);
		}
		this.existingLogLines = [];
		this.catchingUp = false;
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
			freeRegexp();
			return dateWithMillis.getTime();
		}
		freeRegexp();
	}
}
