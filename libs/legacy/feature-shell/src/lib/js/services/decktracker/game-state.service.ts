import { EventEmitter, Injectable } from '@angular/core';
import { GameTag } from '@firestone-hs/reference-data';
import { BgsInGameWindowNavigationService, BgsMatchMemoryInfoService } from '@firestone/battlegrounds/common';
import { BgsBattleSimulationService } from '@firestone/battlegrounds/core';
import { DeckCard, DeckState, GameState, HeroCard, PlayerGameState, RealTimeStatsState } from '@firestone/game-state';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { arraysEqual } from '@firestone/shared/framework/common';
import { OverwolfService } from '@firestone/shared/framework/core';
import { TwitchAuthService } from '@firestone/twitch/common';
import { hasTag } from '@services/decktracker/attack-on-board.service';
import { BehaviorSubject, debounceTime, distinctUntilChanged, filter } from 'rxjs';
import { GameStateEvent } from '../../models/decktracker/game-state-event';
import { GameEvent } from '../../models/game-event';
import { MinionsDiedEvent } from '../../models/mainwindow/game-events/minions-died-event';
import { BgsBestUserStatsService } from '../battlegrounds/bgs-best-user-stats.service';
import { RealTimeStatsService } from '../battlegrounds/store/real-time-stats/real-time-stats.service';
import { Events } from '../events.service';
import { GameEventsEmitterService } from '../game-events-emitter.service';
import { ManastormInfo } from '../manastorm-bridge/manastorm-info';
import { ProcessingQueue } from '../processing-queue.service';
import { chunk, sleep } from '../utils';
import { EventParser } from './event-parser/event-parser';
import { SecretsParserService } from './event-parser/secrets/secrets-parser.service';
import { ConstructedAchievementsProgressionEvent } from './event/constructed-achievements-progression-event';
import { GameStateMetaInfoService } from './game-state-meta-info.service';
import { GameStateParsersService } from './game-state/state-parsers.service';
import { OverlayDisplayService } from './overlay-display.service';

@Injectable()
export class GameStateService {
	public state: GameState = new GameState();
	private eventParsers: { [eventKey: string]: readonly EventParser[] };

	// Keep a single queue to avoid race conditions between the two queues (since they
	// modify the same state)
	private processingQueue = new ProcessingQueue<GameEvent | GameStateEvent>(
		(eventQueue) => this.processQueue(eventQueue),
		50,
		'game-state',
	);

	// We need to get through a queue to avoid race conditions when two events are close together,
	// so that we're sure teh state is update sequentially
	// private eventQueue: Queue<GameEvent> = new Queue<GameEvent>();
	private deckEventBus = new BehaviorSubject<GameState | null>(null);
	private deckUpdater: EventEmitter<GameEvent | GameStateEvent> = new EventEmitter<GameEvent | GameStateEvent>();
	private eventEmitters: ((state: GameState) => void)[] = [];

	private secretWillTrigger: {
		cardId: string;
		reactingToCardId: string;
		reactingToEntityId: number;
	};
	private minionsWillDie: readonly {
		entityId: number;
		cardId: string;
	}[] = [];

	private showDecktrackerFromGameMode: boolean;

	private battlegroundsWindowsListener: EventEmitter<boolean> = new EventEmitter<boolean>();

	constructor(
		private readonly gameEvents: GameEventsEmitterService,
		private readonly events: Events,
		private readonly gameStateMetaInfos: GameStateMetaInfoService,
		private readonly prefs: PreferencesService,
		private readonly twitch: TwitchAuthService,
		private readonly ow: OverwolfService,
		private readonly secretsParser: SecretsParserService,
		private readonly parserService: GameStateParsersService,
		// Just to make sure decktrackerDisplayEventBus is defined
		private readonly display: OverlayDisplayService,
		private readonly matchMemoryInfo: BgsMatchMemoryInfoService,
		private readonly realTimeStats: RealTimeStatsService,
		private readonly simulation: BgsBattleSimulationService,
		private readonly bgsNav: BgsInGameWindowNavigationService,
		private readonly bgsUserStatsService: BgsBestUserStatsService,
	) {
		this.init();
	}

