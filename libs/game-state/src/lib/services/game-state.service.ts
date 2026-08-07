import { EventEmitter, Injectable, NgZone, Optional } from '@angular/core';
import { GameTag } from '@firestone-hs/reference-data';
import { PtlGameStateUpdate } from '@firestone/power-log-parser';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { chunk, sleep } from '@firestone/shared/framework/common';
import { OverwolfService, ProcessingQueue, waitForReady } from '@firestone/shared/framework/core';
// import { TwitchAuthService } from '@firestone/twitch/common';
import { BgsBattleSimulationService } from '@firestone/battlegrounds/core';
import { BehaviorSubject, debounceTime, distinctUntilChanged, filter } from 'rxjs';
import { DeckState, HeroCard, RealTimeStatsState } from '../models/_barrel';
import { GameState } from '../models/game-state';
import { BgsMatchMemoryInfoService } from './battlegrounds/bgs-match-memory-info.service';
import { EventParser } from './game-events/event-parser/_event-parser';
import { SecretsParserService } from './game-events/event-parser/secrets/secrets-parser.service';
import { MinionsDiedEvent } from './game-events/events/minions-died-event';
import { GameEvent } from './game-events/game-event';
import { GameEventsEmitterService } from './game-events/game-events-emitter.service';
import { GameStateParsersService } from './game-events/state-parsers.service';
import { DeckstringOverrideEvent } from './game-state-events/deckstring-override-event';
import { GameStateEvent } from './game-state-events/game-state-event';
import { PtlGameStateUpdateEvent } from './game-state-events/ptl-game-state-update-event';
import { GameStateMetaInfoService } from './game-state-meta-info.service';
import { OverlayDisplayService } from './overlay-display.service';
import { EntityLike, getEntityTag, getHeroesAndDeckCounts } from './parser-entity-utils';
import { RealTimeStatsService } from './real-time-stats/real-time-stats.service';

@Injectable({ providedIn: 'root' })
export class GameStateService {
	public state: GameState = new GameState();
	public deckEventBus = new BehaviorSubject<GameState | null>(null);
	/** Immediate publish path for latency-sensitive BG sim updates (bypasses facade auditTime). */
	public urgentGameState$$ = new BehaviorSubject<GameState | null>(null);

	private eventParsers: { [eventKey: string]: readonly EventParser[] };

	// Keep a single queue to avoid race conditions between the two queues (since they
	// modify the same state)
	private processingQueue: ProcessingQueue<GameEvent | GameStateEvent>;

	// We need to get through a queue to avoid race conditions when two events are close together,
	// so that we're sure teh state is update sequentially
	// private eventQueue: Queue<GameEvent> = new Queue<GameEvent>();
	private deckUpdater: EventEmitter<GameEvent | GameStateEvent> = new EventEmitter<GameEvent | GameStateEvent>();
	private eventEmitters: ((state: GameState) => void)[] = [];

	private secretWillTrigger?: {
		cardId: string;
		reactingToCardId: string;
		reactingToEntityId: number;
	};
	private minionsWillDie: readonly {
		entityId: number;
		cardId: string;
	}[] = [];
	private savedDeckstrings: { player: string | null | undefined; opponent: string | null | undefined } | null = {
		player: null,
		opponent: null,
	};

	/**
	 * Bounded LIFO ring buffer of GameState snapshots, captured on every
	 * {@link GameEvent.REWIND_CAPABLE_ACTION_START} the parser emits. On
	 * {@link GameEvent.REWIND_STARTED} we look up the most recent entry whose
	 * `originEntityId` matches and restore it wholesale, which is the consumer-side
	 * mirror of what the parser does with its own `ParserState` snapshot.
	 *
	 * Why LIFO + match by entity: a single entity (e.g. Mister Clockwork) can rewind
	 * repeatedly, so we want the most recent matching snapshot. Nested rewinds also
	 * naturally resolve most-recent-first.
	 */
	private rewindSnapshots: {
		readonly originEntityId: number;
		readonly state: GameState;
		// Parser-side `BLOCK_START` timestamp at which the snapshot was retained (i.e. the
		// rewound action's start time). Used as the lower bound of the rewound-branch
		// filter window when this snapshot is later restored on `REWIND_STARTED`.
		readonly capturedAt: string | null;
	}[] = [];
	private static readonly REWIND_SNAPSHOT_BUFFER_SIZE = 8;

