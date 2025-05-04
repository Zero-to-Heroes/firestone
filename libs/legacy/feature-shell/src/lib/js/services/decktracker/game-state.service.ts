import { EventEmitter, Injectable } from '@angular/core';
import { GameTag } from '@firestone-hs/reference-data';
import {
	DeckCard,
	DeckState,
	GameState,
	GameStateUpdatesService,
	HeroCard,
	PlayerGameState,
} from '@firestone/game-state';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { arraysEqual } from '@firestone/shared/framework/common';
import { OverwolfService } from '@firestone/shared/framework/core';
import { TwitchAuthService } from '@firestone/twitch/common';
import { AttackOnBoardService, hasTag } from '@services/decktracker/attack-on-board.service';
import { BehaviorSubject, distinctUntilChanged } from 'rxjs';
import { GameStateEvent } from '../../models/decktracker/game-state-event';
import { GameEvent } from '../../models/game-event';
import { MinionsDiedEvent } from '../../models/mainwindow/game-events/minions-died-event';
import { Events } from '../events.service';
import { GameEventsEmitterService } from '../game-events-emitter.service';
import { ProcessingQueue } from '../processing-queue.service';
import { chunk, uuid } from '../utils';
import { DeckCardService } from './deck-card.service';
import { EventParser } from './event-parser/event-parser';
import { SecretsParserService } from './event-parser/secrets/secrets-parser.service';
import { ConstructedAchievementsProgressionEvent } from './event/constructed-achievements-progression-event';
import { GameStateMetaInfoService } from './game-state-meta-info.service';
import { GameStateParsersService } from './game-state/state-parsers.service';
import { StatePostProcessService } from './game-state/state-post-process.service';
import { OverlayDisplayService } from './overlay-display.service';
import { ZoneOrderingService } from './zone-ordering.service';

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
	private eventEmitters = [];

	private currentReviewId: string;
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

	constructor(
		private readonly gameEvents: GameEventsEmitterService,
		private readonly events: Events,
		private readonly gameStateMetaInfos: GameStateMetaInfoService,
		private readonly zoneOrdering: ZoneOrderingService,
		private readonly prefs: PreferencesService,
		private readonly twitch: TwitchAuthService,
		private readonly deckCardService: DeckCardService,
		private readonly ow: OverwolfService,
		private readonly secretsParser: SecretsParserService,
		private readonly attackOnBoardService: AttackOnBoardService,
		private readonly gameStateUpdates: GameStateUpdatesService,
		private readonly parserService: GameStateParsersService,
		private readonly statePostProcessService: StatePostProcessService,
		// Just to make sure decktrackerDisplayEventBus is defined
		private readonly display: OverlayDisplayService,
	) {
		this.init();
	}

	private async init() {
		window['deckEventBus'] = this.deckEventBus;
		window['deckUpdater'] = this.deckUpdater;
		if (!this.ow) {
			console.warn('[game-state] Could not find OW service');
			return;
		}

		await this.gameStateUpdates.isReady();
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

	// TODO: this should move elsewhere
	public async getCurrentReviewId(): Promise<string> {
		return new Promise<string>((resolve) => this.getCurrentReviewIdInternal((reviewId) => resolve(reviewId)));
	}

	private async getCurrentReviewIdInternal(callback, retriesLeft = 15) {
		if (retriesLeft <= 0) {
			console.error('[game-state] Review ID was never set, assigning new one');
			this.currentReviewId = uuid();
		}
		if (!this.currentReviewId) {
			setTimeout(() => this.getCurrentReviewIdInternal(callback, retriesLeft - 1), 1000);
			return;
		}
		callback(this.currentReviewId);
	}

	private registerGameEvents() {
		this.gameEvents.onGameStart.subscribe((event) => {
			console.log('[game-state] game start event received, resetting currentReviewId');
			this.currentReviewId = uuid();
			console.log('[game-state] built currentReviewId', this.currentReviewId);
			const info = {
				type: 'new-empty-review',
				reviewId: this.currentReviewId,
			};
			this.events.broadcast(Events.REVIEW_INITIALIZED, info);
		});
		this.gameEvents.allEvents.subscribe((gameEvent: GameEvent) => {
			this.processingQueue.enqueue(gameEvent);
		});
		this.events
			.on(Events.ACHIEVEMENT_PROGRESSION)
			.subscribe((event) =>
				this.processingQueue.enqueue(new ConstructedAchievementsProgressionEvent(event.data[0])),
			);

		// Reset the deck if it exists
		// this.processingQueue.enqueue(Object.assign(new GameEvent(), { type: GameEvent.GAME_END } as GameEvent));
	}

	private async processQueue(eventQueue: readonly (GameEvent | GameStateEvent)[]) {
		// So that ZONE_POSITION_CHANGED events are processed a bit more often
		const chunks = chunk(eventQueue, 20);
		for (const subQueue of chunks) {
			try {
				const stateUpdateEvents = subQueue.filter((event) => event.type === GameEvent.GAME_STATE_UPDATE);
				const stateUpdateEvent =
					stateUpdateEvents.length > 0 ? stateUpdateEvents[stateUpdateEvents.length - 1] : null;
				const zonePositionChangedEvent = mergeZonePositionChangedEvents(
					subQueue.filter((event) => event.type === GameEvent.ZONE_POSITION_CHANGED) as GameEvent[],
				);
				// Processing these should be super quick, as in most cases they won't lead to a state update
				// const attackOnBoardEvents = subQueue.filter((event) => event.type === GameEvent.TOTAL_ATTACK_ON_BOARD);
				const eventsToProcess = [
					...subQueue.filter(
						(event) =>
							event.type !== GameEvent.GAME_STATE_UPDATE &&
							event.type !== GameEvent.ZONE_POSITION_CHANGED,
					),
					// stateUpdateEvents.length > 0 ? stateUpdateEvents[stateUpdateEvents.length - 1] : null,
					zonePositionChangedEvent,
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
				if (currentState && (stateUpdateEvent != null || currentState !== this.state)) {
					const start = Date.now();
					// const previousState = initialState;
					// console.debug('[game-state] state post-processing');
					const postProcessedState = this.statePostProcessService.postProcess(currentState);
					// Add information that is not linked to events, like the number of turns the
					// card has been present in the zone
					const updatedPlayerDeck = this.updateDeck(
						postProcessedState.playerDeck,
						postProcessedState,
						(stateUpdateEvent || ({} as any)).Player,
					);
					// console.debug(
					// 	'[game-state] updated player deck',
					// 	postProcessedState.playerDeck === updatedPlayerDeck,
					// 	updatedPlayerDeck,
					// 	postProcessedState.playerDeck,
					// );

					const udpatedOpponentDeck = this.updateDeck(
						postProcessedState.opponentDeck,
						postProcessedState,
						(stateUpdateEvent || ({} as any)).Opponent,
					);
					// console.debug(
					// 	'[game-state] updated opponent deck',
					// 	postProcessedState.opponentDeck === udpatedOpponentDeck,
					// 	udpatedOpponentDeck,
					// 	postProcessedState.opponentDeck,
					// );

					const hasChanged =
						postProcessedState !== currentState ||
						updatedPlayerDeck !== postProcessedState.playerDeck ||
						udpatedOpponentDeck !== postProcessedState.opponentDeck;
					currentState = hasChanged
						? postProcessedState.update({
								playerDeck: updatedPlayerDeck,
								opponentDeck: udpatedOpponentDeck,
						  })
						: postProcessedState;
					const elapsed = Date.now() - start;
					if (elapsed > 1000) {
						console.warn('[game-state] post-processing took too long', elapsed);
					}
					// console.debug('[game-state] updated state', initialState === previousState, initialState);
				}

				if (currentState && currentState !== this.state) {
					console.debug('[game-state] state has changed', currentState);
					this.state = currentState;
					this.eventEmitters.forEach((emitter) => emitter(currentState));
				} else {
					console.debug(
						'[game-state] state is unchanged, not emitting event',
						// gameEvent.type,
						// gameEvent.cardId,
						// gameEvent.entityId,
					);
				}
				// console.debug('[game-state] processed events', eventsToProcess.length, 'in', Date.now() - start);
			} catch (e) {
				console.error('Exception while processing event', e);
			}
		}
		return [];
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
					// console.debug(
					// 	'[game-state] parsed event',
					// 	gameEvent.type,
					// 	initialState === stateBeforeParser,
					// 	initialState,
					// 	parser,
					// );
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

		console.debug('[game-state] processed event', gameEvent.type, currentState, gameEvent);
		return currentState;
	}

	// TODO: this should move elsewhere
	// TODO: not a big fan of this. These methods should probably be called only once, on the appropriate action
	// this feels lazy, and probably perf-hungry
	private updateDeck(deck: DeckState, gameState: GameState, playerFromTracker: PlayerGameState): DeckState {
		// Maybe only update this when we have NEW_TURN events?
		const stateWithMetaInfos = this.gameStateMetaInfos.updateDeck(deck, gameState.currentTurn);
		if (!playerFromTracker) {
			return stateWithMetaInfos;
		}

		// This could be completely removed by support the "POSITION_IN_ZONE" tag and tag changes
		const playerDeckWithZonesOrdered = stateWithMetaInfos; // this.zoneOrdering.orderZones(stateWithMetaInfos, playerFromTracker);

		// Could also just support the DORMANT tag event
		const newBoard: readonly DeckCard[] = playerDeckWithZonesOrdered.board.map((card) => {
			const entity = playerFromTracker.Board?.find((entity) => entity.entityId === card.entityId);
			const dormantTag = hasTag(entity, GameTag.DORMANT);
			return dormantTag === card.dormant ? card : card.update({ dormant: dormantTag });
		});

		// Same here, just supporting the events should be enough?
		const maxMana = playerFromTracker.Hero.tags?.find((t) => t.Name == GameTag.RESOURCES)?.Value ?? 0;
		const manaSpent = playerFromTracker.Hero.tags?.find((t) => t.Name == GameTag.RESOURCES_USED)?.Value ?? 0;
		const manaLeft = maxMana == null || manaSpent == null ? null : maxMana - manaSpent;
		const newHero: HeroCard =
			manaLeft != playerDeckWithZonesOrdered.hero?.manaLeft
				? playerDeckWithZonesOrdered.hero?.update({
						manaLeft: maxMana == null || manaSpent == null ? null : maxMana - manaSpent,
				  })
				: playerDeckWithZonesOrdered.hero;

		// Not sure this is needed, we can just use the info from the game state
		const cardsLeftInDeck = playerFromTracker.Deck?.length;

		// This could probably be moved on the C# side, updated at the end of each BLOCK and sent via a new event
		// const totalAttackOnBoard = this.attackOnBoardService.computeAttackOnBoard(deck, playerFromTracker);

		// Overall this whole process could likely be completely removed
		const hasChanged =
			playerDeckWithZonesOrdered !== stateWithMetaInfos ||
			!arraysEqual(newBoard, playerDeckWithZonesOrdered.board) ||
			newHero !== playerDeckWithZonesOrdered.hero ||
			cardsLeftInDeck !== playerDeckWithZonesOrdered.cardsLeftInDeck;
		// ||
		// !(
		// 	totalAttackOnBoard.board === playerDeckWithZonesOrdered.totalAttackOnBoard.board &&
		// 	totalAttackOnBoard.hero === playerDeckWithZonesOrdered.totalAttackOnBoard.hero
		// );

		return hasChanged
			? playerDeckWithZonesOrdered.update({
					board: newBoard,
					hero: newHero,
					cardsLeftInDeck: cardsLeftInDeck,
					// totalAttackOnBoard: totalAttackOnBoard,
			  })
			: stateWithMetaInfos;
	}

	private async buildEventEmitters() {
		const result = [
			(event) => this.deckEventBus.next(event),
			(event) => this.gameStateUpdates.updateGameState(event.state),
		];
		const prefs = await this.prefs.getPreferences();
		console.log('is logged in to Twitch?', !!prefs.twitchAccessToken);
		if (prefs.twitchAccessToken) {
			const isTokenValid = await this.twitch.validateToken(prefs.twitchAccessToken);
			if (!isTokenValid) {
				console.log('Twitch token is not valid, removing it');
				this.prefs.setTwitchAccessToken(undefined);
				await this.twitch.sendExpiredTwitchTokenNotification();
			} else {
				result.push((event) => this.twitch.emitDeckEvent(event));
			}
		}
		this.eventEmitters = result;
	}
}

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
	console.debug('[game-state] merging zone position changed events', merged, events);
	return merged;
};