	private async init() {
		window['deckEventBus'] = this.deckEventBus;
		window['deckUpdater'] = this.deckUpdater;
		window['bgsHotkeyPressed'] = this.battlegroundsWindowsListener;
		if (!this.ow) {
			console.warn('[game-state] Could not find OW service');
			return;
		}

		await this.prefs.isReady();

		this.eventParsers = this.parserService.buildEventParsers();
		this.registerGameEvents();
		this.buildEventEmitters();
		this.prefs.preferences$$
			.pipe(
				distinctUntilChanged(
					(a, b) =>
						a.twitchAccessToken === b.twitchAccessToken &&
						a.twitchLoginName === b.twitchLoginName &&
						a.twitchUserName === b.twitchUserName,
				),
			)
			.subscribe(async (prefs) => {
				this.buildEventEmitters();
			});
		this.deckUpdater.subscribe((event: GameEvent | GameStateEvent) => {
			this.processingQueue.enqueue(event);
		});
		this.matchMemoryInfo.battlegroundsMemoryInfo$$
			.pipe(
				debounceTime(300),
				filter((info) => !!info),
			)
			.subscribe((info) => {
				this.processingQueue.enqueue({
					type: GameEvent.BATTLEGROUNDS_GLOBAL_INFO_UPDATE,
					additionalData: {
						info: info,
					},
				});
			});
		this.simulation.battleInfo$$.pipe(filter((info) => !!info)).subscribe((info) => {
			this.processingQueue.enqueue({
				type: GameEvent.BATTLEGROUNDS_BATTLE_SIMULATION,
				additionalData: {
					info: info,
				},
			});
		});
		this.realTimeStats.addListener((statsState: RealTimeStatsState) => {
			this.processingQueue.enqueue({
				type: GameEvent.BATTLEGROUNDS_REAL_TIME_STATS_UPDATE,
				additionalData: {
					stats: statsState,
				},
			});
		});
		this.battlegroundsWindowsListener = this.ow.addHotKeyPressedListener('battlegrounds', async (hotkeyResult) => {
			this.bgsNav.toggleWindow();
		});

		const decktrackerDisplayEventBus: BehaviorSubject<boolean> = this.ow.getMainWindow().decktrackerDisplayEventBus;
		decktrackerDisplayEventBus.subscribe((event) => {
			if (this.showDecktrackerFromGameMode === event) {
				return;
			}
			this.showDecktrackerFromGameMode = event;
		});

		if (process.env.NODE_ENV !== 'production') {
			window['gameState'] = () => {
				return this.state;
			};
		}
	}

	private registerGameEvents() {
		this.gameEvents.allEvents.subscribe((gameEvent: GameEvent) => {
			this.processingQueue.enqueue(gameEvent);
		});
		this.events
			.on(Events.ACHIEVEMENT_PROGRESSION)
			.subscribe((event) =>
				this.processingQueue.enqueue(new ConstructedAchievementsProgressionEvent(event.data[0])),
			);
		this.events.on(Events.REVIEW_FINALIZED).subscribe(async (event) => {
			const info: ManastormInfo = event.data[0];
			console.debug('[game-state] Replay created, received info', info.type);
			// FIXME: this could be an issue if the review_finalized event takes too long to fire, as the state
			// could be already reset when it arrives
			if (info && info.type === 'new-review' && this.state?.bgState?.currentGame) {
				const currentGame = this.state.bgState.currentGame;
				console.debug('[game-state] will trigger START_BGS_RUN_STATS', this.state);
				const bestBgsUserStats = await this.bgsUserStatsService.bestStats$$.getValueWithInit();
				this.events.broadcast(
					Events.START_BGS_RUN_STATS,
					info.reviewId,
					currentGame,
					bestBgsUserStats,
					info.game,
				);
			}
		});

		// Reset the deck if it exists
		// this.processingQueue.enqueue(Object.assign(new GameEvent(), { type: GameEvent.GAME_END } as GameEvent));
	}

