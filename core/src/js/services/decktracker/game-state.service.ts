import { EventEmitter, Injectable } from '@angular/core';
import { GameTag } from '@firestone-hs/reference-data';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { BehaviorSubject } from 'rxjs';
import { AttackOnBoard } from '../../models/decktracker/attack-on-board';
import { DeckState } from '../../models/decktracker/deck-state';
import { GameState } from '../../models/decktracker/game-state';
import { GameStateEvent } from '../../models/decktracker/game-state-event';
import { GameEvent } from '../../models/game-event';
import { Preferences } from '../../models/preferences';
import { Events } from '../events.service';
import { FeatureFlags } from '../feature-flags';
import { GameEventsEmitterService } from '../game-events-emitter.service';
import { TwitchAuthService } from '../mainwindow/twitch-auth.service';
import { ManastormInfo } from '../manastorm-bridge/manastorm-info';
import { OverwolfService } from '../overwolf.service';
import { PreferencesService } from '../preferences.service';
import { ProcessingQueue } from '../processing-queue.service';
import { AiDeckService } from './ai-deck-service.service';
import { DeckCardService } from './deck-card.service';
import { DeckHandlerService } from './deck-handler.service';
import { DeckParserService } from './deck-parser.service';
import { DynamicZoneHelperService } from './dynamic-zone-helper.service';
import { AssignCardIdParser } from './event-parser/assign-card-ids-parser';
import { BurnedCardParser } from './event-parser/burned-card-parser';
import { CardBackToDeckParser } from './event-parser/card-back-to-deck-parser';
import { CardBuffedInHandParser } from './event-parser/card-buffed-in-hand-parser';
import { CardChangedInDeckParser } from './event-parser/card-changed-in-deck-parser';
import { CardChangedInHandParser } from './event-parser/card-changed-in-hand-parser';
import { CardChangedOnBoardParser } from './event-parser/card-changed-on-board-parser';
import { CardCreatorChangedParser } from './event-parser/card-creator-changed-parser';
import { CardDrawParser } from './event-parser/card-draw-parser';
import { CardOnBoardAtGameStart } from './event-parser/card-on-board-at-game-start-parser';
import { CardPlayedFromHandParser } from './event-parser/card-played-from-hand-parser';
import { CardRecruitedParser } from './event-parser/card-recruited-parser';
import { CardRemovedFromBoardParser } from './event-parser/card-removed-from-board-parser';
import { CardRemovedFromDeckParser } from './event-parser/card-removed-from-deck-parser';
import { CardRemovedFromHandParser } from './event-parser/card-removed-from-hand-parser';
import { CardRevealedParser } from './event-parser/card-revealed-parser';
import { CardStolenParser } from './event-parser/card-stolen-parser';
import { ConstructedAchievementsProgressionParser } from './event-parser/constructed/constructed-achievements-progression-parser';
import { ConstructedChangeTabParser } from './event-parser/constructed/constructed-change-tab-parser';
import { ListCardsPlayedFromInitialDeckParser } from './event-parser/constructed/list-cards-played-from-initial-deck-parser';
import { CreateCardInDeckParser } from './event-parser/create-card-in-deck-parser';
import { CreateCardInGraveyardParser } from './event-parser/create-card-in-graveyard-parser';
import { CthunParser } from './event-parser/cthun-parser';
import { CthunRevealedParser } from './event-parser/cthun-revealed-parser';
import { DamageTakenParser } from './event-parser/damage-taken-parser';
import { DeckManipulationHelper } from './event-parser/deck-manipulation-helper';
import { DecklistUpdateParser } from './event-parser/decklist-update-parser';
import { DeckstringOverrideParser } from './event-parser/deckstring-override-parser';
import { DiscardedCardParser } from './event-parser/discarded-card-parser';
import { EndOfEchoInHandParser } from './event-parser/end-of-echo-in-hand-parser';
import { EntityUpdateParser } from './event-parser/entity-update-parser';
import { EventParser } from './event-parser/event-parser';
import { FatigueParser } from './event-parser/fatigue-parser';
import { FirstPlayerParser } from './event-parser/first-player-parser';
import { GalakrondInvokedParser } from './event-parser/galakrond-invoked-parser';
import { GameEndParser } from './event-parser/game-end-parser';
import { GameRunningParser } from './event-parser/game-running-parser';
import { GameStartParser } from './event-parser/game-start-parser';
import { HeroPowerChangedParser } from './event-parser/hero-power-changed-parser';
import { JadeGolemParser } from './event-parser/jade-golem-parser';
import { LocalPlayerParser } from './event-parser/local-player-parser';
import { MainStepReadyParser } from './event-parser/main-step-ready-parser';
import { MatchMetadataParser } from './event-parser/match-metadata-parser';
import { MinionBackOnBoardParser } from './event-parser/minion-back-on-board-parser';
import { MinionDiedParser } from './event-parser/minion-died-parser';
import { MinionGoDormantParser } from './event-parser/minion-go-dormant-parser';
import { MinionOnBoardAttackUpdatedParser } from './event-parser/minion-on-board-attack-updated-parser';
import { MinionSummonedFromHandParser } from './event-parser/minion-summoned-from-hand-parser';
import { MinionSummonedParser } from './event-parser/minion-summoned-parser';
import { MulliganOverParser } from './event-parser/mulligan-over-parser';
import { NewTurnParser } from './event-parser/new-turn-parser';
import { OpponentPlayerParser } from './event-parser/opponent-player-parser';
import { PassiveTriggeredParser } from './event-parser/passive-triggered-parser';
import { PlayersInfoParser } from './event-parser/players-info-parser';
import { PogoPlayedParser } from './event-parser/pogo-played-parser';
import { QuestCreatedInGameParser } from './event-parser/quest-created-in-game-parser';
import { QuestDestroyedParser } from './event-parser/quest-destroyed-parser';
import { QuestPlayedFromDeckParser } from './event-parser/quest-played-from-deck-parser';
import { QuestPlayedFromHandParser } from './event-parser/quest-played-from-hand-parser';
import { ReceiveCardInHandParser } from './event-parser/receive-card-in-hand-parser';
import { ReconnectOverParser } from './event-parser/reconnect-over-parser';
import { SecretCreatedInGameParser } from './event-parser/secret-created-in-game-parser';
import { SecretDestroyedParser } from './event-parser/secret-destroyed-parser';
import { SecretPlayedFromDeckParser } from './event-parser/secret-played-from-deck-parser';
import { SecretPlayedFromHandParser } from './event-parser/secret-played-from-hand-parser';
import { SecretTriggeredParser } from './event-parser/secret-triggered-parser';
import { SecretsParserService } from './event-parser/secrets/secrets-parser.service';
import { WeaponDestroyedParser } from './event-parser/weapon-destroyed-parser';
import { WeaponEquippedParser } from './event-parser/weapon-equipped-parser';
import { WhizbangDeckParser } from './event-parser/whizbang-deck-id-parser';
import { ConstructedAchievementsProgressionEvent } from './event/constructed-achievements-progression-event';
import { GameStateMetaInfoService } from './game-state-meta-info.service';
import { ConstructedWindowHandler } from './overlays/constructed-window-handler';
import { AttackOpponentCounterOverlayHandler } from './overlays/counter-opponent-attack-handler';
import { CthunOpponentCounterOverlayHandler } from './overlays/counter-opponent-cthun-handler';
import { FatigueOpponentCounterOverlayHandler } from './overlays/counter-opponent-fatigue-handler';
import { GalakroundOpponentCounterOverlayHandler } from './overlays/counter-opponent-galakrond-handler';
import { JadeGolemOpponentCounterOverlayHandler } from './overlays/counter-opponent-jade-golem-handler';
import { LibramOpponentCounterOverlayHandler } from './overlays/counter-opponent-libram-handler';
import { PogoOpponentCounterOverlayHandler } from './overlays/counter-opponent-pogo-handler';
import { WatchpostOpponentCounterOverlayHandler } from './overlays/counter-opponent-watchpost-handler';
import { AttackPlayerCounterOverlayHandler } from './overlays/counter-player-attack-handler';
import { CthunPlayerCounterOverlayHandler } from './overlays/counter-player-cthun-handler';
import { ElementalPlayerCounterOverlayHandler } from './overlays/counter-player-elemental-handler';
import { FatiguePlayerCounterOverlayHandler } from './overlays/counter-player-fatigue-handler';
import { GalakroundPlayerCounterOverlayHandler } from './overlays/counter-player-galakrond-handler';
import { JadeGolemPlayerCounterOverlayHandler } from './overlays/counter-player-jade-golem-handler';
import { LibramPlayerCounterOverlayHandler } from './overlays/counter-player-libram-handler';
import { PogoPlayerCounterOverlayHandler } from './overlays/counter-player-pogo-handler';
import { SpellsPlayerCounterOverlayHandler } from './overlays/counter-player-spells-handler';
import { WatchpostPlayerCounterOverlayHandler } from './overlays/counter-player-watchpost-handler';
import { OpponentDeckOverlayHandler } from './overlays/opponent-deck-overlay-handler';
import { OpponentHandOverlayHandler } from './overlays/opponent-hand-overlay-handler';
import { OverlayHandler } from './overlays/overlay-handler';
import { PlayerDeckOverlayHandler } from './overlays/player-deck-overlay-handler';
import { SecretsHelperOverlayHandler } from './overlays/secrets-helper-overlay-handler';
import { SecretConfigService } from './secret-config.service';
import { ZoneOrderingService } from './zone-ordering.service';

