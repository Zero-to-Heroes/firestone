import { Injectable } from '@angular/core';
import { SceneMode } from '@firestone-hs/reference-data';
import { GameEventsFacadeService, GameUniqueIdService } from '@firestone/game-state';
import { SceneService } from '@firestone/memory';
import { GameStatusService, GlobalErrorService } from '@firestone/shared/common/service';
import { sleep } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import Deque from 'double-ended-queue';
import { filter, interval, take } from 'rxjs';
import { GameEvent, GameEventPlayer } from '../models/game-event';
import { ChoosingOptionsGameEvent } from '../models/mainwindow/game-events/choosing-options-game-event';
import { CopiedFromEntityIdGameEvent } from '../models/mainwindow/game-events/copied-from-entity-id-game-event';
import { DamageGameEvent } from '../models/mainwindow/game-events/damage-game-event';
import { GameSettingsEvent } from '../models/mainwindow/game-events/game-settings-event';
import { MinionsDiedEvent } from '../models/mainwindow/game-events/minions-died-event';
import { GameStateService } from './decktracker/game-state.service';
import { Events } from './events.service';
import { GameEventsEmitterService } from './game-events-emitter.service';
import { HsGameMetaData } from './game-mode-data.service';
import { MainWindowStoreService } from './mainwindow/store/main-window-store.service';
import { GameEventsPluginService } from './plugins/game-events-plugin.service';
import { ProcessingQueue } from './processing-queue.service';
import { chunk, freeRegexp } from './utils';

@Injectable()
export class GameEvents {
	private plugin;

	private processingQueue = new ProcessingQueue<string>(
		(eventQueue) => this.processQueue(eventQueue),
		500,
		'game-events',
		100_000,
	);

	private lastProcessedTimestamp: number;
	private lastGameStateUpdateTimestamp: number;
	private gameStateUpdateInProgress: boolean;
	// private receivedLastGameStateUpdate = true;

	constructor(
		private readonly gameEventsPlugin: GameEventsPluginService,
		private readonly events: Events,
		private readonly gameEventsEmitter: GameEventsEmitterService,
		private readonly scene: SceneService,
		private readonly store: MainWindowStoreService,
		private readonly gameStatus: GameStatusService,
		private readonly allCards: CardsFacadeService,
		private readonly gameState: GameStateService,
		private readonly gameUniqueId: GameUniqueIdService,
		private readonly eventsFacade: GameEventsFacadeService,
		private readonly globalError: GlobalErrorService,
	) {
		this.init();
		window['buildPlayerBoardGameEvent'] = (rawEvent: string) =>
			this.buildBattlegroundsPlayerBoardEvent('BATTLEGROUNDS_PLAYER_BOARD', JSON.parse(rawEvent));
	}

	async init() {
		await this.scene.isReady();

		this.gameEventsEmitter.allEvents.subscribe((event) => {
			this.eventsFacade.allEvents.next(event);
		});

		this.gameStatus.inGame$$
			.pipe(
				filter((inGame) => inGame),
				take(1),
			)
			.subscribe(async () => {
				console.log('[game-events] init game events monitor');
				this.initPlugin();
				this.scene.currentScene$$.subscribe((scene) => {
					console.log('emitting new scene event', scene);
					this.doEventDispatch(
						Object.assign(new GameEvent(), {
							type: GameEvent.SCENE_CHANGED_MINDVISION,
							additionalData: { scene: scene },
						} as GameEvent),
					);
				});
				this.events.on(Events.GLOBAL_STATS_UPDATED).subscribe(async (event) => {
					// console.log('[game-events] broadcasting new GLOBAL_STATS_UPDATED event');
					this.doEventDispatch(
						Object.assign(new GameEvent(), {
							type: GameEvent.GLOBAL_STATS_UPDATED,
							additionalData: { stats: event.data[0] },
						} as GameEvent),
					);
				});
				// This is here so that, if we quit the game while spectating, we don't go back
				// in spectator mode when starting the game again
				// However, this means that the "spectate" event is also sent while we're reconnecting
				// which resets all the states
				// this.gameStatus.onGameExit(() => {
				// Use game start, so we have a chance to spot reconnects
				this.gameStatus.onGameStart(() => {
					// If we're current spectating, stop it
					if (this.gameState.state?.spectating) {
						console.log('[game-events] leaving game while spectating, emitting End Spectator Mode event');
						this.processingQueue.enqueue('End Spectator Mode');
					}
				});
			});

		const gameStateUpdateInterval = 2000;
		interval(gameStateUpdateInterval).subscribe(() => {
			// console.debug(
			// 	'will ask for game state updat?',
			// 	this.lastProcessedTimestamp,
			// 	// this.receivedLastGameStateUpdate,
			// );
			if (!this.lastProcessedTimestamp) {
				console.debug(
					'[game-events] [game-state] not asking for game state update yet, lastProcessedTimestamp',
					this.lastProcessedTimestamp,
				);
				return;
			}
			// if (!this.receivedLastGameStateUpdate) {
			// 	return;
			// }

			const timeSinceLastLog = Date.now() - this.lastProcessedTimestamp;
			// Only ask for a game state update if we have received an event in the last 2 seconds
			if (timeSinceLastLog < 3 * gameStateUpdateInterval) {
				const timeSinceLastGameStateUpdate = Date.now() - this.lastGameStateUpdateTimestamp;
				// this.receivedLastGameStateUpdate = false;
				// Only ask for a game state update if we haven't received one in the last 2 seconds
				// TODO: also don't ask if a request is sent but not received yet
				if (this.gameStateUpdateInProgress) {
					console.debug(
						'[game-events] [game-state] not asking for game state update, already in progress',
						timeSinceLastLog,
					);
					return;
				}
				if (!this.lastGameStateUpdateTimestamp || timeSinceLastGameStateUpdate > gameStateUpdateInterval) {
					console.debug('[game-events] [game-state] asking for game state update', timeSinceLastLog);
					this.gameStateUpdateInProgress = true;
					this.plugin.askForGameStateUpdate();
				} else {
					console.debug(
						'[game-events] [game-state] not asking for game state update, timeSinceLastGameStateUpdate',
						timeSinceLastGameStateUpdate,
					);
				}
			} else {
				console.debug(
					'[game-events] [game-state] not asking for game state update, timeSinceLastLog',
					timeSinceLastLog,
				);
			}
		});
	}

	private async processQueue(eventQueue: readonly string[]): Promise<readonly string[]> {
		if (eventQueue.some((data) => data.includes('CREATE_GAME'))) {
			console.log('[game-events] preparing log lines that include game creation to feed to the plugin');
		}
		await this.initPlugin();
		const hasProcessed = await this.processLogs(eventQueue);
		return hasProcessed ? [] : eventQueue;
	}

	private async processLogs(eventQueue: readonly string[]): Promise<boolean> {
		// Because this will mess up the reconnect detection
		if (
			eventQueue.some((data) => data.includes('CREATE_GAME')) &&
			!eventQueue.some((data) => data.includes('GAME_SEED'))
		) {
			console.warn("[game-events] can't process logs without a game seed", eventQueue[eventQueue.length - 1]);
			return false;
		}
		await this.waitForPluginReady();

		const chunkSize = 1000; // Maximum number of lines per chunk
		const chunks = chunk(eventQueue, chunkSize);

		for (const chunk of chunks) {
			const start = Date.now();
			// console.debug('[game-events] dispatching game events chunk', chunk.length);
			await new Promise<void>((resolve) => {
				this.plugin.realtimeLogProcessing(chunk, () => {
					// console.debug(
					// 	'[game-events] finished dispatching chunk',
					// 	chunk.length,
					// 	'game events after',
					// 	Date.now() - start,
					// 	'ms',
					// );
					resolve();
				});
			});
		}

		return true;
	}

	private doEventDispatch(event: GameEvent) {
		this.gameEventsEmitter.allEvents.next(event);
	}