	private async processQueue(eventQueue: readonly (GameEvent | GameStateEvent)[]) {
		// So that ZONE_POSITION_CHANGED events are processed a bit more often
		const gameEndEvent = eventQueue.find((event) => event.type === GameEvent.GAME_END);
		const shouldProcessGameEnd = gameEndEvent && eventQueue.length === 1;
		const chunks = chunk(eventQueue, 50);
		for (const subQueue of chunks) {
			try {
				const stateUpdateEvents = subQueue.filter((event) => event.type === GameEvent.GAME_STATE_UPDATE);
				const stateUpdateEvent: GameEvent =
					stateUpdateEvents.length > 0
						? (stateUpdateEvents[stateUpdateEvents.length - 1] as GameEvent)
						: null;
				const zonePositionChangedEvent = mergeZonePositionChangedEvents(
					subQueue.filter((event) => event.type === GameEvent.ZONE_POSITION_CHANGED) as GameEvent[],
				);
				const dataScriptChangedEvent = mergeDataScriptChangedEvents(
					subQueue.filter((event) => event.type === GameEvent.DATA_SCRIPT_CHANGED) as GameEvent[],
				);
				const gameEndEvent = subQueue.find((event) => event.type === GameEvent.GAME_END);
				// Processing these should be super quick, as in most cases they won't lead to a state update
				// const attackOnBoardEvents = subQueue.filter((event) => event.type === GameEvent.TOTAL_ATTACK_ON_BOARD);
				const eventsToProcess = [
					...subQueue.filter(
						(event) =>
							event.type !== GameEvent.GAME_STATE_UPDATE &&
							event.type !== GameEvent.ZONE_POSITION_CHANGED &&
							event.type !== GameEvent.DATA_SCRIPT_CHANGED &&
							event.type !== GameEvent.GAME_END,
					),
					// stateUpdateEvents.length > 0 ? stateUpdateEvents[stateUpdateEvents.length - 1] : null,
					zonePositionChangedEvent,
					dataScriptChangedEvent,
					stateUpdateEvent,
					shouldProcessGameEnd ? gameEndEvent : null,
					// attackOnBoardEvents.length > 0 ? attackOnBoardEvents[attackOnBoardEvents.length - 1] : null,
				].filter((event) => event);
				const start = Date.now();
				let currentState = this.state;
				const prefs = await this.prefs.getPreferences();
				for (let i = 0; i < eventsToProcess.length; i++) {
					if (eventsToProcess[i] instanceof GameEvent) {
						currentState = await this.processEvent(currentState, eventsToProcess[i] as GameEvent, prefs);
					} else {
						currentState = await this.processNonMatchEvent(
							currentState,
							eventsToProcess[i] as GameStateEvent,
						);
					}
				}

				// TODO: completely remove this step
				// Maybe only update this when we have NEW_TURN events?
				if (currentState && currentState !== this.state) {
					const updatedPlayerDeck = this.gameStateMetaInfos.updateDeck(
						currentState.playerDeck,
						currentState.currentTurn,
					);
					const udpatedOpponentDeck = this.gameStateMetaInfos.updateDeck(
						currentState.opponentDeck,
						currentState.currentTurn,
					);
					const hasChanged =
						updatedPlayerDeck !== currentState.playerDeck ||
						udpatedOpponentDeck !== currentState.opponentDeck;
					currentState = hasChanged
						? currentState.update({
								playerDeck: updatedPlayerDeck,
								opponentDeck: udpatedOpponentDeck,
							})
						: currentState;
				}

				// TODO: completely remove this step
				if (currentState && stateUpdateEvent != null) {
					// Add information that is not linked to events, like the number of turns the
					// card has been present in the zone
					const updatedPlayerDeck = this.updateDeck(
						currentState.playerDeck,
						currentState,
						stateUpdateEvent.gameState.Player,
					);
					const udpatedOpponentDeck = this.updateDeck(
						currentState.opponentDeck,
						currentState,
						stateUpdateEvent.gameState.Opponent,
					);
					const hasChanged =
						updatedPlayerDeck !== currentState.playerDeck ||
						udpatedOpponentDeck !== currentState.opponentDeck;
					currentState = hasChanged
						? currentState.update({
								playerDeck: updatedPlayerDeck,
								opponentDeck: udpatedOpponentDeck,
							})
						: currentState;
				}

				if (currentState && currentState !== this.state) {
					// console.debug('[game-state] state has changed', currentState);
					this.state = currentState;
					this.eventEmitters.forEach((emitter) => emitter(currentState));
				} else {
					// console.debug(
					// 	'[game-state] state is unchanged, not emitting event',
					// 	// gameEvent.type,
					// 	// gameEvent.cardId,
					// 	// gameEvent.entityId,
					// );
				}
				// console.debug('[game-state] processed events', eventsToProcess.length, 'in', Date.now() - start);
			} catch (e) {
				console.error('Exception while processing event', e);
			}
		}
		return shouldProcessGameEnd || !gameEndEvent ? [] : [gameEndEvent];
	}