@Injectable()
export class GameStateService {
	public state: GameState = new GameState();
	private eventParsers: readonly EventParser[];

	// Keep a single queue to avoid race conditions between the two queues (since they
	// modify the same state)
	private processingQueue = new ProcessingQueue<GameEvent | GameStateEvent>(
		eventQueue => this.processQueue(eventQueue),
		50,
		'game-state',
	);

	// We need to get through a queue to avoid race conditions when two events are close together,
	// so that we're sure teh state is update sequentially
	// private eventQueue: Queue<GameEvent> = new Queue<GameEvent>();
	private deckEventBus = new BehaviorSubject<any>(null);
	private deckUpdater: EventEmitter<GameEvent | GameStateEvent> = new EventEmitter<GameEvent | GameStateEvent>();
	private eventEmitters = [];
	private overlayHandlers: OverlayHandler[] = [];

	private currentReviewId: string;
	private secretWillTrigger: {
		cardId: string;
		reactingTo: string;
	};

	private showDecktrackerFromGameMode: boolean;

	constructor(
		private gameEvents: GameEventsEmitterService,
		private events: Events,
		private dynamicZoneHelper: DynamicZoneHelperService,
		private gameStateMetaInfos: GameStateMetaInfoService,
		private zoneOrdering: ZoneOrderingService,
		private allCards: AllCardsService,
		private prefs: PreferencesService,
		private twitch: TwitchAuthService,
		private deckCardService: DeckCardService,
		private ow: OverwolfService,
		private deckParser: DeckParserService,
		private helper: DeckManipulationHelper,
		private aiDecks: AiDeckService,
		private secretsConfig: SecretConfigService,
		private secretsParser: SecretsParserService,
		private readonly deckHandler: DeckHandlerService,
	) {
		this.eventParsers = this.buildEventParsers();
		this.registerGameEvents();
		this.buildEventEmitters();
		this.buildOverlayHandlers();
		if (!this.ow) {
			console.warn('[game-state] Could not find OW service');
			return;
		}
		const preferencesEventBus: EventEmitter<any> = this.ow.getMainWindow().preferencesEventBus;
		preferencesEventBus.subscribe(async event => {
			if (event.name === PreferencesService.TWITCH_CONNECTION_STATUS) {
				console.log('rebuilding event emitters');
				this.buildEventEmitters();
				return;
			}
		});
		this.deckUpdater.subscribe((event: GameEvent | GameStateEvent) => {
			this.processingQueue.enqueue(event);
		});
		window['deckEventBus'] = this.deckEventBus;
		window['deckUpdater'] = this.deckUpdater;
		setTimeout(() => {
			const decktrackerDisplayEventBus: BehaviorSubject<boolean> = this.ow.getMainWindow()
				.decktrackerDisplayEventBus;
			decktrackerDisplayEventBus.subscribe(event => {
				if (this.showDecktrackerFromGameMode === event) {
					return;
				}
				this.showDecktrackerFromGameMode = event;
				this.updateOverlays(this.state, false, false);
			});
		});
		this.handleDisplayPreferences();
		setTimeout(() => {
			const preferencesEventBus: EventEmitter<any> = this.ow.getMainWindow().preferencesEventBus;
			preferencesEventBus.subscribe(event => {
				if (event) {
					this.handleDisplayPreferences(event.preferences);
				}
			});
		});
		this.ow.addGameInfoUpdatedListener(async (res: any) => {
			if (this.ow.exitGame(res) || !(await this.ow.inGame())) {
				this.ow.closeWindow(OverwolfService.DECKTRACKER_WINDOW);
				this.ow.closeWindow(OverwolfService.DECKTRACKER_OPPONENT_WINDOW);
				this.ow.closeWindow(OverwolfService.MATCH_OVERLAY_OPPONENT_HAND_WINDOW);
			}
			if (await this.ow.inGame()) {
				this.updateOverlays(this.state);
			}
		});
	}