	/**
	 * Latest GS-side `REWIND_STARTED` timestamp seen, or null. Used as the upper bound of
	 * the rewound-branch event filter (events with `eventTs < cutoff` are dropped together
	 * with `eventTs >= lowerBound` - see {@link rewindLowerBoundTimestamp}).
	 *
	 * Why this exists: the parser intentionally drives GameState (GS) and PowerTaskList (PTL)
	 * on separate streams that can be out of sync. Within {@link processLogsWithTsParser}'s
	 * end-of-batch flush, `GSState.NodeParser.ClearQueue()` runs before
	 * `PTLState.NodeParser.ClearQueue()`, so when a single batch contains the rewind point,
	 * `REWIND_STARTED` (GS) fires first and restores the consumer snapshot - but PTL events
	 * parked between the snapshot point and the rewind point (the rewound branch) then fire
	 * afterward, polluting the just-restored state.
	 *
	 * Two known failure modes have been observed:
	 *  1. `SECRET_CREATED_IN_GAME` leak (`power-log-wrong-secrets-replay.spec.ts`):
	 *     Sands-of-Time rewind, then The Origin Stone re-fires post-rewind and re-binds
	 *     entity 219 to `TLC_462` (Mage SPELL, not a secret); without filtering, the stale
	 *     pre-rewind `SECRET_CREATED_IN_GAME` for 219 (Hunter SECRET) leaks past the restore
	 *     and ends up in `opponentDeck.secrets`.
	 *  2. Hand overflow (`power-log-rewind-opp-hand-replay.spec.ts`):
	 *     Sands-of-Time rewind, opponent had drawn / received cards on the rewound branch.
	 *     Those rewound-branch PTL `RECEIVE_CARD_IN_HAND` / `CARD_DRAW_FROM_DECK` events
	 *     fire after the snapshot restore and push `opponentDeck.hand.length` past the
	 *     in-engine `MAXHANDSIZE=10` cap.
	 *
	 * The rule: any consumer event with a parser-side timestamp in the half-open window
	 * `[lowerBound, cutoff)` that arrives AFTER `REWIND_STARTED` belongs to the rewound
	 * branch and must be dropped. The lower bound (the rewound action's `BLOCK_START`
	 * timestamp) is necessary so we don't also drop legitimate pre-action PTL events
	 * (which the snapshot does NOT contain - PTL queue is flushed second, so the
	 * consumer-side snapshot at REWIND_CAPABLE_ACTION_START time has zero PTL-stream
	 * mutations applied yet, and those pre-action PTL events still need to fire to bring
	 * the restored state up to "consistent at snapshot moment"). Reset on `GAME_START`
	 * because timestamps wrap on a 24h cycle, so a stale cutoff from a previous game would
	 * incorrectly drop early events of the next game.
	 */
	private rewindCutoffTimestamp: string | null = null;
	/**
	 * Lower bound (inclusive) of the rewound-branch event filter window, set from the
	 * matching snapshot's `capturedAt` when `REWIND_STARTED` restores. See
	 * {@link rewindCutoffTimestamp} for the full rationale. `null` means the filter is
	 * inert.
	 */
	private rewindLowerBoundTimestamp: string | null = null;

	private showDecktrackerFromGameMode: boolean;

	/**
	 * Perf tracing (opt-in via `FS_PERF_TRACE=1`). When disabled (the default), the only
	 * overhead is a single boolean check per instrumented site. When enabled, cumulative
	 * wall-clock ms + call counts are accumulated per bucket:
	 *  - `event:<TYPE>`: whole processEvent() call for that event type
	 *  - `parser:<TYPE>:<ParserClass>`: individual event parser `parse()` calls
	 *  - `secrets:before` / `secrets:after`: the SecretsParserService passes
	 *  - `stampMetaInfo`: the per-event zone-transition stamping
	 * Read with {@link getPerfStats}, reset with {@link resetPerfStats}.
	 *
	 * Evaluated at construction time (not module load) so test harnesses can set the env
	 * var programmatically before building the service. Can also be toggled at runtime with
	 * {@link setPerfTraceEnabled} (used by the dev commands in the live app, where env vars
	 * aren't practical).
	 */
	private perfTraceEnabled: boolean = typeof process !== 'undefined' && process?.env?.['FS_PERF_TRACE'] === '1';
	private perfStats: { [bucket: string]: { totalMs: number; calls: number } } = {};