	private async processNonMatchEvent(currentState: GameState, event: GameStateEvent): Promise<GameState> {
		if (event.type === 'TOGGLE_SECRET_HELPER') {
			currentState = currentState.update({
				opponentDeck: currentState.opponentDeck.update({
					secretHelperActive: !currentState.opponentDeck.secretHelperActive,
				} as DeckState),
			} as GameState);
		} else if (event.type === 'CLOSE_TRACKER') {
			currentState = currentState.update({
				playerTrackerClosedByUser: true,
			});
		} else if (event.type === 'CLOSE_OPPONENT_TRACKER') {
			currentState = currentState.update({
				opponentTrackerClosedByUser: true,
			});
		}

		const parsersForEvent = this.eventParsers[event.type] ?? [];
		for (const parser of parsersForEvent) {
			try {
				if (parser.applies(event, currentState)) {
					currentState = await parser.parse(currentState, event);
				}
				if (parser?.sideEffects) {
					// Don't block the main parser loop
					setTimeout(() => {
						parser.sideEffects(event, this.gameEvents);
					});
				}
				// if (!this.state) {
				// 	console.error('[game-state] parser returned null state for non-match event', parser.event());
				// }
			} catch (e) {
				console.error(
					'[game-state] Exception while applying parser for non-match event',
					parser.event(),
					event,
					e.message,
					e.stack,
					e,
				);
			}
		}
		return currentState;
	}