	// TODO: this should move elsewhere
	public async getCurrentReviewId(): Promise<string> {
		return new Promise<string>(resolve => this.getCurrentReviewIdInternal(reviewId => resolve(reviewId)));
	}

	private async getCurrentReviewIdInternal(callback, retriesLeft = 15) {
		if (retriesLeft <= 0) {
			console.error('[game-state] Could not get current review id');
			callback(null);
			return;
		}
		if (!this.currentReviewId) {
			setTimeout(() => this.getCurrentReviewIdInternal(callback, retriesLeft - 1), 2000);
			return;
		}
		callback(this.currentReviewId);
	}

	private registerGameEvents() {
		this.gameEvents.onGameStart.subscribe(event => {
			console.log('[game-state] game start event received, resetting currentReviewId');
			this.currentReviewId = undefined;
		});
		this.gameEvents.allEvents.subscribe((gameEvent: GameEvent) => {
			this.processingQueue.enqueue(gameEvent);
		});
		this.events.on(Events.REVIEW_FINALIZED).subscribe(async event => {
			console.log('[game-state] Received review finalized event, doing nothing');
		});
		this.events.on(Events.REVIEW_INITIALIZED).subscribe(async event => {
			console.log('[game-state] Received new review id event');
			const info: ManastormInfo = event.data[0];
			if (info && info.type === 'new-empty-review') {
				this.currentReviewId = info.reviewId;
			}
		});
		this.events
			.on(Events.ACHIEVEMENT_PROGRESSION)
			.subscribe(event =>
				this.processingQueue.enqueue(new ConstructedAchievementsProgressionEvent(event.data[0])),
			);
		// Reset the deck if it exists
		//console.log('[game-state] Enqueueing default game_end event');
		this.processingQueue.enqueue(Object.assign(new GameEvent(), { type: GameEvent.GAME_END } as GameEvent));
	}