	public totalTime = 0;
	public async dispatchGameEvent(gameEvent) {
		if (!gameEvent) {
			return;
		}

		// console.debug('[game-events] dispatching game event', gameEvent.Type);
		if (gameEvent.Type !== 'GAME_STATE_UPDATE') {
			this.lastProcessedTimestamp = Date.now();
		} else {
			console.debug('[game-events] received GAME_STATE_UPDATE');
			this.lastGameStateUpdateTimestamp = Date.now();
			this.gameStateUpdateInProgress = false;
			// this.receivedLastGameStateUpdate = true;
		}

		const start = Date.now();
		switch (gameEvent.Type) {
			case 'NEW_GAME':
				console.log(gameEvent.Type + ' event', gameEvent);
				// this.hasSentToS3 = false;
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.GAME_START,
					additionalData: {
						spectating: gameEvent.Value?.Spectating,
						timestamp: gameEvent.Value?.Timestamp,
					},
				} as GameEvent);
				this.gameEventsEmitter.onGameStart.next(event);
				this.doEventDispatch(event);
				break;
			case 'GAME_SETTINGS':
				console.log(gameEvent.Type + ' event', gameEvent);
				const gameSettingsEvent = Object.assign(new GameSettingsEvent(), {
					type: GameEvent.GAME_SETTINGS,
					additionalData: {
						battlegroundsPrizes: gameEvent.Value?.BattlegroundsPrizes,
						battlegroundsSpells: gameEvent.Value?.BattlegroundsSpells,
						battlegroundsQuests: gameEvent.Value?.BattlegroundsQuests,
						battlegroundsBuddies: gameEvent.Value?.BattlegroundsBuddies,
						battlegroundsTrinkets: gameEvent.Value?.BattlegroundsTrinkets,
						battlegroundsAnomalies:
							gameEvent.Value?.BattlegroundsAnomalies?.map((dbfId) => this.allCards.getCard(dbfId)?.id) ??
							([] as readonly string[]),
					},
				} as GameEvent);
				// Not a big fan of this: I'd rather have the gameUniqueId service listen to the event, but
				// there are too many dependencies to refactor
				this.gameUniqueId.onNewGame();
				this.doEventDispatch(gameSettingsEvent);
				break;
			case 'MATCH_METADATA':
				console.log(gameEvent.Type + ' event', gameEvent.Value);
				this.doEventDispatch(
					Object.assign(new GameEvent(), {
						type: GameEvent.MATCH_METADATA,
						additionalData: {
							metaData: (gameEvent.Value?.MetaData ?? {}) as HsGameMetaData,
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
				this.doEventDispatch(
					Object.assign(new GameEvent(), {
						type: GameEvent.LOCAL_PLAYER,
						localPlayer: localPlayer,
					} as GameEvent),
				);
				break;
			case 'OPPONENT_PLAYER':
				console.log(gameEvent.Type + ' event');
				const opponentPlayer: GameEventPlayer = Object.assign(
					{},
					gameEvent.Value.OpponentPlayer,
					{} as GameEventPlayer,
				);
				console.log('sending OPPONENT_PLAYER info', opponentPlayer);
				this.doEventDispatch(
					Object.assign(new GameEvent(), {
						type: GameEvent.OPPONENT,
						opponentPlayer: opponentPlayer,
						additionalData: {
							gameState: gameEvent.Value.GameState,
						},
					} as GameEvent),
				);
				break;
			case 'ANOMALY_REVEALED':
				this.doEventDispatch(GameEvent.build(GameEvent.ANOMALY_REVEALED, gameEvent));
				break;
			case 'INITIAL_CARD_IN_DECK':
				this.doEventDispatch(GameEvent.build(GameEvent.INITIAL_CARD_IN_DECK, gameEvent));
				break;
			case 'HERO_POWER_USED':
				this.doEventDispatch(GameEvent.build(GameEvent.HERO_POWER_USED, gameEvent));
				break;
			case 'START_OF_GAME':
				this.doEventDispatch(GameEvent.build(GameEvent.START_OF_GAME, gameEvent));
				break;
			case 'MULLIGAN_INPUT':
				this.doEventDispatch(
					Object.assign(new GameEvent(), {
						type: GameEvent.MULLIGAN_INPUT,
					} as GameEvent),
				);
				break;
			case 'MULLIGAN_DEALING':
				this.doEventDispatch(
					Object.assign(new GameEvent(), {
						type: GameEvent.MULLIGAN_DEALING,
					} as GameEvent),
				);
				break;
			case 'MULLIGAN_DONE':
				this.doEventDispatch(
					Object.assign(new GameEvent(), {
						type: GameEvent.MULLIGAN_DONE,
					} as GameEvent),
				);
				break;
			case 'MAIN_STEP_READY':
				this.doEventDispatch(
					Object.assign(new GameEvent(), {
						type: GameEvent.MAIN_STEP_READY,
						additionalData: {
							timestamp: gameEvent.Value?.Timestamp,
						},
					} as GameEvent),
				);
				break;
			case 'DECKLIST_UPDATE':
				this.doEventDispatch(
					GameEvent.build(GameEvent.DECKLIST_UPDATE, gameEvent, {
						deckId: gameEvent.Value.AdditionalProps.DeckId,
					}),
				);
				break;
			case 'SUB_SPELL_START':
				this.doEventDispatch(
					GameEvent.build(GameEvent.SUB_SPELL_START, gameEvent, {
						prefabId: gameEvent.Value.PrefabId,
						parentEntityId: gameEvent.Value.ParentEntityId,
						parentCardId: gameEvent.Value.ParentCardId,
					}),
				);
				break;
			case 'SUB_SPELL_END':
				this.doEventDispatch(
					GameEvent.build(GameEvent.SUB_SPELL_END, gameEvent, {
						prefabId: gameEvent.Value.PrefabId,
						sourceEntityId: gameEvent.Value.SourceEntityId,
						sourceCardId: gameEvent.Value.SourceCardId,
						targetEntityIds: gameEvent.Value.TargetEntityIds,
					}),
				);
				break;
			case 'SHUFFLE_DECK':
				this.doEventDispatch(
					GameEvent.build(GameEvent.SHUFFLE_DECK, gameEvent, {
						playerId: gameEvent.Value.PlayerId,
					}),
				);
				break;
			case 'RUMBLE_RUN_STEP':
				// console.debug(gameEvent.Type + ' event', gameEvent.Value - 1);
				this.doEventDispatch(
					Object.assign(new GameEvent(), {
						type: GameEvent.RUMBLE_RUN_STEP,
						additionalData: {
							step: gameEvent.Value - 1,
						},
					} as GameEvent),
				);
				break;
			case 'DUNGEON_RUN_STEP':
				console.debug(gameEvent.Type + ' event', gameEvent.Value - 1);
				this.doEventDispatch(
					Object.assign(new GameEvent(), {
						type: GameEvent.DUNGEON_RUN_STEP,
						additionalData: {
							step: gameEvent.Value - 1,
						},
					} as GameEvent),
				);
				break;
			case 'MONSTER_HUNT_STEP':
				console.debug(gameEvent.Type + ' event', gameEvent.Value - 1);
				this.doEventDispatch(
					Object.assign(new GameEvent(), {
						type: GameEvent.MONSTER_HUNT_STEP,
						additionalData: {
							step: gameEvent.Value - 1,
						},
					} as GameEvent),
				);
				break;
			case 'CARD_PLAYED':
				this.doEventDispatch(
					GameEvent.build(
						GameEvent.CARD_PLAYED,
						gameEvent,
						gameEvent.Value.AdditionalProps
							? {
									targetEntityId: gameEvent.Value.AdditionalProps.TargetEntityId,
									targetCardId: gameEvent.Value.AdditionalProps.TargetCardId,
									creatorCardId: gameEvent.Value.AdditionalProps.CreatorCardId,
									transientCard: gameEvent.Value.AdditionalProps.TransientCard,
									immune: gameEvent.Value.AdditionalProps.Immune,
									dormant: gameEvent.Value.AdditionalProps.Dormant,
									cost: gameEvent.Value.AdditionalProps.Cost,
									magnetized: gameEvent.Value.AdditionalProps.Magnetized,
									tags: gameEvent.Value.AdditionalProps.Tags,
							  }
							: {},
					),
				);
				break;
			case 'CARD_PLAYED_BY_EFFECT':
				this.doEventDispatch(
					GameEvent.build(GameEvent.CARD_PLAYED_BY_EFFECT, gameEvent, {
						targetEntityId: gameEvent.Value.AdditionalProps.TargetEntityId,
						targetCardId: gameEvent.Value.AdditionalProps.TargetCardId,
						creatorCardId: gameEvent.Value.AdditionalProps.CreatorCardId,
						creatorEntityId: gameEvent.Value.AdditionalProps.CreatorEntityId,
						castWhenDrawn: gameEvent.Value.AdditionalProps.CastWhenDrawn,
					}),
				);
				break;
			case 'MINION_SUMMONED_FROM_HAND':
				const summonFromHandAdditionProps = gameEvent.Value.AdditionalProps
					? {
							creatorCardId: gameEvent.Value.AdditionalProps.CreatorCardId,
							tags: gameEvent.Value.AdditionalProps.Tags,
					  }
					: null;
				this.doEventDispatch(
					GameEvent.build(GameEvent.MINION_SUMMONED_FROM_HAND, gameEvent, summonFromHandAdditionProps),
				);
				break;
			case 'DISCARD_CARD':
				this.doEventDispatch(
					GameEvent.build(GameEvent.DISCARD_CARD, gameEvent, {
						originEntityId: gameEvent.Value.AdditionalProps?.OriginEntityId,
					}),
				);
				break;
			case 'TOURIST_REVEALED':
				this.doEventDispatch(
					GameEvent.build(GameEvent.TOURIST_REVEALED, gameEvent, {
						touristFor: gameEvent.Value.AdditionalProps?.TouristFor,
					}),
				);
				break;
			case 'RECRUIT_CARD':
				this.doEventDispatch(
					GameEvent.build(GameEvent.RECRUIT_CARD, gameEvent, {
						tags: gameEvent.Value.AdditionalProps.Tags,
					}),
				);
				break;
			case 'MINION_BACK_ON_BOARD':
				this.doEventDispatch(
					GameEvent.build(GameEvent.MINION_BACK_ON_BOARD, gameEvent, {
						creatorCardId: gameEvent.Value.AdditionalProps?.CreatorCardId,
					}),
				);
				break;
			case 'TURN_DURATION_UPDATED':
				this.doEventDispatch(
					GameEvent.build(GameEvent.TURN_DURATION_UPDATED, gameEvent, {
						newDuration: gameEvent.Value.AdditionalProps?.NewDuration,
					}),
				);
				break;
			case 'SECRET_PLAYED_FROM_DECK':
				this.doEventDispatch(
					GameEvent.build(GameEvent.SECRET_PLAYED_FROM_DECK, gameEvent, {
						playerClass: gameEvent.Value.AdditionalProps.PlayerClass
							? gameEvent.Value.AdditionalProps.PlayerClass.toLowerCase()
							: null,
						creatorCardId: gameEvent.Value.AdditionalProps.CreatorCardId,
					}),
				);
				break;
			case 'SECRET_CREATED_IN_GAME':
				this.doEventDispatch(
					GameEvent.build(GameEvent.SECRET_CREATED_IN_GAME, gameEvent, {
						playerClass: gameEvent.Value.AdditionalProps.PlayerClass
							? gameEvent.Value.AdditionalProps.PlayerClass.toLowerCase()
							: null,
						creatorCardId: gameEvent.Value.AdditionalProps.CreatorCardId,
					}),
				);
				break;
			case 'QUEST_PLAYED_FROM_DECK':
				this.doEventDispatch(
					GameEvent.build(GameEvent.QUEST_PLAYED_FROM_DECK, gameEvent, {
						playerClass: gameEvent.Value.AdditionalProps.PlayerClass
							? gameEvent.Value.AdditionalProps.PlayerClass.toLowerCase()
							: null,
						creatorCardId: gameEvent.Value.AdditionalProps.CreatorCardId,
					}),
				);
				break;
			case 'QUEST_CREATED_IN_GAME':
				this.doEventDispatch(
					GameEvent.build(GameEvent.QUEST_CREATED_IN_GAME, gameEvent, {
						playerClass: gameEvent.Value.AdditionalProps.PlayerClass
							? gameEvent.Value.AdditionalProps.PlayerClass.toLowerCase()
							: null,
						creatorCardId: gameEvent.Value.AdditionalProps.CreatorCardId,
						creatorEntityId: gameEvent.Value.AdditionalProps.CreatorEntityId,
					}),
				);
				break;
			case 'CARD_FORGED':
				this.doEventDispatch(GameEvent.build(GameEvent.CARD_FORGED, gameEvent));
				break;
			case 'STARSHIP_LAUNCHED':
				this.doEventDispatch(
					GameEvent.build(GameEvent.STARSHIP_LAUNCHED, gameEvent, {
						tags: gameEvent.Value.AdditionalProps.Tags,
					}),
				);
				break;
			case 'JADE_GOLEM':
				this.doEventDispatch(
					GameEvent.build(GameEvent.JADE_GOLEM, gameEvent, {
						golemSize: gameEvent.Value.AdditionalProps.GolemSize,
					}),
				);
				break;
			case 'CTHUN':
				this.doEventDispatch(
					GameEvent.build(GameEvent.CTHUN, gameEvent, {
						cthunAtk: gameEvent.Value.AdditionalProps.CthuAtk,
						cthunHealth: gameEvent.Value.AdditionalProps.CthuHealth,
					}),
				);
				break;
			case 'MINDRENDER_ILLUCIA_START':
				this.doEventDispatch(GameEvent.build(GameEvent.MINDRENDER_ILLUCIA_START, gameEvent));
				break;
			case 'MINDRENDER_ILLUCIA_END':
				this.doEventDispatch(GameEvent.build(GameEvent.MINDRENDER_ILLUCIA_END, gameEvent));
				break;
			case 'HERO_POWER_CHANGED':
				this.doEventDispatch(
					GameEvent.build(GameEvent.HERO_POWER_CHANGED, gameEvent, {
						creatorCardId: gameEvent.Value.AdditionalProps.CreatorCardId,
					}),
				);
				break;
			case 'HERO_CHANGED':
				this.doEventDispatch(GameEvent.build(GameEvent.HERO_CHANGED, gameEvent));
				break;
			case 'WEAPON_EQUIPPED':
				this.doEventDispatch(
					GameEvent.build(GameEvent.WEAPON_EQUIPPED, gameEvent, {
						creatorCardId: gameEvent.Value.AdditionalProps.CreatorCardId,
					}),
				);
				break;
			case 'CARD_REVEALED':
				this.doEventDispatch(
					GameEvent.build(GameEvent.CARD_REVEALED, gameEvent, {
						creatorCardId: gameEvent.Value.AdditionalProps.CreatorCardId,
						originEntityCardId: gameEvent.Value.AdditionalProps.OriginEntityCardId,
						revealedFromBlock: gameEvent.Value.AdditionalProps.RevealedFromBlock,
						indexInBlock: gameEvent.Value.AdditionalProps.IndexInBlock,
						cost: gameEvent.Value.AdditionalProps.Cost,
					}),
				);
				break;
			case 'HERO_REVEALED':
				this.doEventDispatch(
					GameEvent.build(GameEvent.HERO_REVEALED, gameEvent, {
						health: gameEvent.Value.AdditionalProps.Health,
					}),
				);
				break;
			case 'LINKED_ENTITY':
				this.doEventDispatch(
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
							lastAffectedByCardId: gameEvent.Value.AdditionalProps.LastAffectedByCardId,
					  }
					: null;
				this.doEventDispatch(GameEvent.build(GameEvent.CARD_CHANGED_ON_BOARD, gameEvent, summonAdditionProps2));
				break;
			case 'RECEIVE_CARD_IN_HAND':
				this.doEventDispatch(
					GameEvent.build(GameEvent.RECEIVE_CARD_IN_HAND, gameEvent, {
						creatorCardId: gameEvent.Value.AdditionalProps?.CreatorCardId,
						creatorEntityId: gameEvent.Value.AdditionalProps?.CreatorEntityId,
						isPremium: gameEvent.Value.AdditionalProps?.IsPremium,
						buffingEntityCardId: gameEvent.Value.AdditionalProps.BuffingEntityCardId,
						buffCardId: gameEvent.Value.AdditionalProps.BuffCardId,
						additionalPlayInfo: gameEvent.Value.AdditionalProps.AdditionalPlayInfo,
						dataNum1: gameEvent.Value.AdditionalProps?.DataNum1,
						dataNum2: gameEvent.Value.AdditionalProps?.DataNum2,
						position:
							// Tag index is 1-based, but it's more convenient for us to have 0-based index
							gameEvent.Value.AdditionalProps?.Position != null
								? gameEvent.Value.AdditionalProps?.Position - 1
								: null,
						referencedCardIds: gameEvent.Value.AdditionalProps?.ReferencedCardIds,
						tags: gameEvent.Value.AdditionalProps?.GuessedTags ?? [],
					}),
				);
				break;
			case 'CREATE_CARD_IN_GRAVEYARD':
				this.doEventDispatch(
					GameEvent.build(GameEvent.CREATE_CARD_IN_GRAVEYARD, gameEvent, {
						// Not always present?
						creatorCardId: gameEvent.Value.AdditionalProps && gameEvent.Value.AdditionalProps.CreatorCardId,
						isPremium: gameEvent.Value.AdditionalProps && gameEvent.Value.AdditionalProps.IsPremium,
						shouldRemoveFromInitialDeck: gameEvent.Value.AdditionalProps?.ShouldRemoveFromInitialDeck,
						lastAffectedByEntityId: gameEvent.Value.AdditionalProps?.LastAffectedByEntityId,
					}),
				);
				break;
			case 'CARD_BUFFED_IN_HAND':
				this.doEventDispatch(
					GameEvent.build(GameEvent.CARD_BUFFED_IN_HAND, gameEvent, {
						buffingEntityCardId: gameEvent.Value.AdditionalProps.BuffingEntityCardId,
						buffCardIds: gameEvent.Value.AdditionalProps.BuffCardIds,
					}),
				);
				break;
			case 'CARD_CREATOR_CHANGED':
				this.doEventDispatch(
					GameEvent.build(GameEvent.CARD_CREATOR_CHANGED, gameEvent, {
						creatorCardId: gameEvent.Value.AdditionalProps.CreatorCardId,
					}),
				);
				break;
			case 'END_OF_ECHO_IN_HAND':
				this.doEventDispatch(GameEvent.build(GameEvent.END_OF_ECHO_IN_HAND, gameEvent));
				break;
			case 'CREATE_CARD_IN_DECK':
				this.doEventDispatch(
					GameEvent.build(GameEvent.CREATE_CARD_IN_DECK, gameEvent, {
						creatorCardId: gameEvent.Value.AdditionalProps?.CreatorCardId,
						creatorEntityId: gameEvent.Value.AdditionalProps?.CreatorEntityId,
						createdByJoust: gameEvent.Value.AdditionalProps?.CreatedByJoust,
						influencedByCardId: gameEvent.Value.AdditionalProps?.InfluencedByCardId,
						influencedByEntityId: gameEvent.Value.AdditionalProps?.InfluencedByEntityId,
					}),
				);
				break;
			case 'ENCHANTMENT_ATTACHED':
				this.doEventDispatch(
					GameEvent.build(GameEvent.ENCHANTMENT_ATTACHED, gameEvent, {
						attachedTo: gameEvent.Value.AdditionalProps?.AttachedTo,
						tags: gameEvent.Value.AdditionalProps?.Tags ?? [],
						creatorEntityId: gameEvent.Value.AdditionalProps?.CreatorEntityId,
						creatorCardId: gameEvent.Value.AdditionalProps?.CreatorCardId,
					}),
				);
				break;
			case 'ENCHANTMENT_DETACHED':
				this.doEventDispatch(
					GameEvent.build(GameEvent.ENCHANTMENT_DETACHED, gameEvent, {
						attachedTo: gameEvent.Value.AdditionalProps?.AttachedTo,
					}),
				);
				break;
			case 'SECRET_PLAYED':
				this.doEventDispatch(
					GameEvent.build(GameEvent.SECRET_PLAYED, gameEvent, {
						playerClass:
							// Should always be the case, except in some older tests
							gameEvent.Value.AdditionalProps && gameEvent.Value.AdditionalProps.PlayerClass
								? gameEvent.Value.AdditionalProps.PlayerClass.toLowerCase()
								: null,
						cost: gameEvent.Value.AdditionalProps?.Cost,
					}),
				);
				break;
			case 'SECRET_PUT_IN_PLAY':
				this.doEventDispatch(
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
				this.doEventDispatch(
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
			case 'COUNTER_WILL_TRIGGER':
				this.doEventDispatch(
					GameEvent.build(
						GameEvent.COUNTER_WILL_TRIGGER,
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
			case 'COUNTER_TRIGGERED':
				this.doEventDispatch(GameEvent.build(GameEvent.COUNTER_TRIGGERED, gameEvent));
				break;
			case 'SECRET_TRIGGERED':
				this.doEventDispatch(
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
				this.doEventDispatch(GameEvent.build(GameEvent.SECRET_DESTROYED, gameEvent));
				break;
			case 'QUEST_COMPLETED':
			case 'BATTLEGROUNDS_QUEST_COMPLETED':
				this.doEventDispatch(GameEvent.build(GameEvent.QUEST_COMPLETED, gameEvent));
				break;
			case 'WEAPON_DESTROYED':
				this.doEventDispatch(GameEvent.build(GameEvent.WEAPON_DESTROYED, gameEvent));
				break;
			case 'MINION_GO_DORMANT':
				this.doEventDispatch(GameEvent.build(GameEvent.MINION_GO_DORMANT, gameEvent));
				break;
			case 'QUEST_PLAYED':
				this.doEventDispatch(
					GameEvent.build(GameEvent.QUEST_PLAYED, gameEvent, {
						playerClass:
							// Should always be the case, except in some older tests
							gameEvent.Value.AdditionalProps && gameEvent.Value.AdditionalProps.PlayerClass
								? gameEvent.Value.AdditionalProps.PlayerClass.toLowerCase()
								: null,
						cost: gameEvent.Value.AdditionalProps?.Cost,
					}),
				);
				break;
			case 'QUEST_DESTROYED':
				this.doEventDispatch(GameEvent.build(GameEvent.QUEST_DESTROYED, gameEvent));
				break;
			case 'REMOVE_FROM_HISTORY':
				this.doEventDispatch(GameEvent.build(GameEvent.REMOVE_FROM_HISTORY, gameEvent));
				break;
			case 'CARD_DRAW_FROM_DECK':
				this.doEventDispatch(
					GameEvent.build(GameEvent.CARD_DRAW_FROM_DECK, gameEvent, {
						isPremium: gameEvent.Value.AdditionalProps && gameEvent.Value.AdditionalProps.IsPremium,
						creatorCardId: gameEvent.Value.AdditionalProps?.CreatorCardId,
						creatorEntityId: gameEvent.Value.AdditionalProps?.CreatorEntityId,
						lastInfluencedByCardId: gameEvent.Value.AdditionalProps?.LastInfluencedByCardId,
						dataTag1: gameEvent.Value.AdditionalProps?.DataTag1,
						cost: gameEvent.Value.AdditionalProps?.Cost,
						drawnByCardId: gameEvent.Value.AdditionalProps?.DrawnByCardId,
						drawnByEntityId: gameEvent.Value.AdditionalProps?.DrawnByEntityId,
					}),
				);
				break;
			case 'GAME_RUNNING':
				console.log(gameEvent.Type + ' event', gameEvent.Value);
				this.doEventDispatch(
					GameEvent.build(GameEvent.GAME_RUNNING, gameEvent, {
						playerDeckCount: gameEvent.Value.AdditionalProps.PlayerDeckCount,
						opponentDeckCount: gameEvent.Value.AdditionalProps.OpponentDeckCount,
					}),
				);
				break;
			case 'CARD_BACK_TO_DECK':
				this.doEventDispatch(
					GameEvent.build(GameEvent.CARD_BACK_TO_DECK, gameEvent, {
						initialZone: gameEvent.Value.AdditionalProps.InitialZone,
						influencedByEntityId: gameEvent.Value.AdditionalProps.InfluencedByEntityId,
						influencedByCardId: gameEvent.Value.AdditionalProps.InfluencedByCardId,
					}),
				);
				break;
			case 'TRADE_CARD':
				this.doEventDispatch(
					GameEvent.build(GameEvent.TRADE_CARD, gameEvent, {
						initialZone: gameEvent.Value.AdditionalProps.InitialZone,
					}),
				);
				break;
			case 'CARD_REMOVED_FROM_DECK':
				this.doEventDispatch(
					GameEvent.build(GameEvent.CARD_REMOVED_FROM_DECK, gameEvent, {
						cost: gameEvent.Value.AdditionalProps?.Cost,
						removedByCardId: gameEvent.Value.AdditionalProps?.RemovedByCardId,
					}),
				);
				break;
			case 'CARD_REMOVED_FROM_HAND':
				this.doEventDispatch(GameEvent.build(GameEvent.CARD_REMOVED_FROM_HAND, gameEvent));
				break;
			case 'CARD_REMOVED_FROM_BOARD':
				this.doEventDispatch(
					GameEvent.build(GameEvent.CARD_REMOVED_FROM_BOARD, gameEvent, {
						removedByCardId: gameEvent.Value.AdditionalProps?.RemovedByCardId,
						removedByEntityId: gameEvent.Value.AdditionalProps?.RemovedByEntityId,
					}),
				);
				break;
			case 'BURNED_CARD':
				this.doEventDispatch(GameEvent.build(GameEvent.BURNED_CARD, gameEvent));
				break;
			case 'MULLIGAN_INITIAL_OPTION':
				this.doEventDispatch(GameEvent.build(GameEvent.MULLIGAN_INITIAL_OPTION, gameEvent));
				break;
			case 'CARD_ON_BOARD_AT_GAME_START':
				const additionalProps = gameEvent.Value.AdditionalProps
					? {
							health: gameEvent.Value.AdditionalProps.Health,
							creatorCardId: gameEvent.Value.AdditionalProps.CreatorCardId,
					  }
					: null;
				this.doEventDispatch(
					GameEvent.build(GameEvent.CARD_ON_BOARD_AT_GAME_START, gameEvent, additionalProps),
				);
				break;
			case 'CARD_STOLEN':
				this.doEventDispatch(
					GameEvent.build(GameEvent.CARD_STOLEN, gameEvent, {
						newControllerId: gameEvent.Value.AdditionalProps.newControllerId,
						zone: gameEvent.Value.AdditionalProps.zone,
						stolenByCardId: gameEvent.Value.AdditionalProps.StolenByCardId,
						stolenByEntityId: gameEvent.Value.AdditionalProps.StolenByEntityId,
					}),
				);
				break;
			case 'FIRST_PLAYER':
				this.doEventDispatch(GameEvent.build(GameEvent.FIRST_PLAYER, gameEvent));
				break;
			case 'PASSIVE_BUFF':
				console.debug(gameEvent.Type + ' event', gameEvent.Value.CardId);
				this.doEventDispatch(GameEvent.build(GameEvent.PASSIVE_BUFF, gameEvent));
				break;
			case 'MINION_ON_BOARD_ATTACK_UPDATED':
				this.doEventDispatch(
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
				this.doEventDispatch(
					GameEvent.build(GameEvent.CARD_CHANGED_IN_HAND, gameEvent, {
						creatorCardId: gameEvent.Value.AdditionalProps.CreatorCardId,
						lastAffectedByCardId: gameEvent.Value.AdditionalProps.LastAffectedByCardId,
					}),
				);
				break;
			case 'CARD_CHANGED_IN_DECK':
				this.doEventDispatch(
					GameEvent.build(GameEvent.CARD_CHANGED_IN_DECK, gameEvent, {
						creatorCardId: gameEvent.Value.AdditionalProps.CreatorCardId,
						subSpell: gameEvent.Value.AdditionalProps.SubSpell,
						lastAffectedByCardId: gameEvent.Value.AdditionalProps.LastAffectedByCardId,
					}),
				);
				break;
			case 'CARD_DREDGED':
				this.doEventDispatch(
					GameEvent.build(GameEvent.CARD_DREDGED, gameEvent, {
						dredgedByEntityId: gameEvent.Value.AdditionalProps.DredgedByEntityId,
						dredgedByCardId: gameEvent.Value.AdditionalProps.DredgedByCardId,
						lastInfluencedByCardId: gameEvent.Value.AdditionalProps.LastInfluencedByCardId,
					}),
				);
				break;
			case 'ARMOR_CHANGED':
				this.doEventDispatch(
					GameEvent.build(GameEvent.ARMOR_CHANGED, gameEvent, {
						armorChange: gameEvent.Value.AdditionalProps.InitialData1,
						totalArmor: gameEvent.Value.AdditionalProps.TotalArmor,
						playerId: gameEvent.Value.AdditionalProps.PlayerId,
					}),
				);
				break;
			case 'LOCATION_USED':
				this.doEventDispatch(GameEvent.build(GameEvent.LOCATION_USED, gameEvent));
				break;
			case 'LOCATION_DESTROYED':
				this.doEventDispatch(GameEvent.build(GameEvent.LOCATION_DESTROYED, gameEvent));
				break;
			case 'BLOOD_GEM_BUFF_CHANGED':
				this.doEventDispatch(
					GameEvent.build(GameEvent.BLOOD_GEM_BUFF_CHANGED, gameEvent, {
						attack: gameEvent.Value.AdditionalProps.Attack,
						health: gameEvent.Value.AdditionalProps.Health,
					}),
				);
				break;
			case 'BEETLE_ARMY_CHANGED':
				this.doEventDispatch(
					GameEvent.build(GameEvent.BEETLE_ARMY_CHANGED, gameEvent, {
						attack: gameEvent.Value.AdditionalProps.Attack,
						health: gameEvent.Value.AdditionalProps.Health,
					}),
				);
				break;
			case 'TOTAL_MAGNETIZE_CHANGED':
				this.doEventDispatch(
					GameEvent.build(GameEvent.TOTAL_MAGNETIZE_CHANGED, gameEvent, {
						newValue: gameEvent.Value.AdditionalProps.NewValue,
					}),
				);
				break;
			case 'BALLER_BUFF_CHANGED':
				this.doEventDispatch(
					GameEvent.build(GameEvent.BALLER_BUFF_CHANGED, gameEvent, {
						buff: gameEvent.Value.AdditionalProps.Buff,
					}),
				);
				break;
			case 'EXCAVATE_TIER_CHANGED':
				this.doEventDispatch(
					GameEvent.build(GameEvent.EXCAVATE_TIER_CHANGED, gameEvent, {
						currentTier: gameEvent.Value.AdditionalProps.CurrentTier,
						maxTier: gameEvent.Value.AdditionalProps.MaxTier,
					}),
				);
				break;
			case 'CORPSES_SPENT_THIS_GAME_CHANGED':
				this.doEventDispatch(
					GameEvent.build(GameEvent.CORPSES_SPENT_THIS_GAME_CHANGED, gameEvent, {
						value: gameEvent.Value.AdditionalProps.Value,
					}),
				);
				break;
			case 'OVERLOADED_CRYSTALS_CHANGED':
				this.doEventDispatch(
					GameEvent.build(GameEvent.OVERLOADED_CRYSTALS_CHANGED, gameEvent, {
						overload: gameEvent.Value.AdditionalProps.Overload,
					}),
				);
				break;
			case 'HEALTH_DEF_CHANGED':
				this.doEventDispatch(
					GameEvent.build(GameEvent.HEALTH_DEF_CHANGED, gameEvent, {
						newHealth: gameEvent.Value.AdditionalProps.NewHealth,
					}),
				);
				break;
			case 'MAX_RESOURCES_UPDATED':
				console.debug(gameEvent.Type + ' event', gameEvent.Value);
				this.doEventDispatch(
					GameEvent.build(GameEvent.MAX_RESOURCES_UPDATED, gameEvent, {
						playerId: gameEvent.Value.AdditionalProps.PlayerId,
						mana: gameEvent.Value.AdditionalProps.Mana,
						health: gameEvent.Value.AdditionalProps.Health,
					}),
				);
				break;
			case 'NUM_CARDS_PLAYED_THIS_TURN':
				this.doEventDispatch(
					GameEvent.build(GameEvent.NUM_CARDS_PLAYED_THIS_TURN, gameEvent, {
						cardsPlayed: gameEvent.Value.AdditionalProps.NumCardsPlayed,
					}),
				);
				break;
			case 'NUM_CARDS_DRAWN_THIS_TURN':
				this.doEventDispatch(
					GameEvent.build(GameEvent.NUM_CARDS_DRAW_THIS_TURN, gameEvent, {
						cardsDrawn: gameEvent.Value.AdditionalProps.NumCardsDrawn,
					}),
				);
				break;
			case 'RESOURCES_THIS_TURN':
				this.doEventDispatch(
					GameEvent.build(GameEvent.RESOURCES_THIS_TURN, gameEvent, {
						resources: gameEvent.Value.AdditionalProps.Resources,
					}),
				);
				break;
			case 'RESOURCES_UPDATED':
				this.doEventDispatch(
					GameEvent.build(GameEvent.RESOURCES_UPDATED, gameEvent, {
						resourcesTotal: gameEvent.Value.AdditionalProps.ResourcesTotal,
						resourcesUsed: gameEvent.Value.AdditionalProps.ResourcesUsed,
						resourcesLeft: gameEvent.Value.AdditionalProps.ResourcesLeft,
					}),
				);
				break;
			case 'ATTACKING_HERO':
				this.doEventDispatch(
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
			case 'FATIGUE_DAMAGE':
				this.doEventDispatch(
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
			case 'COPIED_FROM_ENTITY_ID':
				this.doEventDispatch(
					CopiedFromEntityIdGameEvent.build(GameEvent.COPIED_FROM_ENTITY_ID, gameEvent, {
						copiedCardControllerId: gameEvent.Value.AdditionalProps.CopiedCardControllerId,
						copiedCardEntityId: gameEvent.Value.AdditionalProps.CopiedCardEntityId,
						copiedCardZone: gameEvent.Value.AdditionalProps.CopiedCardZone,
					}),
				);
				break;
			case 'CHOOSING_OPTIONS':
				this.doEventDispatch(
					ChoosingOptionsGameEvent.build(GameEvent.CHOOSING_OPTIONS, gameEvent, {
						options: gameEvent.Value.AdditionalProps.Options,
						context: gameEvent.Value.AdditionalProps.Context,
					}),
				);
				break;
			case 'HEALING':
				this.doEventDispatch(
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
				this.doEventDispatch(
					Object.assign(new GameEvent(), {
						type: GameEvent.TURN_START,
						localPlayer: gameEvent.Value.LocalPlayer,
						opponentPlayer: gameEvent.Value.OpponentPlayer,
						additionalData: {
							// Legacy, to avoid regenerating all the tests
							turnNumber: gameEvent.Value.Turn || gameEvent.Value,
							activePlayerId: gameEvent.Value.ActivePlayerId,
							timestamp: gameEvent.Value.Timestamp,
						},
					} as GameEvent),
				);
				break;
			case 'LOCAL_PLAYER_LEADERBOARD_PLACE_CHANGED':
				this.doEventDispatch(
					Object.assign(new GameEvent(), {
						type: GameEvent.LOCAL_PLAYER_LEADERBOARD_PLACE_CHANGED,
						additionalData: {
							newPlace: gameEvent.Value.AdditionalProps.NewPlace,
						},
					} as GameEvent),
				);
				break;
			case 'GALAKROND_INVOKED':
				this.doEventDispatch(
					GameEvent.build(GameEvent.GALAKROND_INVOKED, gameEvent, {
						totalInvoke: gameEvent.Value.AdditionalProps.TotalInvoke,
					}),
				);
				break;
			case 'PARENT_CARD_CHANGED':
				this.doEventDispatch(
					GameEvent.build(GameEvent.PARENT_CARD_CHANGED, gameEvent, {
						newParentEntityId: gameEvent.Value.AdditionalProps.NewParentEntityId,
					}),
				);
				break;
			case 'BATTLEGROUNDS_HERO_SELECTION':
				console.log(gameEvent.Type + ' event', gameEvent);
				this.doEventDispatch(
					Object.assign(new GameEvent(), {
						type: GameEvent.BATTLEGROUNDS_HERO_SELECTION,
						additionalData: {
							options: gameEvent.Value.Options?.map((o) => ({ cardId: o.CardId, entityId: o.EntityId })),
						},
					} as GameEvent),
				);
				break;
			case 'BATTLEGROUNDS_HERO_REROLL':
				console.log(gameEvent.Type + ' event', gameEvent);
				this.doEventDispatch(GameEvent.build(GameEvent.BATTLEGROUNDS_HERO_REROLL, gameEvent));
				break;
			case 'BATTLEGROUNDS_HERO_SELECTED':
				console.log(gameEvent.Type + ' event', gameEvent);
				this.doEventDispatch(
					GameEvent.build(GameEvent.BATTLEGROUNDS_HERO_SELECTED, gameEvent, {
						// These are set after a reconnect, and usually not present when the match starts
						leaderboardPlace: gameEvent.Value.LeaderboardPlace,
						health: gameEvent.Value.Health,
						armor: gameEvent.Value.Armor,
						damage: gameEvent.Value.Damage,
						tavernLevel: gameEvent.Value.TavernLevel,
						nextOpponentCardId: gameEvent.Value.NextOpponentCardId,
						nextOpponentPlayerId: gameEvent.Value.NextOpponentPlayerId,
					}),
				);
				break;
			case 'BATTLEGROUNDS_TRINKET_SELECTION':
				console.log(gameEvent.Type + ' event', gameEvent);
				this.doEventDispatch(
					Object.assign(new GameEvent(), {
						type: GameEvent.BATTLEGROUNDS_TRINKET_SELECTION,
						additionalData: {
							options: gameEvent.Value.Options,
						},
					} as GameEvent),
				);
				break;
			case 'BATTLEGROUNDS_TRINKET_SELECTED':
				console.log(gameEvent.Type + ' event', gameEvent);
				this.doEventDispatch(
					GameEvent.build(GameEvent.BATTLEGROUNDS_TRINKET_SELECTED, gameEvent, {
						heroCardId: gameEvent.Value.AdditionalProps.HeroCardId,
						trinketDbfId: gameEvent.Value.AdditionalProps.TrinketDbfId,
						isFirstTrinket: gameEvent.Value.AdditionalProps.IsFirstTrinket,
						playerId: gameEvent.Value.PlayerId,
					}),
				);
				break;
			case 'BATTLEGROUNDS_TRIPLE':
				this.doEventDispatch(
					Object.assign(new GameEvent(), {
						type: GameEvent.BATTLEGROUNDS_TRIPLE,
						cardId: gameEvent.Value.CardId,
						additionalData: {
							playerId: gameEvent.Value.PlayerId,
						},
					} as GameEvent),
				);
				break;
			case 'BATTLEGROUNDS_REROLL':
				this.doEventDispatch(
					Object.assign(new GameEvent(), {
						type: GameEvent.BATTLEGROUNDS_REROLL,
					} as GameEvent),
				);
				break;
			case 'BATTLEGROUNDS_FREEZE':
				this.doEventDispatch(
					Object.assign(new GameEvent(), {
						type: GameEvent.BATTLEGROUNDS_FREEZE,
					} as GameEvent),
				);
				break;
			case 'BATTLEGROUNDS_COMBAT_START':
				// console.log(gameEvent.Type + ' event');
				this.doEventDispatch(
					Object.assign(new GameEvent(), {
						type: GameEvent.BATTLEGROUNDS_COMBAT_START,
						additionalData: {
							heroes: gameEvent.Value.Heroes,
							turnNumber: gameEvent.Value.Turn,
						},
					} as GameEvent),
				);
				break;
			case 'BATTLEGROUNDS_RECRUIT_PHASE':
				// console.log(gameEvent.Type + ' event');
				this.doEventDispatch(
					Object.assign(new GameEvent(), {
						type: GameEvent.BATTLEGROUNDS_RECRUIT_PHASE,
						additionalData: {
							heroes: gameEvent.Value.Heroes,
							turnNumber: gameEvent.Value.Turn,
						},
					} as GameEvent),
				);
				break;
			case 'BATTLEGROUNDS_BATTLE_RESULT':
				console.log(gameEvent.Type + ' event', gameEvent.Value.Opponent, gameEvent.Value.Result);
				this.doEventDispatch(
					Object.assign(new GameEvent(), {
						type: GameEvent.BATTLEGROUNDS_BATTLE_RESULT,
						additionalData: {
							opponent: gameEvent.Value.Opponent,
							opponentPlayerId: gameEvent.Value.OpponentPlayerId,
							result: gameEvent.Value.Result,
							damage: gameEvent.Value.Damage,
						},
					} as GameEvent),
				);
				break;
			case 'BATTLEGROUNDS_NEXT_OPPONENT':
				console.log(gameEvent.Type + ' event', gameEvent.Value);
				this.doEventDispatch(
					Object.assign(new GameEvent(), {
						type: GameEvent.BATTLEGROUNDS_NEXT_OPPONENT,
						additionalData: {
							nextOpponentCardId: gameEvent.Value.CardId,
							nextOpponentPlayerId: gameEvent.Value.OpponentPlayerId,
							isSameOpponent: gameEvent.Value.IsSameOpponent,
						},
					} as GameEvent),
				);
				break;
			case 'BATTLEGROUNDS_OPPONENT_REVEALED':
				// console.log(gameEvent.Type + ' event', gameEvent.Value.CardId);
				this.doEventDispatch(
					Object.assign(new GameEvent(), {
						type: GameEvent.BATTLEGROUNDS_OPPONENT_REVEALED,
						additionalData: {
							cardId: gameEvent.Value.CardId,
							playerId: gameEvent.Value.PlayerId,
							leaderboardPlace: gameEvent.Value.LeaderboardPlace,
							health: gameEvent.Value.Health,
							armor: gameEvent.Value.Armor,
						},
					} as GameEvent),
				);
				break;
			case 'BATTLEGROUNDS_MINION_BOUGHT':
				this.doEventDispatch(GameEvent.build(GameEvent.BATTLEGROUNDS_MINION_BOUGHT, gameEvent));
				break;
			case 'BATTLEGROUNDS_MINION_SOLD':
				this.doEventDispatch(GameEvent.build(GameEvent.BATTLEGROUNDS_MINION_SOLD, gameEvent));
				break;
			// case 'BATTLEGROUNDS_EXTRA_GOLD_NEXT_TURN':
			// 	console.debug('[game-events] emitting BATTLEGROUNDS_EXTRA_GOLD_NEXT_TURN', gameEvent);
			// 	this.doEventDispatch(
			// 		GameEvent.build(GameEvent.BATTLEGROUNDS_EXTRA_GOLD_NEXT_TURN, gameEvent, {
			// 			extraGold: gameEvent.Value.AdditionalProps.ExtraGoldNextTurn,
			// 			overconfidences: gameEvent.Value.AdditionalProps.Overconfidences,
			// 			boardAndEnchantments: gameEvent.Value.AdditionalProps.BoardAndEnchantments,
			// 		}),
			// 	);
			// 	break;
			case 'BATTLEGROUNDS_ENEMY_HERO_KILLED':
				this.doEventDispatch(GameEvent.build(GameEvent.BATTLEGROUNDS_ENEMY_HERO_KILLED, gameEvent));
				break;
			case 'BATTLEGROUNDS_BATTLE_STARTING':
				console.debug('[game-events] emitting BATTLEGROUNDS_BATTLE_STARTING', gameEvent);
				this.doEventDispatch(
					Object.assign(new GameEvent(), {
						type: GameEvent.BATTLEGROUNDS_BATTLE_STARTING,
					} as GameEvent),
				);
				break;
			case 'BATTLEGROUNDS_ACTIVE_PLAYER_BOARD':
				console.debug('[game-events] receiving BATTLEGROUNDS_ACTIVE_PLAYER_BOARD' + gameEvent.Type, gameEvent);
				this.doEventDispatch(
					Object.assign(new GameEvent(), {
						type: GameEvent.BATTLEGROUNDS_ACTIVE_PLAYER_BOARD,
					} as GameEvent),
				);
				break;
			case 'BATTLEGROUNDS_PLAYER_BOARD':
			case 'BATTLEGROUNDS_DUO_FUTURE_TEAMMATE_BOARD':
				const eventName =
					gameEvent.Type === 'BATTLEGROUNDS_PLAYER_BOARD'
						? GameEvent.BATTLEGROUNDS_PLAYER_BOARD
						: GameEvent.BATTLEGROUNDS_DUO_FUTURE_TEAMMATE_BOARD;
				console.debug('[game-events] receiving ' + gameEvent.Type, gameEvent, eventName);
				const playerBoardEvent = this.buildBattlegroundsPlayerBoardEvent(eventName, gameEvent);
				this.doEventDispatch(playerBoardEvent);
				break;
			case 'BATTLEGROUNDS_LEADERBOARD_PLACE':
				this.doEventDispatch(
					Object.assign(new GameEvent(), {
						type: GameEvent.BATTLEGROUNDS_LEADERBOARD_PLACE,
						additionalData: {
							cardId: gameEvent.Value.CardId,
							playerId: gameEvent.Value.PlayerId,
							leaderboardPlace: gameEvent.Value.LeaderboardPlace,
						},
					} as GameEvent),
				);
				break;
			case 'BATTLEGROUNDS_TAVERN_UPGRADE':
				// console.log('BATTLEGROUNDS_TAVERN_UPGRADE', gameEvent.Value.CardId, gameEvent.Value.TavernLevel);
				this.doEventDispatch(
					Object.assign(new GameEvent(), {
						type: GameEvent.BATTLEGROUNDS_TAVERN_UPGRADE,
						additionalData: {
							cardId: gameEvent.Value.CardId,
							playerId: gameEvent.Value.PlayerId,
							tavernLevel: gameEvent.Value.TavernLevel,
						},
					} as GameEvent),
				);
				break;
			case 'BATTLEGROUNDS_BUDDY_GAINED':
				this.doEventDispatch(
					Object.assign(new GameEvent(), {
						type: GameEvent.BATTLEGROUNDS_BUDDY_GAINED,
						additionalData: {
							cardId: gameEvent.Value.CardId,
							playerId: gameEvent.Value.PlayerId,
							totalBuddies: gameEvent.Value.TotalBuddies,
						},
					} as GameEvent),
				);
				break;
			case 'BATTLEGROUNDS_REWARD_REVEALED':
				console.debug(gameEvent.Type + ' event', gameEvent);
				this.doEventDispatch(
					GameEvent.build(GameEvent.BATTLEGROUNDS_REWARD_REVEALED, gameEvent, {
						questRewardDbfId: gameEvent.Value.AdditionalProps.QuestRewardDbfId,
						isHeroPowerReward: gameEvent.Value.AdditionalProps.IsHeroPowerReward,
						playerId: gameEvent.Value.AdditionalProps.PlayerId,
					}),
				);
				break;
			case 'BATTLEGROUNDS_REWARD_GAINED':
				console.debug(gameEvent.Type + ' event', gameEvent);
				this.doEventDispatch(
					GameEvent.build(GameEvent.BATTLEGROUNDS_REWARD_GAINED, gameEvent, {
						questRewardDbfId: gameEvent.Value.AdditionalProps.QuestRewardDbfId,
						isHeroPowerReward: gameEvent.Value.AdditionalProps.IsHeroPowerReward,
						playerId: gameEvent.Value.AdditionalProps.PlayerId,
					}),
				);
				break;
			case 'BATTLEGROUNDS_QUEST_REWARD_EQUIPPED':
				// console.debug(gameEvent.Type + ' event', gameEvent);
				this.doEventDispatch(
					GameEvent.build(GameEvent.BATTLEGROUNDS_QUEST_REWARD_EQUIPPED, gameEvent, {
						isHeroPowerReward: gameEvent.Value.AdditionalProps.IsHeroPowerReward,
						playerId: gameEvent.Value.AdditionalProps.PlayerId,
					}),
				);
				break;
			case 'BATTLEGROUNDS_QUEST_REWARD_DESTROYED':
				// console.debug(gameEvent.Type + ' event', gameEvent);
				this.doEventDispatch(
					GameEvent.build(GameEvent.BATTLEGROUNDS_QUEST_REWARD_DESTROYED, gameEvent, {
						isHeroPowerReward: gameEvent.Value.AdditionalProps.IsHeroPowerReward,
						playerId: gameEvent.Value.AdditionalProps.PlayerId,
					}),
				);
				break;
			case 'WINNER':
				console.log(gameEvent.Type + ' event', { ...gameEvent.Value.Winner, Tags: null });
				this.doEventDispatch(
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
				this.doEventDispatch(
					Object.assign(new GameEvent(), {
						type: GameEvent.TIE,
					} as GameEvent),
				);
				break;
			case 'GAME_END':
				console.log(gameEvent.Type + ' event');
				this.doEventDispatch(
					Object.assign(new GameEvent(), {
						type: GameEvent.GAME_END,
						localPlayer: gameEvent.Value.LocalPlayer,
						opponentPlayer: gameEvent.Value.OpponentPlayer,
						additionalData: {
							// game: gameEvent.Value.Game,
							report: gameEvent.Value.GameStateReport,
							replayXml: gameEvent.Value.ReplayXml,
							spectating: gameEvent.Value.Spectating,
							GameType: gameEvent.Value.GameType,
							FormatType: gameEvent.Value.FormatType,
							ScenarioID: gameEvent.Value.ScenarioID,
						},
					} as GameEvent),
				);
				break;
			case 'GAME_STATE_UPDATE':
				if (gameEvent.Value.GameState != null) {
					this.doEventDispatch(GameEvent.build(GameEvent.GAME_STATE_UPDATE, gameEvent));
				}
				break;
			case 'ENTITY_UPDATE':
				this.doEventDispatch(
					GameEvent.build(GameEvent.ENTITY_UPDATE, gameEvent, {
						mercenariesExperience: gameEvent.Value.AdditionalProps?.MercenariesExperience,
						mercenariesEquipmentId: gameEvent.Value.AdditionalProps?.MercenariesEquipmentId,
						abilityOwnerEntityId: gameEvent.Value.AdditionalProps?.AbilityOwnerEntityId,
						abilityCooldownConfig: gameEvent.Value.AdditionalProps?.AbilityCooldownConfig,
						abilityCurrentCooldown: gameEvent.Value.AdditionalProps?.AbilityCurrentCooldown,
						abilitySpeed: gameEvent.Value.AdditionalProps?.AbilitySpeed,
						zonePosition: gameEvent.Value.AdditionalProps?.ZonePosition,
						zone: gameEvent.Value.AdditionalProps?.Zone,
						revealed: gameEvent.Value.AdditionalProps?.Revealed,
						dataNum1: gameEvent.Value.AdditionalProps?.DataNum1,
						dataNum2: gameEvent.Value.AdditionalProps?.DataNum2,
					}),
				);
				break;
			case 'ENTITY_CHOSEN':
				this.doEventDispatch(
					GameEvent.build(GameEvent.ENTITY_CHOSEN, gameEvent, {
						originalEntityId: gameEvent.Value.AdditionalProps?.OriginalEntityId,
						context: {
							creatorEntityId: gameEvent.Value.AdditionalProps?.Context?.CreatorEntityId,
							creatorCardId: gameEvent.Value.AdditionalProps?.Context?.CreatorCardId,
						},
					}),
				);
				break;
			case 'ZONE_CHANGED':
				this.doEventDispatch(
					GameEvent.build(GameEvent.ZONE_CHANGED, gameEvent, {
						zone: gameEvent.Value.AdditionalProps.Zone,
					}),
				);
				break;
			case 'COST_CHANGED':
				this.doEventDispatch(
					GameEvent.build(GameEvent.COST_CHANGED, gameEvent, {
						cost: gameEvent.Value.AdditionalProps.NewCost,
						abilityOwnerEntityId: gameEvent.Value.AdditionalProps.AbilityOwnerEntityId,
					}),
				);
				break;
			case 'WHIZBANG_DECK_ID':
				this.doEventDispatch(
					GameEvent.build(GameEvent.WHIZBANG_DECK_ID, gameEvent, {
						deckId: gameEvent.Value.AdditionalProps.DeckId,
					}),
				);
				break;
			case 'RECONNECT_START':
				console.log(gameEvent.Type + ' event', gameEvent);
				this.doEventDispatch(Object.assign(new GameEvent(), { type: GameEvent.RECONNECT_START }));
				break;
			case 'RECONNECT_OVER':
				console.log(gameEvent.Type + ' event', gameEvent);
				this.doEventDispatch(Object.assign(new GameEvent(), { type: GameEvent.RECONNECT_OVER }));
				break;
			case 'SPECTATING':
				console.log(gameEvent.Type + ' event', gameEvent);
				this.doEventDispatch(
					Object.assign(new GameEvent(), {
						type: GameEvent.SPECTATING,
						additionalData: { spectating: gameEvent.Value?.Spectating },
					} as GameEvent),
				);
				break;

			case 'ZONE_POSITION_CHANGED':
				this.doEventDispatch(
					GameEvent.build(GameEvent.ZONE_POSITION_CHANGED, gameEvent, {
						zonePosition: gameEvent.Value.AdditionalProps.ZonePosition,
					}),
				);
				break;
			case 'DAMAGE':
				this.doEventDispatch(
					Object.assign(new DamageGameEvent(), {
						type: GameEvent.DAMAGE,
						localPlayer: gameEvent.Value.LocalPlayer,
						opponentPlayer: gameEvent.Value.OpponentPlayer,
						additionalData: {
							sourceCardId: gameEvent.Value.SourceCardId,
							sourceEntityId: gameEvent.Value.SourceEntityId,
							sourceControllerId: gameEvent.Value.SourceControllerId,
							targets: gameEvent.Value.Targets,
							activePlayerId: gameEvent.Value.ActivePlayerId,
						},
					} as DamageGameEvent),
				);
				break;
			case 'ATTACKING_MINION':
				this.doEventDispatch(
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
			case 'DATA_SCRIPT_CHANGED':
				this.doEventDispatch(
					GameEvent.build(GameEvent.DATA_SCRIPT_CHANGED, gameEvent, {
						initialData1: gameEvent.Value.AdditionalProps.InitialData1,
						initialData2: gameEvent.Value.AdditionalProps.InitialData2,
						dataNum1: gameEvent.Value.AdditionalProps.DataNum1,
						dataNum2: gameEvent.Value.AdditionalProps.DataNum2,
					}),
				);
				break;
			case 'DEATHRATTLE_TRIGGERED':
				this.doEventDispatch(GameEvent.build(GameEvent.DEATHRATTLE_TRIGGERED, gameEvent));
				break;
			case 'MINION_SUMMONED':
				const summonAdditionProps = gameEvent.Value.AdditionalProps
					? {
							creatorCardId: gameEvent.Value.AdditionalProps.CreatorCardId,
							tags: gameEvent.Value.AdditionalProps.Tags,
					  }
					: null;
				this.doEventDispatch(GameEvent.build(GameEvent.MINION_SUMMONED, gameEvent, summonAdditionProps));
				break;
			case 'MINIONS_DIED':
				this.doEventDispatch(
					Object.assign(new MinionsDiedEvent(), {
						type: GameEvent.MINIONS_DIED,
						localPlayer: gameEvent.Value.LocalPlayer,
						opponentPlayer: gameEvent.Value.OpponentPlayer,
						additionalData: {
							deadMinions: gameEvent.Value.AdditionalProps.DeadMinions,
							activePlayerId: gameEvent.Value.AdditionalProps.ActivePlayerId,
						},
					} as MinionsDiedEvent),
				);
				break;
			case 'MINIONS_WILL_DIE':
				this.doEventDispatch(
					Object.assign(new MinionsDiedEvent(), {
						type: GameEvent.MINIONS_WILL_DIE,
						localPlayer: gameEvent.Value.LocalPlayer,
						opponentPlayer: gameEvent.Value.OpponentPlayer,
						additionalData: {
							deadMinions: gameEvent.Value.AdditionalProps.DeadMinions,
						},
					} as MinionsDiedEvent),
				);
				break;

			case 'MERCENARIES_HERO_REVEALED':
				this.doEventDispatch(
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
				this.doEventDispatch(
					GameEvent.build(GameEvent.MERCENARIES_ABILITY_REVEALED, gameEvent, {
						abilityOwnerEntityId: gameEvent.Value.AdditionalProps.AbilityOwnerEntityId,
						abilityCooldownConfig: gameEvent.Value.AdditionalProps.AbilityCooldownConfig,
						abilityCurrentCooldown: gameEvent.Value.AdditionalProps.AbilityCurrentCooldown,
						abilitySpeed: gameEvent.Value.AdditionalProps.AbilitySpeed,
						abilityNameData1: gameEvent.Value.AdditionalProps.AbilityNameData1,
						isTreasure: gameEvent.Value.AdditionalProps.IsTreasure,
					}),
				);
				break;
			case 'MERCENARIES_EQUIPMENT_REVEALED':
				this.doEventDispatch(
					GameEvent.build(GameEvent.MERCENARIES_EQUIPMENT_REVEALED, gameEvent, {
						equipmentOwnerEntityId: gameEvent.Value.AdditionalProps.AbilityOwnerEntityId,
						abilityNameData1: gameEvent.Value.AdditionalProps.AbilityNameData1,
					}),
				);
				break;
			case 'MERCENARIES_ABILITY_UPDATE':
				this.doEventDispatch(
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
				this.doEventDispatch(
					GameEvent.build(GameEvent.MERCENARIES_ABILITY_ACTIVATED, gameEvent, {
						abilityOwnerEntityId: gameEvent.Value.AdditionalProps.AbilityOwnerEntityId,
					}),
				);
				break;
			case 'MERCENARIES_EQUIPMENT_UPDATE':
				this.doEventDispatch(
					GameEvent.build(GameEvent.MERCENARIES_EQUIPMENT_UPDATE, gameEvent, {
						equipmentOwnerEntityId: gameEvent.Value.AdditionalProps.AbilityOwnerEntityId,
						equipmentCooldownConfig: gameEvent.Value.AdditionalProps.AbilityCooldownConfig,
						equipmentCurrentCooldown: gameEvent.Value.AdditionalProps.AbilityCurrentCooldown,
						equipmentSpeed: gameEvent.Value.AdditionalProps.AbilitySpeed,
					}),
				);
				break;
			case 'MERCENARIES_COOLDOWN_UPDATED':
				this.doEventDispatch(
					GameEvent.build(GameEvent.MERCENARIES_COOLDOWN_UPDATED, gameEvent, {
						newCooldown: gameEvent.Value.AdditionalProps.NewCooldown,
						abilityOwnerEntityId: gameEvent.Value.AdditionalProps.AbilityOwnerEntityId,
					}),
				);
				break;
			case 'MERCENARIES_ABILITY_QUEUED':
				this.doEventDispatch(
					GameEvent.build(GameEvent.MERCENARIES_ABILITY_QUEUED, gameEvent, {
						abillityEntityId: gameEvent.Value.AdditionalProps.AbillityEntityId,
						abilityCardId: gameEvent.Value.AdditionalProps.AbilityCardId,
						abilitySpeed: gameEvent.Value.AdditionalProps.AbilitySpeed,
					}),
				);
				break;
			case 'MERCENARIES_ABILITY_UNQUEUED':
				this.doEventDispatch(GameEvent.build(GameEvent.MERCENARIES_ABILITY_UNQUEUED, gameEvent));
				break;
			case 'SPECIAL_CARD_POWER_TRIGGERED':
				this.doEventDispatch(
					GameEvent.build(GameEvent.SPECIAL_CARD_POWER_TRIGGERED, gameEvent, {
						relatedCards: gameEvent.Value.AdditionalProps.RelatedCards,
					}),
				);
				break;
			case 'WHEEL_OF_DEATH_COUNTER_UPDATED':
				this.doEventDispatch(
					GameEvent.build(GameEvent.WHEEL_OF_DEATH_COUNTER_UPDATED, gameEvent, {
						turnsBeforeControllerDies: gameEvent.Value.AdditionalProps.TurnsBeforeControllerDies,
					}),
				);
				break;
			case 'MERCENARIES_SELECTED_TARGET':
			case 'MERCENARIES_UNSELECTED_TARGET':
				break;
			default:
				console.warn('unsupported game event', gameEvent);
		}
		const timeSpent = Date.now() - start;
		this.totalTime += timeSpent;
	}

	public receiveLogLine(data: string, postponed = false) {
		// In case the game overrides the info during the process, we stop everything and start from scratch
		if (data === 'truncated') {
			console.log(
				'[game-events] HS log file truncated, clearing queue',
				this.existingLogLines?.length,
				this.processingQueue.eventsPendingCount(),
			);
			// this.setSpectating(false);
			this.existingLogLines.clear();
			this.processingQueue.clear();
			return;
		}
		if (data.includes('Truncating log, which has reached the size limit')) {
			this.globalError.notifyCriticalError('truncated-logs');
			return;
		}
		if (data.includes('Begin Spectating') || data.includes('Start Spectator')) {
			console.log('begin spectating', data);
		}
		if (data.includes('End Spectator')) {
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

		// Hack to try and get the board state a bit early
		// See comments in BattlegroundsPLayerBoardParser
		// if (data.includes('BACON_CHOSEN_BOARD_SKIN_ID') && !postponed) {
		// 	console.debug('[game-events] postponing BACON_CHOSEN_BOARD_SKIN_ID', data);
		// 	setTimeout(() => this.receiveLogLine(data, true), 1000);
		// 	return;
		// }

		if (this.existingLogLines.length > 0) {
			// Put them in a "waiting" list, to be processed once we're done catching up
			this.pendingLogLines.push(data);
		} else {
			if (this.pendingLogLines.length > 0) {
				console.log('[game-events] processing pending log lines');
				this.processingQueue.enqueueAll(this.pendingLogLines.toArray());
				this.pendingLogLines.clear();
			}
			this.processingQueue.enqueue(data);
		}
	}

	private pendingLogLines: Deque<string> = new Deque<string>();
	private existingLogLines: Deque<string> = new Deque<string>();
	private catchingUp: boolean;
	private pluginBeingInitialized: boolean;

	public isCatchingUpLogLines(): boolean {
		return this.catchingUp;
	}

	private spectateLineToEnqueue: string;

	// Handles reading a log file mid-game, i.e. this data is already
	// present in the log file when we're trying to read it
	public receiveExistingLogLine(existingLine: string) {
		if (existingLine.includes('Begin Spectating') || existingLine.includes('Start Spectator')) {
			console.log('[game-events] [existing] begin spectating', existingLine);
			this.spectateLineToEnqueue = existingLine;
		}
		if (existingLine.includes('End Spectator')) {
			console.log('[game-events] [existing] end spectating', existingLine);
			this.spectateLineToEnqueue = null;
		}

		if (existingLine === 'end_of_existing_data' && this.existingLogLines.length > 0) {
			console.log('[game-events] [existing] end_of_existing_data', this.existingLogLines.length);
			// There is no automatic reconnect when spectating, so we can always safely say
			// that when we finish catching up with the actual contents of the file, we are
			// not spectating
			this.spectateLineToEnqueue = null;
			this.triggerCatchUp();
			return;
		}

		if (existingLine.indexOf('CREATE_GAME') !== -1 && existingLine.indexOf('GameState') !== -1) {
			console.log('[game-events] [existing] received CREATE_GAME log', existingLine);
			// Don't do this, as it breaks reconnects
			// this.existingLogLines = [];
		}
		if (existingLine.indexOf('tag=PLAYSTATE value=WON') !== -1) {
			console.log('[game-events] [existing] received tag=PLAYSTATE value=WON log', existingLine);
		}
		this.existingLogLines.push(existingLine);

		if (existingLine.indexOf('tag=STATE value=COMPLETE') !== -1 || existingLine.includes('End Spectator Mode')) {
			// Complete game, we don't handle it
			console.log('[game-events] [existing] complete game, trashing all logs');
			this.existingLogLines.clear();
		}
	}

	private async triggerCatchUp() {
		this.catchingUp = true;
		if (this.spectateLineToEnqueue) {
			this.existingLogLines.insertFront(this.spectateLineToEnqueue);
			this.spectateLineToEnqueue = null;
		}
		const lastLineTimestamp = this.extractLastTimestamp(this.existingLogLines.toArray());
		console.log(
			'[game-events] [existing] last line timestamp',
			lastLineTimestamp,
			Date.now(),
			this.existingLogLines[this.existingLogLines.length - 1],
		);
		// If we're in a game, we want to ignore the past time restriction, as it's not a reconnect but
		// rather the user launching the app once the game is running
		const scene = await this.scene.currentScene$$.getValueWithInit(null, 500, 100);
		if (
			lastLineTimestamp &&
			Date.now() - lastLineTimestamp > 5 * 60 * 1000 &&
			![SceneMode.GAMEPLAY].includes(scene)
		) {
			console.log(
				'[game-events] [existing] last line is too old, not doing anything',
				this.existingLogLines[this.existingLogLines.length - 1],
				scene,
			);
			this.catchingUp = false;
			this.existingLogLines.clear();
			return;
		}
		console.log('[game-events] [existing] caught up, enqueueing all events', this.existingLogLines.length);
		// console.debug('[game-events] [existing] all events to enqueue', this.existingLogLines);

		if (this.existingLogLines.length > 0) {
			// this.processingQueue.enqueueAll(['START_CATCHING_UP', ...this.existingLogLines, 'END_CATCHING_UP']);
			this.processingQueue.enqueueAll(this.existingLogLines.toArray());
			// console.debug('[game-events] [existing] REMOVE!!! all events enqueued', this.processingQueue);
		}
		this.existingLogLines.clear();
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

	private async initPlugin() {
		if (this.plugin || this.pluginBeingInitialized) {
			return;
		}

		this.pluginBeingInitialized = true;
		console.log('[game-events] init log listener plugin');
		this.plugin = await this.gameEventsPlugin.get();
		if (this.plugin) {
			this.plugin.onGlobalEvent.addListener((first: string, second: string) => {
				console.log('[game-events] received global event', first, second);
			});
			this.plugin.onGameEvent.addListener((gameEvent) => {
				try {
					const events: any | readonly any[] = JSON.parse(gameEvent);
					if (!!(events as readonly any[]).length) {
						for (const event of events as readonly any[]) {
							this.dispatchGameEvent(event);
						}
					} else {
						this.dispatchGameEvent(events);
					}
				} catch (e) {
					console.error('Error while parsing game event', gameEvent, e);
				}
			});
			this.plugin.initRealtimeLogConversion(() => {
				console.log('[game-events] real-time log processing ready to go');
			});
		}
		this.pluginBeingInitialized = false;
	}

	private async waitForPluginReady() {
		while (!this.plugin || this.pluginBeingInitialized) {
			await sleep(100);
		}
	}

	private buildBattlegroundsPlayerBoardEvent(eventName: string, gameEvent: any) {
		return Object.assign(new GameEvent(), {
			type: eventName,
			additionalData: {
				playerBoard: {
					cardId: gameEvent.Value.PlayerBoard.CardId,
					playerId: gameEvent.Value.PlayerBoard.PlayerId,
					board: gameEvent.Value.PlayerBoard.Board, // as is
					secrets: gameEvent.Value.PlayerBoard.Secrets, // as is
					trinkets: gameEvent.Value.PlayerBoard.Trinkets, // as is
					hand: gameEvent.Value.PlayerBoard.Hand, // as is
					hero: gameEvent.Value.PlayerBoard.Hero, // as is
					heroPowers: gameEvent.Value.PlayerBoard.HeroPowers.map((hp) => ({
						cardId: hp.CardId,
						entityId: hp.EntityId,
						used: hp.Used,
						info: hp.Info,
						info2: hp.Info2,
					})),
					questRewards: gameEvent.Value.PlayerBoard.QuestRewards,
					questRewardEntities: gameEvent.Value.PlayerBoard.QuestRewardEntities,
					questEntities: gameEvent.Value.PlayerBoard.QuestEntities,
					globalInfo: gameEvent.Value.PlayerBoard.GlobalInfo,
				},
				opponentBoard: {
					cardId: gameEvent.Value.OpponentBoard.CardId,
					playerId: gameEvent.Value.OpponentBoard.PlayerId,
					board: gameEvent.Value.OpponentBoard.Board, // as is
					secrets: gameEvent.Value.OpponentBoard.Secrets, // as is
					trinkets: gameEvent.Value.OpponentBoard.Trinkets, // as is
					hand: gameEvent.Value.OpponentBoard.Hand, // as is
					hero: gameEvent.Value.OpponentBoard.Hero, // as is
					heroPowers: gameEvent.Value.OpponentBoard.HeroPowers.map((hp) => ({
						cardId: hp.CardId,
						entityId: hp.EntityId,
						used: hp.Used,
						info: hp.Info,
						info2: hp.Info2,
					})),
					questRewards: gameEvent.Value.OpponentBoard.QuestRewards,
					questRewardEntities: gameEvent.Value.OpponentBoard.QuestRewardEntities,
					questEntities: gameEvent.Value.OpponentBoard.QuestEntities,
					globalInfo: gameEvent.Value.OpponentBoard.GlobalInfo,
				},
			},
		} as GameEvent);
	}
}