	public processedEvents = [];
	private async processEvent(currentState: GameState, gameEvent: GameEvent, prefs: Preferences): Promise<GameState> {
		const start = Date.now();
		// console.debug('[game-state] processing event', gameEvent.type, gameEvent.cardId, gameEvent.entityId, gameEvent);
		if (gameEvent.type === GameEvent.GAME_START) {
			currentState = currentState?.update({
				playerTrackerClosedByUser: false,
				opponentTrackerClosedByUser: false,
			});
		} else if (gameEvent.type === GameEvent.SPECTATING) {
			currentState = currentState?.update({
				// We can't "unspectate" a game
				spectating: currentState.spectating || gameEvent.additionalData.spectating,
			} as GameState);
		} else if (
			gameEvent.type === GameEvent.SECRET_WILL_TRIGGER ||
			gameEvent.type === GameEvent.COUNTER_WILL_TRIGGER
		) {
			this.secretWillTrigger = {
				cardId: gameEvent.cardId,
				reactingToCardId: gameEvent.additionalData.reactingToCardId,
				reactingToEntityId: gameEvent.additionalData.reactingToEntityId,
			};
			console.log('[game-state] secret will trigger in reaction to', this.secretWillTrigger);
		} else if (gameEvent.type === GameEvent.MINIONS_WILL_DIE) {
			const minionsWillDieEvent = gameEvent as MinionsDiedEvent;
			this.minionsWillDie = [
				...this.minionsWillDie,
				...minionsWillDieEvent.additionalData.deadMinions?.map((minion) => ({
					entityId: minion.EntityId,
					cardId: minion.CardId,
				})),
			];
		}

		currentState = await this.secretsParser.parseSecrets(currentState, gameEvent, {
			secretWillTrigger: this.secretWillTrigger,
			minionsWillDie: this.minionsWillDie,
		});
		const parsersForEvent = this.eventParsers[gameEvent.type] ?? [];
		for (const parser of parsersForEvent) {
			try {
				if (parser.applies(gameEvent, currentState, prefs)) {
					const start = Date.now();
					currentState = await parser.parse(currentState, gameEvent, {
						secretWillTrigger: this.secretWillTrigger,
						minionsWillDie: this.minionsWillDie,
					});
					const elapsed = Date.now() - start;
					if (elapsed > 1000) {
						console.warn('[game-state] parser took too long', elapsed, gameEvent.type);
					}
				}
				if (parser?.sideEffects) {
					// Don't block the main parser loop
					setTimeout(() => {
						parser.sideEffects(event, this.gameEvents);
					});
				}
			} catch (e) {
				console.error('[game-state] Exception while applying parser', parser.event(), e.message, e.stack, e);
			}
		}

		// We have processed the event for which the secret would trigger
		if (
			gameEvent.type !== GameEvent.SECRET_WILL_TRIGGER &&
			gameEvent.type !== GameEvent.COUNTER_WILL_TRIGGER &&
			// Sometimes these events are sent even if the cost doesn't actually change
			gameEvent.type !== GameEvent.COST_CHANGED &&
			gameEvent.type !== GameEvent.ZONE_POSITION_CHANGED &&
			((this.secretWillTrigger?.reactingToCardId &&
				this.secretWillTrigger.reactingToCardId === gameEvent.cardId) ||
				(this.secretWillTrigger?.reactingToEntityId &&
					this.secretWillTrigger.reactingToEntityId === gameEvent.entityId))
		) {
			console.log('[game-state] resetting secretWillTrigger', gameEvent.type, this.secretWillTrigger);
			this.secretWillTrigger = null;
		}
		if (this.minionsWillDie?.length && gameEvent.type === GameEvent.MINIONS_DIED) {
			const gEvent = gameEvent as MinionsDiedEvent;
			this.minionsWillDie = this.minionsWillDie.filter(
				(minion) => !gEvent.additionalData.deadMinions.map((m) => m.EntityId).includes(minion.entityId),
			);
		}

		console.debug(
			'[game-state] processed event',
			gameEvent.type,
			gameEvent.cardId,
			gameEvent.entityId,
			currentState.fullGameState?.Opponent?.Deck?.length,
			currentState.opponentDeck.deck.length,
			currentState,
			gameEvent,
		);
		// if ((currentState.fullGameState?.Opponent?.Deck?.length ?? 0) !== currentState.opponentDeck.deck.length) {
		// 	console.warn(
		// 		'[game-state] deck length mismatch',
		// 		currentState.fullGameState?.Opponent?.Deck?.length,
		// 		currentState.opponentDeck.deck.length,
		// 	);
		// }
		this.processedEvents.push(gameEvent.type);
		return currentState;
	}