	private async processQueue(eventQueue: readonly (GameEvent | GameStateEvent)[]) {
		try {
			const stateUpdateEvents = eventQueue.filter(event => event.type === GameEvent.GAME_STATE_UPDATE);
			const eventsToProcess = [
				...eventQueue.filter(event => event.type !== GameEvent.GAME_STATE_UPDATE),
				stateUpdateEvents.length > 0 ? stateUpdateEvents[stateUpdateEvents.length - 1] : null,
			].filter(event => event);
			for (let i = 0; i < eventsToProcess.length; i++) {
				// console.debug('event to process', eventsToProcess[i]);
				if (eventsToProcess[i] instanceof GameEvent) {
					await this.processEvent(eventsToProcess[i] as GameEvent, i === eventsToProcess.length - 1);
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
		// console.debug('process non matc hevent', event);
		if (event.type === 'TOGGLE_SECRET_HELPER') {
			this.state = this.state.update({
				opponentDeck: this.state.opponentDeck.update({
					secretHelperActive: !this.state.opponentDeck.secretHelperActive,
				} as DeckState),
			} as GameState);
		}

		this.overlayHandlers.forEach(handler =>
			handler.processEvent(event, this.state, this.showDecktrackerFromGameMode),
		);

		for (const parser of this.eventParsers) {
			try {
				if (parser.applies(event, this.state)) {
					this.state = await parser.parse(this.state, event);
				}
			} catch (e) {
				console.error(
					'[game-state] Exception while applying parser for non-match event',
					parser.event(),
					e.message,
					e.stack,
					e,
				);
			}
		}

		this.updateOverlays(this.state);
		const emittedEvent = {
			event: {
				name: event.type,
			},
			state: this.state,
		};
		this.eventEmitters.forEach(emitter => emitter(emittedEvent));
	}

	private async processEvent(gameEvent: GameEvent, shouldUpdateOverlays = true) {
		this.overlayHandlers.forEach(handler =>
			handler.processEvent(gameEvent, this.state, this.showDecktrackerFromGameMode),
		);

		if (gameEvent.type === GameEvent.GAME_START) {
			this.updateOverlays(this.state, false, false, shouldUpdateOverlays);
		} else if (gameEvent.type === GameEvent.GAME_END) {
			this.updateOverlays(this.state, true, true, shouldUpdateOverlays);
		} else if (gameEvent.type === GameEvent.SCENE_CHANGED_MINDVISION) {
			this.updateOverlays(this.state, false, false, shouldUpdateOverlays);
		} else if (gameEvent.type === GameEvent.SECRET_WILL_TRIGGER) {
			this.secretWillTrigger = {
				cardId: gameEvent.cardId,
				reactingTo: gameEvent.additionalData.reactingTo,
			};
			console.log('[game-state] secret will trigger in reaction to', this.secretWillTrigger);
		}

		this.state = await this.secretsParser.parseSecrets(this.state, gameEvent, this.secretWillTrigger);
		const prefs = await this.prefs.getPreferences();
		for (const parser of this.eventParsers) {
			try {
				if (parser.applies(gameEvent, this.state, prefs)) {
					this.state = await parser.parse(this.state, gameEvent, this.secretWillTrigger);
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
				// console.debug('[game-state] emitting new state', gameEvent.type, gameEvent, this.state);
			}
		} catch (e) {
			console.error('[game-state] Could not update players decks', gameEvent.type, e.message, e.stack, e);
		}

		if (this.state) {
			this.updateOverlays(this.state, false, false, shouldUpdateOverlays);
			const emittedEvent = {
				event: {
					name: gameEvent.type,
				},
				state: this.state,
			};
			this.eventEmitters.forEach(emitter => emitter(emittedEvent));
		}

		// We have processed the event for which the secret would trigger
		// TODO: how to handle reconnects, where dev mode is active?
		if (
			this.secretWillTrigger?.reactingTo &&
			gameEvent.type !== GameEvent.SECRET_WILL_TRIGGER &&
			this.secretWillTrigger.reactingTo === gameEvent.cardId
		) {
			console.debug('[game-state] resetting secretWillTrigger', gameEvent, this.secretWillTrigger);
			this.secretWillTrigger = null;
		}
	}

	// TODO: this should move elsewhere
	private updateDeck(deck: DeckState, gameState: GameState, playerFromTracker): DeckState {
		const stateWithMetaInfos = this.gameStateMetaInfos.updateDeck(deck, gameState.currentTurn);
		// Add missing info like card names, if the card added doesn't come from a deck state
		// (like with the Chess brawl)
		const newState = this.deckCardService.fillMissingCardInfoInDeck(stateWithMetaInfos);
		const playerDeckWithDynamicZones = this.dynamicZoneHelper.fillDynamicZones(newState);
		const playerDeckWithZonesOrdered = this.zoneOrdering.orderZones(playerDeckWithDynamicZones, playerFromTracker);
		const totalAttackOnBoard = deck.board
			.map(card => playerFromTracker?.Board?.find(entity => entity.entityId === card.entityId))
			.filter(entity => entity)
			.filter(entity => this.canAttack(entity, deck.isActivePlayer))
			.map(entity => this.windfuryMultiplier(entity) * (entity.attack > 0 ? entity.attack : 0))
			.reduce((a, b) => a + b, 0);
		// console.log(
		// 	'total attack on board',
		// 	playerFromTracker?.Board,
		// 	deck,
		// 	deck.board
		// 		.map(card => playerFromTracker?.Board?.find(entity => entity.entityId === card.entityId))
		// 		.filter(entity => entity && entity.attack > 0)
		// 		.filter(entity => !this.hasTag(entity, GameTag.DORMANT)),
		// );
		const heroAttack =
			this.windfuryMultiplier(playerFromTracker?.Hero) *
			(this.canAttack(playerFromTracker?.Hero, deck.isActivePlayer)
				? Math.max(playerFromTracker?.Hero?.attack, 0) +
				  (deck.isActivePlayer ? 0 : Math.max(playerFromTracker?.Weapon?.attack, 0))
				: 0);
		// console.log(
		// 	'heroAttack',
		// 	playerFromTracker?.Hero,
		// 	this.canAttack(playerFromTracker?.Hero, deck.isActivePlayer),
		// );
		return playerDeckWithZonesOrdered && playerFromTracker
			? playerDeckWithZonesOrdered.update({
					cardsLeftInDeck: playerFromTracker.Deck ? playerFromTracker.Deck.length : null,
					totalAttackOnBoard: {
						board: totalAttackOnBoard,
						hero: heroAttack,
					} as AttackOnBoard,
			  } as DeckState)
			: playerDeckWithZonesOrdered;
	}

	private windfuryMultiplier(entity): number {
		if (this.hasTag(entity, GameTag.MEGA_WINDFURY) || this.hasTag(entity, GameTag.WINDFURY, 3)) {
			return 4;
		}
		if (this.hasTag(entity, GameTag.WINDFURY)) {
			return 2;
		}
		return 1;
	}

	private async updateOverlays(
		state: GameState,
		shouldForceCloseSecretsHelper = false,
		forceLogs = false,
		updateOverlays = true,
	) {
		if (!updateOverlays) {
			return;
		}
		if (!this.ow) {
			console.log('ow not defined, returning');
			return;
		}
		await Promise.all(
			this.overlayHandlers.map(handler =>
				handler.updateOverlay(
					state,
					this.showDecktrackerFromGameMode,
					shouldForceCloseSecretsHelper,
					forceLogs,
				),
			),
		);
	}

	private async handleDisplayPreferences(preferences: Preferences = null) {
		preferences = preferences || (await this.prefs.getPreferences());
		this.overlayHandlers.forEach(handler => handler.handleDisplayPreferences(preferences));
		// this.showOpponentTracker = preferences.opponentTracker;
		// console.log('update opp hand prefs', this.showOpponentHand, preferences);
		this.updateOverlays(this.state);
	}

	private async buildEventEmitters() {
		const result = [event => this.deckEventBus.next(event)];
		const prefs = await this.prefs.getPreferences();
		console.log('is logged in to Twitch?', prefs.twitchAccessToken);
		if (prefs.twitchAccessToken) {
			const isTokenValid = await this.twitch.validateToken(prefs.twitchAccessToken);
			if (!isTokenValid) {
				this.prefs.setTwitchAccessToken(undefined);
				await this.twitch.sendExpiredTwitchTokenNotification();
			} else {
				result.push(event => this.twitch.emitDeckEvent(event));
			}
		}
		this.eventEmitters = result;
	}

	private buildOverlayHandlers() {
		this.overlayHandlers = [
			new PlayerDeckOverlayHandler(this.ow, this.allCards, this.prefs),
			new OpponentDeckOverlayHandler(this.ow, this.allCards, this.prefs),
			new OpponentHandOverlayHandler(this.ow, this.allCards, this.prefs),
			new SecretsHelperOverlayHandler(this.ow, this.allCards, this.prefs),
			new GalakroundPlayerCounterOverlayHandler(this.ow, this.allCards, this.prefs),
			new GalakroundOpponentCounterOverlayHandler(this.ow, this.allCards, this.prefs),
			new PogoPlayerCounterOverlayHandler(this.ow, this.allCards, this.prefs),
			new PogoOpponentCounterOverlayHandler(this.ow, this.allCards, this.prefs),
			new AttackPlayerCounterOverlayHandler(this.ow, this.allCards, this.prefs),
			new AttackOpponentCounterOverlayHandler(this.ow, this.allCards, this.prefs),
			new JadeGolemPlayerCounterOverlayHandler(this.ow, this.allCards, this.prefs),
			new JadeGolemOpponentCounterOverlayHandler(this.ow, this.allCards, this.prefs),
			new WatchpostPlayerCounterOverlayHandler(this.ow, this.allCards, this.prefs),
			new WatchpostOpponentCounterOverlayHandler(this.ow, this.allCards, this.prefs),
			new LibramPlayerCounterOverlayHandler(this.ow, this.allCards, this.prefs),
			new LibramOpponentCounterOverlayHandler(this.ow, this.allCards, this.prefs),
			new CthunPlayerCounterOverlayHandler(this.ow, this.allCards, this.prefs),
			new CthunOpponentCounterOverlayHandler(this.ow, this.allCards, this.prefs),
			new FatiguePlayerCounterOverlayHandler(this.ow, this.allCards, this.prefs),
			new FatigueOpponentCounterOverlayHandler(this.ow, this.allCards, this.prefs),
			new SpellsPlayerCounterOverlayHandler(this.ow, this.allCards, this.prefs),
			new ElementalPlayerCounterOverlayHandler(this.ow, this.allCards, this.prefs),
		];

		if (FeatureFlags.SHOW_CONSTRUCTED_SECONDARY_WINDOW) {
			this.overlayHandlers.push(new ConstructedWindowHandler(this.ow, this.allCards, this.prefs));
		}
	}

	private buildEventParsers(): readonly EventParser[] {
		const parsers: EventParser[] = [
			new GameStartParser(this.deckParser, this.prefs, this.allCards),
			new WhizbangDeckParser(this.deckParser),
			new MatchMetadataParser(this.deckParser, this.prefs, this.allCards),
			new MulliganOverParser(),
			new MainStepReadyParser(),
			new CardDrawParser(this.helper),
			new ReceiveCardInHandParser(this.helper, this.allCards),
			new CardBackToDeckParser(this.helper, this.allCards),
			new CreateCardInDeckParser(this.helper, this.allCards),
			new CardRemovedFromDeckParser(this.helper),
			new CardRemovedFromHandParser(this.helper),
			new CardRemovedFromBoardParser(this.helper),
			new CardChangedOnBoardParser(this.helper, this.allCards),
			new CardChangedInHandParser(this.helper, this.allCards),
			new CardChangedInDeckParser(this.helper, this.allCards),
			new CardPlayedFromHandParser(this.helper, this.allCards),
			new MinionSummonedFromHandParser(this.helper, this.allCards),
			new SecretPlayedFromHandParser(this.helper, this.secretsConfig),
			new EndOfEchoInHandParser(this.helper),
			new GameEndParser(this.prefs, this.deckParser),
			new DiscardedCardParser(this.helper),
			new CardRecruitedParser(this.helper),
			new MinionBackOnBoardParser(this.helper),
			new MinionSummonedParser(this.helper, this.allCards),
			new CardRevealedParser(this.helper, this.allCards),
			new MinionDiedParser(this.helper),
			new BurnedCardParser(this.helper),
			new SecretPlayedFromDeckParser(this.helper, this.secretsConfig),
			new SecretCreatedInGameParser(this.helper, this.secretsConfig, this.allCards),
			new SecretDestroyedParser(this.helper),
			new NewTurnParser(),
			new FirstPlayerParser(),
			new CardStolenParser(this.helper, this.allCards),
			new CardCreatorChangedParser(this.helper),
			new AssignCardIdParser(this.helper),
			new HeroPowerChangedParser(this.helper, this.allCards),
			new WeaponEquippedParser(this.helper, this.allCards),
			new WeaponDestroyedParser(),
			new DeckstringOverrideParser(this.deckHandler),
			new LocalPlayerParser(this.allCards),
			new OpponentPlayerParser(this.aiDecks, this.deckParser, this.helper, this.allCards, this.prefs),
			new PlayersInfoParser(),
			new DecklistUpdateParser(this.aiDecks, this.deckParser, this.prefs),
			new CardOnBoardAtGameStart(this.helper, this.allCards),
			new GameRunningParser(this.deckParser),
			new SecretTriggeredParser(this.helper),
			new QuestCreatedInGameParser(this.helper, this.allCards),
			new QuestDestroyedParser(),
			new QuestPlayedFromDeckParser(this.helper),
			new QuestPlayedFromHandParser(this.helper),
			new MinionOnBoardAttackUpdatedParser(this.helper),
			new GalakrondInvokedParser(),
			new PogoPlayedParser(),
			new JadeGolemParser(),
			new CthunParser(),
			new CardBuffedInHandParser(this.helper, this.allCards),
			new MinionGoDormantParser(this.helper),
			new FatigueParser(),
			new EntityUpdateParser(this.helper, this.allCards),
			new PassiveTriggeredParser(this.helper, this.allCards),
			new DamageTakenParser(),
			new CthunRevealedParser(this.helper, this.allCards),

			new CreateCardInGraveyardParser(this.helper, this.allCards),
			new ReconnectOverParser(this.deckHandler),
		];

		if (FeatureFlags.SHOW_CONSTRUCTED_SECONDARY_WINDOW) {
			parsers.push(new ConstructedAchievementsProgressionParser());
			parsers.push(new ConstructedChangeTabParser());
			parsers.push(new ListCardsPlayedFromInitialDeckParser(this.helper));
		}

		return parsers;
	}

	// TODO: this should move elsewhere
	// On the opponent's turn, we show the total attack, except for dormant minions
	private canAttack(entity, isActivePlayer: boolean): boolean {
		const impossibleToAttack =
			this.hasTag(entity, GameTag.DORMANT) ||
			(isActivePlayer &&
				this.hasTag(entity, GameTag.EXHAUSTED) &&
				!this.hasTag(entity, GameTag.ATTACKABLE_BY_RUSH)) ||
			// Here technically it's not totally correct, as you'd have to know if the
			// frozen minion will unfreeze in the opponent's turn
			(isActivePlayer && this.hasTag(entity, GameTag.FROZEN)) ||
			this.hasTag(entity, GameTag.CANT_ATTACK);
		// console.log(
		// 	'can attack?',
		// 	!impossibleToAttack,
		// 	entity?.cardId,
		// 	this.hasTag(entity, GameTag.EXHAUSTED),
		// 	this.hasTag(entity, GameTag.ATTACKABLE_BY_RUSH),
		// 	this.hasTag(entity, GameTag.CANT_ATTACK),
		// 	entity,
		// );
		// charge / rush?
		return !impossibleToAttack;
	}

	// TODO: this should move elsewhere
	private hasTag(entity, tag: number, value = 1): boolean {
		if (!entity?.tags) {
			return false;
		}
		const matches = entity.tags.some(t => t.Name === tag && t.Value === value);
		return matches;
	}
}
