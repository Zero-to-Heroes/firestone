import { EventEmitter, Injectable } from '@angular/core';
import { GameTag } from '@firestone-hs/reference-data';
import { DeckCard, DeckState, GameState, GameStateUpdatesService, HeroCard } from '@firestone/game-state';
import { PreferencesService } from '@firestone/shared/common/service';
import { OverwolfService } from '@firestone/shared/framework/core';
import { AttackOnBoardService, hasTag } from '@services/decktracker/attack-on-board.service';
import { BehaviorSubject, distinctUntilChanged } from 'rxjs';
import { GameStateEvent } from '../../models/decktracker/game-state-event';
import { GameEvent, PlayerGameState } from '../../models/game-event';
import { MinionsDiedEvent } from '../../models/mainwindow/game-events/minions-died-event';
import { Events } from '../events.service';
import { GameEventsEmitterService } from '../game-events-emitter.service';
import { TwitchAuthService } from '../mainwindow/twitch-auth.service';
import { ProcessingQueue } from '../processing-queue.service';
import { uuid } from '../utils';
import { DeckCardService } from './deck-card.service';
import { EventParser } from './event-parser/event-parser';
import { SecretsParserService } from './event-parser/secrets/secrets-parser.service';
import { ConstructedAchievementsProgressionEvent } from './event/constructed-achievements-progression-event';
import { GameStateMetaInfoService } from './game-state-meta-info.service';
import { GameStateParsersService } from './game-state/state-parsers.service';
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
	private deckEventBus = new BehaviorSubject<any>(null);
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
		try {
			const stateUpdateEvents = eventQueue.filter((event) => event.type === GameEvent.GAME_STATE_UPDATE);
			const eventsToProcess = [
				...eventQueue.filter((event) => event.type !== GameEvent.GAME_STATE_UPDATE),
				stateUpdateEvents.length > 0 ? stateUpdateEvents[stateUpdateEvents.length - 1] : null,
			].filter((event) => event);
			if (stateUpdateEvents.length > 0) {
				// console.debug('[game-state] processing state update events', stateUpdateEvents, eventsToProcess);
			}
			for (let i = 0; i < eventsToProcess.length; i++) {
				if (eventsToProcess[i] instanceof GameEvent) {
					await this.processEvent(eventsToProcess[i] as GameEvent);
				} else {
					await this.processNonMatchEvent(eventsToProcess[i] as GameStateEvent);
				}
			}
		} catch (e) {
			console.error('Exception while processing event', e);
		}
		return [];
	}

	private async processNonMatchEvent(event: GameStateEvent) {
		if (event.type === 'TOGGLE_SECRET_HELPER') {
			this.state = this.state.update({
				opponentDeck: this.state.opponentDeck.update({
					secretHelperActive: !this.state.opponentDeck.secretHelperActive,
				} as DeckState),
			} as GameState);
		} else if (event.type === 'CLOSE_TRACKER') {
			this.state = this.state.update({
				playerTrackerClosedByUser: true,
			});
		} else if (event.type === 'CLOSE_OPPONENT_TRACKER') {
			this.state = this.state.update({
				opponentTrackerClosedByUser: true,
			});
		}

		const parsersForEvent = this.eventParsers[event.type] ?? [];
		for (const parser of parsersForEvent) {
			try {
				if (parser.applies(event, this.state)) {
					this.state = await parser.parse(this.state, event);
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

		const emittedEvent = {
			event: {
				name: event.type,
			},
			state: this.state,
		};
		this.eventEmitters.forEach((emitter) => emitter(emittedEvent));
		if (this.state) {
			// console.debug('[game-state] emitting non-game event', emittedEvent.event.name, emittedEvent.state);
		}
	}

	private async processEvent(gameEvent: GameEvent) {
		if (gameEvent.type === GameEvent.GAME_START) {
			this.state = this.state?.update({
				playerTrackerClosedByUser: false,
				opponentTrackerClosedByUser: false,
			});
		} else if (gameEvent.type === GameEvent.SPECTATING) {
			this.state = this.state?.update({
				// We can't "unspectate" a game
				spectating: this.state.spectating || gameEvent.additionalData.spectating,
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

		this.state = await this.secretsParser.parseSecrets(this.state, gameEvent, {
			secretWillTrigger: this.secretWillTrigger,
			minionsWillDie: this.minionsWillDie,
		});
		const prefs = await this.prefs.getPreferences();
		const parsersForEvent = this.eventParsers[gameEvent.type] ?? [];
		for (const parser of parsersForEvent) {
			try {
				if (parser.applies(gameEvent, this.state, prefs)) {
					this.state = await parser.parse(this.state, gameEvent, {
						secretWillTrigger: this.secretWillTrigger,
						minionsWillDie: this.minionsWillDie,
					});
					// if (!this.state) {
					// 	console.error('[game-state] parser returned null state', parser.event());
					// }
				}
			} catch (e) {
				console.error('[game-state] Exception while applying parser', parser.event(), e.message, e.stack, e);
			}
		}
		try {
			if (this.state) {
				// Add information that is not linked to events, like the number of turns the
				// card has been present in the zone
				const updatedPlayerDeck = this.updateDeck(
					this.state.playerDeck,
					this.state,
					(gameEvent.gameState || ({} as any)).Player,
				);
				const udpatedOpponentDeck = this.updateDeck(
					this.state.opponentDeck,
					this.state,
					(gameEvent.gameState || ({} as any)).Opponent,
				);
				this.state = Object.assign(new GameState(), this.state, {
					playerDeck: updatedPlayerDeck,
					opponentDeck: udpatedOpponentDeck,
				} as GameState);
			}
		} catch (e) {
			console.error('[game-state] Could not update players decks', gameEvent.type, e.message, e.stack, e);
		}

		if (this.state) {
			const emittedEvent = {
				event: {
					name: gameEvent.type,
				},
				state: this.state,
			};
			// console.debug(
			// 	'[game-state] emitting event',
			// 	emittedEvent.event.name,
			// 	gameEvent.entityId,
			// 	gameEvent.cardId,
			// 	gameEvent,
			// 	emittedEvent.state,
			// );
			this.eventEmitters.forEach((emitter) => emitter(emittedEvent));
		}

		// We have processed the event for which the secret would trigger
		if (
			gameEvent.type !== GameEvent.SECRET_WILL_TRIGGER &&
			gameEvent.type !== GameEvent.COUNTER_WILL_TRIGGER &&
			// Sometimes these events are sent even if the cost doesn't actually change
			gameEvent.type !== GameEvent.COST_CHANGED &&
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
	}

	// TODO: this should move elsewhere
	private updateDeck(deck: DeckState, gameState: GameState, playerFromTracker: PlayerGameState): DeckState {
		const stateWithMetaInfos = this.gameStateMetaInfos.updateDeck(deck, gameState.currentTurn);
		// Add missing info like card names, if the card added doesn't come from a deck state
		// (like with the Chess brawl)
		const newState = this.deckCardService.fillMissingCardInfoInDeck(stateWithMetaInfos);
		// const playerDeckWithDynamicZones = this.dynamicZoneHelper.fillDynamicZones(newState, this.i18n);
		if (!playerFromTracker) {
			return newState;
		}

		const playerDeckWithZonesOrdered = this.zoneOrdering.orderZones(newState, playerFromTracker);
		const newBoard: readonly DeckCard[] = playerDeckWithZonesOrdered.board.map((card) => {
			const entity = playerFromTracker.Board?.find((entity) => entity.entityId === card.entityId);
			return DeckCard.create({
				...card,
				dormant: hasTag(entity, GameTag.DORMANT),
			} as DeckCard);
		});
		const maxMana = playerFromTracker.Hero.tags?.find((t) => t.Name == GameTag.RESOURCES)?.Value ?? 0;
		const manaSpent = playerFromTracker.Hero.tags?.find((t) => t.Name == GameTag.RESOURCES_USED)?.Value ?? 0;
		const newHero: HeroCard = playerDeckWithZonesOrdered.hero?.update({
			manaLeft: maxMana == null || manaSpent == null ? null : maxMana - manaSpent,
		});
		return playerDeckWithZonesOrdered.update({
			board: newBoard,
			hero: newHero,
			cardsLeftInDeck: playerFromTracker.Deck ? playerFromTracker.Deck.length : null,
			totalAttackOnBoard: this.attackOnBoardService.computeAttackOnBoard(deck, playerFromTracker),
		} as DeckState);
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
				this.prefs.setTwitchAccessToken(undefined);
				await this.twitch.sendExpiredTwitchTokenNotification();
			} else {
				result.push((event) => this.twitch.emitDeckEvent(event));
			}
		}
		this.eventEmitters = result;
	}
}