	constructor(
		private readonly gameEvents: GameEventsEmitterService,
		private readonly gameStateMetaInfos: GameStateMetaInfoService,
		private readonly prefs: PreferencesService,
		// private readonly twitch: TwitchAuthService,
		@Optional() private readonly ow: OverwolfService,
		private readonly secretsParser: SecretsParserService,
		private readonly parserService: GameStateParsersService,
		private readonly overlayDisplay: OverlayDisplayService,
		private readonly matchMemoryInfo: BgsMatchMemoryInfoService,
		private readonly realTimeStats: RealTimeStatsService,
		private readonly simulation: BgsBattleSimulationService,
		private readonly ngZone: NgZone,
	) {
		this.processingQueue = new ProcessingQueue<GameEvent | GameStateEvent>(
			(eventQueue) => this.processQueue(eventQueue),
			250,
			'game-state',
			undefined,
			this.ngZone,
		);
		this.init();
	}

	private async init() {
		if (typeof window !== 'undefined') {
			window['deckUpdater'] = this.deckUpdater;
		}

		await waitForReady(this.prefs, this.overlayDisplay);

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
			this.processingQueue.enqueueAndProcessNow({
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

		const decktrackerDisplayEventBus: BehaviorSubject<boolean> = this.overlayDisplay.decktrackerDisplayEventBus$$;
		decktrackerDisplayEventBus.subscribe((event) => {
			if (this.showDecktrackerFromGameMode === event) {
				return;
			}
			this.showDecktrackerFromGameMode = event;
		});

		if (process.env['NODE_ENV'] !== 'production' && typeof window !== 'undefined') {
			window['gameState'] = () => {
				return this.state;
			};
		}
	}

	private registerGameEvents() {
		this.gameEvents.allEvents.subscribe((gameEvent: GameEvent) => {
			if (
				gameEvent?.type === GameEvent.BATTLEGROUNDS_PLAYER_BOARD ||
				gameEvent?.type === GameEvent.BATTLEGROUNDS_BATTLE_SIMULATION
			) {
				this.processingQueue.enqueueAndProcessNow(gameEvent);
			} else {
				this.processingQueue.enqueue(gameEvent);
			}
		});
		this.gameEvents.ptlGameState$.subscribe((update) => {
			this.updateFromPtlState(update);
		});
	}

	updateFromPtlState(update: PtlGameStateUpdate): void {
		this.processingQueue.enqueue(new PtlGameStateUpdateEvent(update));
	}

	/**
	 * Drop the per-session object graph once Hearthstone has exited: the last game's
	 * GameState (whose `parserState` pins the parser's whole entities map), the rewind
	 * snapshot ring and other per-game buffers otherwise stay resident until the next
	 * game. Goes through the processing queue so it can't race an in-flight batch.
	 * Called by GameEvents when the game process exits (with a grace delay), never
	 * mid-game. See docs/electron-memory-investigation.md.
	 */
	public releaseSessionState(): void {
		this.processingQueue.enqueue({ type: 'GAME_SESSION_RELEASED' });
	}

	/**
	 * Wait until the game-state processing queue is empty (batches run every 250ms).
	 * Mirror of `GameEvents.awaitProcessingQueueIdle`; used by dev tooling / perf specs to
	 * measure end-to-end per-turn processing time. No behavior change for the app.
	 */
	public async awaitQueueIdle(maxWaitMs = 600_000): Promise<void> {
		const start = Date.now();
		while (this.processingQueue.eventsPendingCount() > 0 && Date.now() - start < maxWaitMs) {
			await sleep(25);
		}
	}

	/** Snapshot of the perf-trace counters (see {@link perfTraceEnabled}). Empty unless `FS_PERF_TRACE=1`. */
	public getPerfStats(): { [bucket: string]: { totalMs: number; calls: number } } {
		return this.perfStats;
	}

	public resetPerfStats(): void {
		this.perfStats = {};
	}

	public setPerfTraceEnabled(enabled: boolean): void {
		this.perfTraceEnabled = enabled;
	}

	private perfRecord(bucket: string, elapsedMs: number): void {
		const entry = this.perfStats[bucket] ?? (this.perfStats[bucket] = { totalMs: 0, calls: 0 });
		entry.totalMs += elapsedMs;
		entry.calls++;
	}

	private applyPtlGameStateUpdate(currentState: GameState, update: PtlGameStateUpdate): GameState {
		if (!currentState) {
			return currentState;
		}

		let next = currentState.update({
			parserState: update.gameState,
			localPlayerId: update.localPlayerId,
			opponentPlayerId: update.opponentPlayerId,
		});

		if (next.playerDeck && next.opponentDeck) {
			// Single pass over CurrentEntities for both players: this runs on every PTL update
			// and the entities map holds every entity ever created (thousands late-game in BG).
			const perPlayerInfo = next.parserState?.CurrentEntities
				? getHeroesAndDeckCounts(next.parserState.CurrentEntities, [
						update.localPlayerId,
						update.opponentPlayerId,
					])
				: null;
			const updatedPlayerDeck = this.updateDeckFromParserState(
				next.playerDeck,
				perPlayerInfo?.get(update.localPlayerId),
			);
			const updatedOpponentDeck = this.updateDeckFromParserState(
				next.opponentDeck,
				perPlayerInfo?.get(update.opponentPlayerId),
			);
			const hasChanged = updatedPlayerDeck !== next.playerDeck || updatedOpponentDeck !== next.opponentDeck;
			if (hasChanged) {
				next = next.update({
					playerDeck: updatedPlayerDeck as DeckState,
					opponentDeck: updatedOpponentDeck as DeckState,
				});
			}
		}

		return next;
	}

	private async processQueue(eventQueue: readonly (GameEvent | GameStateEvent)[]) {
		// Collapse runs of ADJACENT PTL updates, keeping only the last of each run. They all
		// reference the SAME live ParserState object (the parser mutates it in place and
		// re-emits a pointer after each of its batches), so back-to-back updates with no other
		// event in between are strictly redundant - and each costs a full CurrentEntities scan
		// (see getHeroesAndDeckCounts). Live play sees at most one per batch (no-op); bulk
		// replays (fakeGame / perf harness) can queue many. NOTE: only adjacent ones can be
		// dropped - event parsers BETWEEN two updates read the values the earlier update
		// applied (verified by the rewind non-reg goldens, which fail with a global dedupe).
		if (eventQueue.length > 1) {
			const filtered: (GameEvent | GameStateEvent)[] = [];
			for (const event of eventQueue) {
				if (
					filtered.length > 0 &&
					event instanceof PtlGameStateUpdateEvent &&
					filtered[filtered.length - 1] instanceof PtlGameStateUpdateEvent
				) {
					filtered[filtered.length - 1] = event;
				} else {
					filtered.push(event);
				}
			}
			eventQueue = filtered;
		}
		const gameEndEvent = eventQueue.find((event) => event.type === GameEvent.GAME_END);
		const shouldProcessGameEnd = gameEndEvent && eventQueue.length === 1;
		const chunks = chunk(eventQueue, 50);
		for (const subQueue of chunks) {
			const batchStart = Date.now();
			try {
				const zonePositionChangedEvent = mergeZonePositionChangedEvents(
					subQueue.filter((event) => event.type === GameEvent.ZONE_POSITION_CHANGED) as GameEvent[],
				);
				const dataScriptChangedEvent = mergeDataScriptChangedEvents(
					subQueue.filter((event) => event.type === GameEvent.DATA_SCRIPT_CHANGED) as GameEvent[],
				);
				const gameEndEvent = subQueue.find((event) => event.type === GameEvent.GAME_END);
				const eventsToProcess = [
					...subQueue.filter(
						(event) =>
							event.type !== GameEvent.ZONE_POSITION_CHANGED &&
							event.type !== GameEvent.DATA_SCRIPT_CHANGED &&
							event.type !== GameEvent.GAME_END,
					),
					zonePositionChangedEvent,
					dataScriptChangedEvent,
					shouldProcessGameEnd ? gameEndEvent : null,
				].filter((event) => event);
				let currentState = this.state;
				// Sync read — avoid awaiting isReady() on every chunk of the hot path.
				const prefs = this.prefs.preferences$$.getValue();
				for (let i = 0; i < eventsToProcess.length; i++) {
					if (eventsToProcess[i] instanceof GameEvent) {
						currentState = await this.processEvent(currentState, eventsToProcess[i] as GameEvent, prefs);
					} else {
						currentState = await this.processNonMatchEvent(
							currentState,
							eventsToProcess[i] as GameStateEvent,
						);
					}
					// Stamp the zone-transition turn metadata right after each event, so the captured
					// turn reflects the moment the card actually changed zone (entered hand). Doing this
					// per-event instead of once per batch makes the value independent of how events are
					// grouped into chunks - otherwise the stamp uses the end-of-chunk turn, which shifts
					// whenever the event count changes (see the rewind non-reg goldens).
					const stampStart = this.perfTraceEnabled ? performance.now() : 0;
					currentState = this.stampMetaInfo(currentState);
					if (this.perfTraceEnabled) {
						this.perfRecord('stampMetaInfo', performance.now() - stampStart);
					}
				}

				if (currentState && currentState !== this.state) {
					this.state = currentState;
					this.eventEmitters.forEach((emitter) => emitter(currentState));
					if (eventsToProcess.some((e) => e?.type === GameEvent.BATTLEGROUNDS_BATTLE_SIMULATION)) {
						this.urgentGameState$$.next(currentState);
					}
				}
			} catch (e) {
				console.error('Exception while processing event', e);
			}
			// Surface batches that visibly stall the renderer (>500ms covers any single
			// frame > 30fps drop). Pairs with the per-parser `parser took too long` warn
			// already in `processEvent` so a freeze can be attributed to either an
			// individual parser or batch-level overhead (e.g. rewind deep-clone storms).
			const batchElapsed = Date.now() - batchStart;
			// Stall-attribution hook installed by the platform instrumentation (no-op otherwise)
			const perfHook = (globalThis as any).__fsSlowOp;
			if (perfHook && batchElapsed >= 100) {
				perfHook('game-state', 'processQueue', batchElapsed, {
					events: subQueue.length,
					sample: subQueue
						.map((event) => event?.type)
						.filter((t) => !!t)
						.slice(0, 8),
				});
			}
			if (batchElapsed > 500) {
				const sample = subQueue
					.map((event) => event?.type)
					.filter((t) => !!t)
					.slice(0, 8);
				console.warn(
					'[game-state] slow processQueue batch',
					`${batchElapsed}ms`,
					'size',
					subQueue.length,
					'sample',
					sample,
				);
			}
		}
		return shouldProcessGameEnd || !gameEndEvent ? [] : [gameEndEvent];
	}

	// Re-stamp the per-card zone-transition turn metadata. Cheap on the no-op path thanks to the
	// `.some()` prechecks in GameStateMetaInfoService, so it's safe to call after every event.
	private stampMetaInfo(currentState: GameState): GameState {
		if (!currentState) {
			return currentState;
		}
		const updatedPlayerDeck = this.gameStateMetaInfos.updateDeck(currentState.playerDeck, currentState.currentTurn);
		const updatedOpponentDeck = this.gameStateMetaInfos.updateDeck(
			currentState.opponentDeck,
			currentState.currentTurn,
		);
		const hasChanged =
			updatedPlayerDeck !== currentState.playerDeck || updatedOpponentDeck !== currentState.opponentDeck;
		return hasChanged
			? currentState.update({
					playerDeck: updatedPlayerDeck,
					opponentDeck: updatedOpponentDeck,
				})
			: currentState;
	}

	private async processNonMatchEvent(currentState: GameState, event: GameStateEvent): Promise<GameState> {
		if (event instanceof PtlGameStateUpdateEvent) {
			const ptlPerfStart = this.perfTraceEnabled ? performance.now() : 0;
			const next = this.applyPtlGameStateUpdate(currentState, event.update);
			if (this.perfTraceEnabled) {
				this.perfRecord('ptlGameStateUpdate', performance.now() - ptlPerfStart);
			}
			return next;
		}
		if (event.type === 'TOGGLE_SECRET_HELPER') {
			currentState = currentState.update({
				opponentDeck: currentState.opponentDeck.update({
					secretHelperActive: !currentState.opponentDeck.secretHelperActive,
				}),
			});
		} else if (event.type === 'CLOSE_TRACKER') {
			currentState = currentState.update({
				playerTrackerClosedByUser: true,
			});
		} else if (event.type === 'CLOSE_OPPONENT_TRACKER') {
			currentState = currentState.update({
				opponentTrackerClosedByUser: true,
			});
		} else if (event.type === 'GAME_SESSION_RELEASED') {
			// Hearthstone exited (see releaseSessionState): replace the state wholesale and
			// drop every per-game buffer, so the previous game's object graph becomes
			// collectible. The upload pipeline holds its own references to whatever it
			// still needs, so this is purely a memory release.
			console.log('[game-state] releasing session state after Hearthstone exit');
			this.rewindSnapshots = [];
			this.rewindCutoffTimestamp = null;
			this.rewindLowerBoundTimestamp = null;
			this.savedDeckstrings = null;
			this.minionsWillDie = [];
			currentState = new GameState();
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
						parser.sideEffects!(event, this.gameEvents);
					});
				}
				// if (!this.state) {
				// 	console.error('[game-state] parser returned null state for non-match event', parser.event());
				// }
			} catch (e: any) {
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

	// public processedEvents = [];
	private async processEvent(currentState: GameState, gameEvent: GameEvent, prefs: Preferences): Promise<GameState> {
		const start = Date.now();
		const eventPerfStart = this.perfTraceEnabled ? performance.now() : 0;
		// console.debug('[game-state] processing event', gameEvent.type, gameEvent.cardId, gameEvent.entityId, gameEvent);

		// Drop rewound-branch leaks before they touch state. See {@link rewindCutoffTimestamp}
		// for the full rationale; in short, PTL events parked between the rewound action's
		// BLOCK_START (lower bound) and `REWIND_STARTED` (upper bound) sometimes arrive
		// AFTER `REWIND_STARTED` because the parser flushes GS and PTL queues independently.
		// Any event whose parser-side timestamp lands in the half-open window
		// `[lowerBound, cutoff)` is therefore from the rewound branch and must be dropped -
		// `RECEIVE_CARD_IN_HAND` / `CARD_DRAW_FROM_DECK` (hand overflow) or
		// `SECRET_CREATED_IN_GAME` (stale secret on a re-bound entityId) are the concrete
		// regressions covered, but the filter intentionally applies generically so future
		// rewound-branch leaks are caught without case-by-case allowlisting.
		if (
			this.rewindCutoffTimestamp != null &&
			this.rewindLowerBoundTimestamp != null &&
			gameEvent.debug?.Timestamp != null &&
			gameEvent.debug.Timestamp.length > 0 &&
			gameEvent.debug.Timestamp >= this.rewindLowerBoundTimestamp &&
			gameEvent.debug.Timestamp < this.rewindCutoffTimestamp
		) {
			console.log(
				'[game-state] dropping stale rewound-branch event',
				gameEvent.type,
				'entityId',
				gameEvent.entityId,
				'eventTs',
				gameEvent.debug.Timestamp,
				'window',
				this.rewindLowerBoundTimestamp,
				this.rewindCutoffTimestamp,
			);
			return currentState;
		}

		if (gameEvent.type === GameEvent.GAME_START) {
			currentState = currentState?.update({
				playerTrackerClosedByUser: false,
				opponentTrackerClosedByUser: false,
			});
			this.minionsWillDie = [];
			// Drop prior-game rewind ring so up to 8 full GameState graphs become collectible.
			this.rewindSnapshots = [];
			// Reset to avoid stale cutoff/lower-bound from a previous game; see field JSDocs.
			this.rewindCutoffTimestamp = null;
			this.rewindLowerBoundTimestamp = null;
		} else if (gameEvent.type === GameEvent.GAME_END) {
			this.savedDeckstrings = null;
			this.minionsWillDie = [];
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
		} else if (gameEvent.type === GameEvent.REWIND_CAPABLE_ACTION_START) {
			// Parser just snapshotted its ParserState; mirror that on the consumer side so a
			// subsequent REWIND_STARTED can cheaply roll back `currentState` without replaying
			// the entire game. Record the parser-side `BLOCK_START` timestamp on the snapshot
			// so the eventual REWIND_STARTED can set the rewound-branch filter's lower bound
			// from it (see {@link rewindCutoffTimestamp} JSDoc).
			const originEntityId: number | null | undefined = gameEvent.additionalData?.originEntityId;
			if (originEntityId != null) {
				const capturedAt: string | null = gameEvent.debug?.Timestamp ?? null;
				this.rewindSnapshots.push({ originEntityId, state: currentState, capturedAt });
				if (this.rewindSnapshots.length > GameStateService.REWIND_SNAPSHOT_BUFFER_SIZE) {
					this.rewindSnapshots.shift();
				}
			}
		} else if (gameEvent.type === GameEvent.REWIND_STARTED) {
			this.savedDeckstrings = {
				player: currentState.playerDeck.deckstring,
				opponent: currentState.opponentDeck.deckstring,
			};
			// Update the rewound-branch event cutoff (see {@link rewindCutoffTimestamp} JSDoc).
			// Done unconditionally - even when no consumer snapshot matches the originEntityId,
			// the parser still rewound on its side, so post-arrival PTL leaks must still be
			// filtered out. Use max() so a nested earlier rewind whose `REWIND_STARTED` arrives
			// later (rare) doesn't shrink the active cutoff.
			const eventTs: string | null = gameEvent.debug?.Timestamp ?? null;
			if (eventTs != null && eventTs.length > 0) {
				this.rewindCutoffTimestamp =
					this.rewindCutoffTimestamp == null || eventTs > this.rewindCutoffTimestamp
						? eventTs
						: this.rewindCutoffTimestamp;
			}
			// Reset the rewound-branch filter's lower bound for THIS rewind. We'll set it
			// below from the matching snapshot's `capturedAt` if one exists. Clearing first
			// guarantees a stale lower bound from a prior unmatched rewind in the same game
			// can't accidentally widen the next filter window.
			this.rewindLowerBoundTimestamp = null;
			const originEntityId: number | null | undefined = gameEvent.additionalData?.originEntityId;
			if (originEntityId != null) {
				// LIFO lookup so repeat rewinds from the same entity pick the freshest snapshot.
				for (let i = this.rewindSnapshots.length - 1; i >= 0; i--) {
					if (this.rewindSnapshots[i].originEntityId === originEntityId) {
						const snapshot = this.rewindSnapshots[i];
						this.rewindSnapshots.splice(i, 1);
						currentState = snapshot.state;
						if (snapshot.capturedAt != null && snapshot.capturedAt.length > 0) {
							this.rewindLowerBoundTimestamp = snapshot.capturedAt;
						}
						console.log('[game-state] restored rewind snapshot for originEntityId', originEntityId);
						break;
					}
				}
			}
		} else if (gameEvent.type === GameEvent.REWIND_OVER) {
			if (this.savedDeckstrings?.opponent) {
				this.deckUpdater.next(
					new DeckstringOverrideEvent(
						this.state.opponentDeck.name,
						this.savedDeckstrings.opponent,
						'opponent',
					),
				);
			}
			this.savedDeckstrings = null;
		}

		// Fast-path: parseSecrets is a no-op unless a secret is in play (it checks this
		// internally, but by then we've already paid an `await` - and under zone.js in the
		// live app each await costs real time through the patched-promise machinery, ~4 s
		// per full BG game across the ~27k parseSecrets awaits).
		const anySecretInPlay =
			(currentState.playerDeck?.secrets?.length ?? 0) > 0 ||
			(currentState.opponentDeck?.secrets?.length ?? 0) > 0;
		if (anySecretInPlay) {
			const secretsBeforeStart = this.perfTraceEnabled ? performance.now() : 0;
			currentState = await this.secretsParser.parseSecrets(currentState, gameEvent, {
				secretWillTrigger: this.secretWillTrigger!,
				minionsWillDie: this.minionsWillDie,
				timing: 'before',
			});
			if (this.perfTraceEnabled) {
				this.perfRecord('secrets:before', performance.now() - secretsBeforeStart);
			}
		}
		const parsersForEvent = this.eventParsers[gameEvent.type] ?? [];
		for (const parser of parsersForEvent) {
			try {
				if (parser.applies(gameEvent, currentState, prefs)) {
					const start = Date.now();
					const parserPerfStart = this.perfTraceEnabled ? performance.now() : 0;
					currentState = await parser.parse(currentState, gameEvent, {
						secretWillTrigger: this.secretWillTrigger,
						minionsWillDie: this.minionsWillDie,
					});
					if (this.perfTraceEnabled) {
						this.perfRecord(
							`parser:${gameEvent.type}:${parser.constructor?.name ?? 'unknown'}`,
							performance.now() - parserPerfStart,
						);
					}
					const elapsed = Date.now() - start;
					if (elapsed > 1000) {
						console.warn('[game-state] parser took too long', elapsed, gameEvent.type);
					}
				}
				if (parser?.sideEffects) {
					// Don't block the main parser loop
					setTimeout(() => {
						parser.sideEffects!(gameEvent, this.gameEvents);
					});
				}
			} catch (e: any) {
				console.error('[game-state] Exception while applying parser', parser.event(), e.message, e.stack, e);
				console.log('[game-state] Exception while applying parser', parser.event(), e.message, e.stack, e);
			}
		}
		// Recompute: the event parsers above may have added/removed secrets.
		const anySecretInPlayAfter =
			(currentState.playerDeck?.secrets?.length ?? 0) > 0 ||
			(currentState.opponentDeck?.secrets?.length ?? 0) > 0;
		if (anySecretInPlayAfter) {
			const secretsAfterStart = this.perfTraceEnabled ? performance.now() : 0;
			currentState = await this.secretsParser.parseSecrets(currentState, gameEvent, {
				secretWillTrigger: this.secretWillTrigger!,
				minionsWillDie: this.minionsWillDie,
				timing: 'after',
			});
			if (this.perfTraceEnabled) {
				this.perfRecord('secrets:after', performance.now() - secretsAfterStart);
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
			this.secretWillTrigger = undefined;
		}
		if (this.minionsWillDie?.length && gameEvent.type === GameEvent.MINIONS_DIED) {
			const gEvent = gameEvent as MinionsDiedEvent;
			this.minionsWillDie = this.minionsWillDie.filter(
				(minion) => !gEvent.additionalData.deadMinions.map((m) => m.EntityId).includes(minion.entityId),
			);
		}

		if (
			![
				GameEvent.TOTAL_ATTACK_ON_BOARD,
				GameEvent.ZONE_POSITION_CHANGED,
				GameEvent.RESOURCES_UPDATED,
				GameEvent.NUM_CARDS_DRAW_THIS_TURN,
				// GameEvent.SUB_SPELL_START,
				// GameEvent.SUB_SPELL_END,
			].includes(gameEvent.type)
		) {
			console.debug(
				'[game-state] processed event',
				gameEvent.type,
				gameEvent.cardId,
				`entityId:${gameEvent.entityId}_`,
				(gameEvent as MinionsDiedEvent)?.additionalData?.deadMinions?.map((m) => `entityId:${m.EntityId}_`),
				currentState,
				gameEvent,
			);
		}
		if (this.perfTraceEnabled) {
			this.perfRecord(`event:${gameEvent.type}`, performance.now() - eventPerfStart);
		}
		return currentState;
	}

	private updateDeckFromParserState(
		deck: DeckState | undefined,
		// From getHeroesAndDeckCounts; null/undefined when the parser state has no entities yet
		parserInfo: { hero: EntityLike | undefined; cardsInDeck: number } | null | undefined,
	): DeckState | undefined {
		if (!deck || !parserInfo) {
			return deck;
		}

		const hero = parserInfo.hero;
		const maxMana = hero ? getEntityTag(hero, GameTag.RESOURCES, 0) : 0;
		const manaSpent = hero ? getEntityTag(hero, GameTag.RESOURCES_USED, 0) : 0;
		const manaLeft = maxMana - manaSpent;
		const newHero: HeroCard | undefined =
			deck.hero && manaLeft != deck.hero.manaLeft ? deck.hero.update({ manaLeft: manaLeft }) : deck.hero;

		const cardsLeftInDeck = parserInfo.cardsInDeck;

		const hasChanged = newHero !== deck.hero || cardsLeftInDeck !== deck.cardsLeftInDeck;

		return hasChanged
			? deck.update({
					hero: newHero,
					cardsLeftInDeck: cardsLeftInDeck,
				})
			: deck;
	}

	private async buildEventEmitters() {
		const result = [(event: GameState) => this.deckEventBus.next(event)];
		// const prefs = await this.prefs.getPreferences();
		// console.log('is logged in to Twitch?', !!prefs.twitchAccessToken);
		// if (prefs.twitchAccessToken) {
		// 	const isTokenValid = await this.twitch.validateToken(prefs.twitchAccessToken);
		// 	if (!isTokenValid) {
		// 		console.log('Twitch token is not valid, removing it');
		// 		this.prefs.setTwitchAccessToken(undefined);
		// 		await sleep(2000);
		// 		await this.twitch.sendExpiredTwitchTokenNotification();
		// 	} else {
		// 		result.push((event) => this.twitch.emitDeckEvent(event));
		// 	}
		// }
		this.eventEmitters = result;
	}
}

const mergeDataScriptChangedEvents = (events: readonly GameEvent[]): GameEvent | null => {
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

const mergeZonePositionChangedEvents = (events: readonly GameEvent[]): GameEvent | null => {
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