	// TODO: this should move elsewhere
	// TODO: not a big fan of this. These methods should probably be called only once, on the appropriate action
	// this feels lazy, and probably perf-hungry
	private updateDeck(deck: DeckState, gameState: GameState, playerFromTracker: PlayerGameState): DeckState {
		if (!playerFromTracker) {
			return deck;
		}
		// Could also just support the DORMANT tag event
		const newBoard: readonly DeckCard[] = deck.board.map((card) => {
			const entity = playerFromTracker.Board?.find((entity) => entity.entityId === card.entityId);
			const dormantTag = hasTag(entity, GameTag.DORMANT);
			return dormantTag === card.dormant ? card : card.update({ dormant: dormantTag });
		});

		// Same here, just supporting the events should be enough?
		const maxMana = playerFromTracker.Hero.tags?.find((t) => t.Name == GameTag.RESOURCES)?.Value ?? 0;
		const manaSpent = playerFromTracker.Hero.tags?.find((t) => t.Name == GameTag.RESOURCES_USED)?.Value ?? 0;
		const manaLeft = maxMana == null || manaSpent == null ? null : maxMana - manaSpent;
		const newHero: HeroCard =
			manaLeft != deck.hero?.manaLeft
				? deck.hero?.update({
						manaLeft: maxMana == null || manaSpent == null ? null : maxMana - manaSpent,
					})
				: deck.hero;

		// We need this because we don't know the exact content of cards in the opponent's deck
		// simply fomr looking at the deck state (eg we have imported a list, and we don't know which ones
		// are to be removed)
		const cardsLeftInDeck = playerFromTracker.Deck?.length;

		// Overall this whole process could likely be completely removed
		const hasChanged =
			!arraysEqual(newBoard, deck.board) || newHero !== deck.hero || cardsLeftInDeck !== deck.cardsLeftInDeck;

		return hasChanged
			? deck.update({
					board: newBoard,
					hero: newHero,
					cardsLeftInDeck: cardsLeftInDeck,
					// totalAttackOnBoard: totalAttackOnBoard,
				})
			: deck;
	}

	private async buildEventEmitters() {
		const result = [(event: GameState) => this.deckEventBus.next(event)];
		const prefs = await this.prefs.getPreferences();
		console.log('is logged in to Twitch?', !!prefs.twitchAccessToken);
		if (prefs.twitchAccessToken) {
			const isTokenValid = await this.twitch.validateToken(prefs.twitchAccessToken);
			if (!isTokenValid) {
				console.log('Twitch token is not valid, removing it');
				this.prefs.setTwitchAccessToken(undefined);
				await sleep(2000);
				await this.twitch.sendExpiredTwitchTokenNotification();
			} else {
				result.push((event) => this.twitch.emitDeckEvent(event));
			}
		}
		this.eventEmitters = result;
	}
}

const mergeDataScriptChangedEvents = (events: readonly GameEvent[]): GameEvent => {
	if (events.length === 0) {
		return null;
	}
	const ref = events[events.length - 1];
	const allDataScriptUpdates = events.flatMap((event) => event.additionalData.updates);
	const merged: GameEvent = Object.assign(new GameEvent(), ref, {
		additionalData: {
			updates: allDataScriptUpdates,
		},
	});
	return merged;
};

const mergeZonePositionChangedEvents = (events: readonly GameEvent[]): GameEvent => {
	if (events.length === 0) {
		return null;
	}
	const ref = events[events.length - 1];
	const allZoneUpdates = events.flatMap((event) => event.additionalData.zoneUpdates);
	const uniqueEntities = allZoneUpdates
		.map((update) => update.EntityId)
		.filter((entityId, index, self) => self.indexOf(entityId) === index);
	const finalZoneUpdates = uniqueEntities.map((entityId) => {
		const updatesForEntity = allZoneUpdates.filter((update) => update.EntityId === entityId);
		const lastUpdate = updatesForEntity[updatesForEntity.length - 1];
		return lastUpdate;
	});
	const merged: GameEvent = Object.assign(new GameEvent(), ref, {
		additionalData: {
			zoneUpdates: finalZoneUpdates,
		},
	});
	return merged;
};
