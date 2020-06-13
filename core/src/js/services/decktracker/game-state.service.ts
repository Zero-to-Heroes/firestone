import { EventEmitter, Injectable } from '@angular/core';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { BehaviorSubject } from 'rxjs';
import { AttackOnBoard } from '../../models/decktracker/attack-on-board';
import { DeckState } from '../../models/decktracker/deck-state';
import { GameState } from '../../models/decktracker/game-state';
import { GameEvent } from '../../models/game-event';
import { Preferences } from '../../models/preferences';
import { Events } from '../events.service';
import { GameEventsEmitterService } from '../game-events-emitter.service';
import { TwitchAuthService } from '../mainwindow/twitch-auth.service';
import { ManastormInfo } from '../manastorm-bridge/manastorm-info';
import { OverwolfService } from '../overwolf.service';
import { PreferencesService } from '../preferences.service';
import { ProcessingQueue } from '../processing-queue.service';
import { AiDeckService } from './ai-deck-service.service';
import { DeckCardService } from './deck-card.service';
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
import { CreateCardInDeckParser } from './event-parser/create-card-in-deck-parser';
import { DeckManipulationHelper } from './event-parser/deck-manipulation-helper';
import { DecklistUpdateParser } from './event-parser/decklist-update-parser';
import { DeckstringOverrideParser } from './event-parser/deckstring-override-parser';
import { DiscardedCardParser } from './event-parser/discarded-card-parser';
import { EndOfEchoInHandParser } from './event-parser/end-of-echo-in-hand-parser';
import { EventParser } from './event-parser/event-parser';
import { FirstPlayerParser } from './event-parser/first-player-parser';
import { GalakrondInvokedParser } from './event-parser/galakrond-invoked-parser';
import { GameEndParser } from './event-parser/game-end-parser';
import { GameRunningParser } from './event-parser/game-running-parser';
import { GameStartParser } from './event-parser/game-start-parser';
import { HeroPowerChangedParser } from './event-parser/hero-power-changed-parser';
import { LocalPlayerParser } from './event-parser/local-player-parser';
import { MainStepReadyParser } from './event-parser/main-step-ready-parser';
import { MatchMetadataParser } from './event-parser/match-metadata-parser';
import { MinionBackOnBoardParser } from './event-parser/minion-back-on-board-parser';
import { MinionDiedParser } from './event-parser/minion-died-parser';
import { MinionOnBoardAttackUpdatedParser } from './event-parser/minion-on-board-attack-updated-parser';
import { MinionSummonedParser } from './event-parser/minion-summoned-parser';
import { MulliganOverParser } from './event-parser/mulligan-over-parser';
import { NewTurnParser } from './event-parser/new-turn-parser';
import { OpponentPlayerParser } from './event-parser/opponent-player-parser';
import { QuestCreatedInGameParser } from './event-parser/quest-created-in-game-parser';
import { QuestDestroyedParser } from './event-parser/quest-destroyed-parser';
import { QuestPlayedFromDeckParser } from './event-parser/quest-played-from-deck-parser';
import { QuestPlayedFromHandParser } from './event-parser/quest-played-from-hand-parser';
import { ReceiveCardInHandParser } from './event-parser/receive-card-in-hand-parser';
import { SecretCreatedInGameParser } from './event-parser/secret-created-in-game-parser';
import { SecretDestroyedParser } from './event-parser/secret-destroyed-parser';
import { SecretPlayedFromDeckParser } from './event-parser/secret-played-from-deck-parser';
import { SecretPlayedFromHandParser } from './event-parser/secret-played-from-hand-parser';
import { SecretTriggeredParser } from './event-parser/secret-triggered-parser';
import { SecretsParserService } from './event-parser/secrets/secrets-parser.service';
import { GameStateMetaInfoService } from './game-state-meta-info.service';
import { OpponentDeckOverlayHandler } from './overlays/opponent-deck-overlay-handler.service';
import { OpponentHandOverlayHandler } from './overlays/opponent-hand-overlay-handler.service';
import { OverlayHandler } from './overlays/overlay-handler';
import { PlayerDeckOverlayHandler } from './overlays/player-deck-overlay-handler.service';
import { SecretsHelperOverlayHandler } from './overlays/secrets-helper-overlay-handler.service';
import { SecretConfigService } from './secret-config.service';
import { ZoneOrderingService } from './zone-ordering.service';

@Injectable()
export class GameStateService {
	public state: GameState = new GameState();
	private eventParsers: readonly EventParser[];

	private processingQueue = new ProcessingQueue<GameEvent>(
		eventQueue => this.processQueue(eventQueue),
		50,
		'game-state',
	);

	// We need to get through a queue to avoid race conditions when two events are close together,
	// so that we're sure teh state is update sequentially
	// private eventQueue: Queue<GameEvent> = new Queue<GameEvent>();
	private deckEventBus = new BehaviorSubject<any>(null);
	private deckUpdater: EventEmitter<GameEvent> = new EventEmitter<GameEvent>();
	private eventEmitters = [];
	private overlayHandlers: OverlayHandler[] = [];

	private currentReviewId: string;

	private showDecktrackerFromGameMode: boolean;
	private onGameScreen: boolean;

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
		this.deckUpdater.subscribe((event: GameEvent) => {
			this.processingQueue.enqueue(event);
		});
		window['deckEventBus'] = this.deckEventBus;
		window['deckUpdater'] = this.deckUpdater;
		// window['deckDebug'] = this;
		window['logGameState'] = () => {
			console.log(JSON.stringify(this.state));
		};
		setTimeout(() => {
			const decktrackerDisplayEventBus: BehaviorSubject<boolean> = this.ow.getMainWindow()
				.decktrackerDisplayEventBus;
			decktrackerDisplayEventBus.subscribe(event => {
				if (this.showDecktrackerFromGameMode === event) {
					return;
				}
				console.log('decktracker display update', event);
				this.showDecktrackerFromGameMode = event;
				console.log('will update overlays', event, this.showDecktrackerFromGameMode);
				this.updateOverlays(this.state, false, true);
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
		// Reset the deck if it exists
		this.processingQueue.enqueue(Object.assign(new GameEvent(), { type: GameEvent.GAME_END } as GameEvent));
	}

	private async processQueue(eventQueue: readonly GameEvent[]) {
		const gameEvent = eventQueue[0];
		try {
			await this.processEvent(gameEvent);
		} catch (e) {
			console.error('Exception while processing event', e);
		}
		return eventQueue.slice(1);
	}

	private async processEvent(gameEvent: GameEvent, allowRequeue = true) {
		this.overlayHandlers.forEach(handler =>
			handler.processEvent(gameEvent, this.state, this.showDecktrackerFromGameMode),
		);

		if (gameEvent.type === 'TOGGLE_SECRET_HELPER') {
			// console.log('[game-state] handling overlay for event', gameEvent.type);
			this.state = this.state.update({
				opponentDeck: this.state.opponentDeck.update({
					secretHelperActive: !this.state.opponentDeck.secretHelperActive,
				} as DeckState),
			} as GameState);
			this.updateOverlays(this.state);
		} else if (gameEvent.type === 'TOGGLE_SECRET_HELPER_HOVER_ON') {
		} else if (gameEvent.type === 'TOGGLE_SECRET_HELPER_HOVER_OFF') {
		} else if (gameEvent.type === GameEvent.GAME_START) {
			this.updateOverlays(this.state, false, true);
		} else if (gameEvent.type === GameEvent.GAME_END) {
			this.updateOverlays(this.state, true, true);
		} else if (gameEvent.type === GameEvent.SCENE_CHANGED) {
			console.log('[game-state] handling overlay for event', gameEvent.type, gameEvent);
			this.onGameScreen = gameEvent.additionalData.scene === 'scene_gameplay';
			this.updateOverlays(this.state);
		}

		// Delay all "card played" and "secret played" events to give Counterspell a chance to apply first
		// Only do so when a secret has been played to avoid impacting the overall experience
		if (
			allowRequeue &&
			(this.state.playerDeck.secrets.length > 0 || this.state.opponentDeck.secrets.length > 0) &&
			[GameEvent.CARD_PLAYED || GameEvent.SECRET_PLAYED || GameEvent.QUEST_PLAYED].indexOf(gameEvent.type) !== -1
		) {
			setTimeout(() => this.processEvent(gameEvent, false), 1500);
			return;
		}
		this.state = await this.secretsParser.parseSecrets(this.state, gameEvent);

		for (const parser of this.eventParsers) {
			try {
				if (parser.applies(gameEvent, this.state, await this.prefs.getPreferences())) {
					const stateAfterParser = await parser.parse(this.state, gameEvent);
					if (stateAfterParser) {
						// Add information that is not linked to events, like the number of turns the
						// card has been present in the zone
						const updatedPlayerDeck = this.updateDeck(
							stateAfterParser.playerDeck,
							stateAfterParser,
							(gameEvent.gameState || ({} as any)).Player,
						);
						const udpatedOpponentDeck = this.updateDeck(
							stateAfterParser.opponentDeck,
							stateAfterParser,
							(gameEvent.gameState || ({} as any)).Opponent,
						);
						this.state = Object.assign(new GameState(), stateAfterParser, {
							playerDeck: updatedPlayerDeck,
							opponentDeck: udpatedOpponentDeck,
						} as GameState);
					} else {
						this.state = null;
					}
				}
			} catch (e) {
				console.error('[game-state] Exception while applying parser', parser.event(), e.message, e.stack, e);
			}
		}
		await this.updateOverlays(
			this.state,
			false,
			[GameEvent.MATCH_METADATA, GameEvent.LOCAL_PLAYER].indexOf(gameEvent.type) !== -1,
		);
		const emittedEvent = {
			event: {
				name: gameEvent.type,
			},
			state: this.state,
		};
		// console.log('[game-state] will emit event', gameEvent.type, emittedEvent);
		this.eventEmitters.forEach(emitter => emitter(emittedEvent));
	}

	private updateDeck(deck: DeckState, gameState: GameState, playerFromTracker): DeckState {
		const stateWithMetaInfos = this.gameStateMetaInfos.updateDeck(deck, gameState.currentTurn);
		// Add missing info like card names, if the card added doesn't come from a deck state
		// (like with the Chess brawl)
		const newState = this.deckCardService.fillMissingCardInfoInDeck(stateWithMetaInfos);
		const playerDeckWithDynamicZones = this.dynamicZoneHelper.fillDynamicZones(newState);
		const playerDeckWithZonesOrdered = this.zoneOrdering.orderZones(playerDeckWithDynamicZones, playerFromTracker);
		const totalAttackOnBoard = deck.board
			.map(card => playerFromTracker?.Board?.find(entity => entity.entityId === card.entityId))
			.filter(entity => entity && entity.attack > 0)
			.map(entity => entity.attack || 0)
			.reduce((a, b) => a + b, 0);
		const heroAttack = playerFromTracker?.Hero?.attack > 0 ? playerFromTracker?.Hero?.attack : 0;
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

	private async updateOverlays(state: GameState, shouldForceCloseSecretsHelper = false, forceLogs = false) {
		if (!this.ow) {
			console.log('ow not defined, returning');
			return;
		}
		// if (forceLogs) {
		// 	console.log('will call all overlay handlers', state, shouldForceCloseSecretsHelper, this.overlayHandlers);
		// }
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
			new PlayerDeckOverlayHandler(this.ow),
			new OpponentDeckOverlayHandler(this.ow),
			new OpponentHandOverlayHandler(this.ow),
			new SecretsHelperOverlayHandler(this.ow),
		];
	}

	private buildEventParsers(): readonly EventParser[] {
		return [
			new GameStartParser(this.deckParser, this.prefs, this.allCards),
			new MatchMetadataParser(),
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
			new CardStolenParser(this.helper),
			new CardCreatorChangedParser(this.helper),
			new AssignCardIdParser(this.helper),
			new HeroPowerChangedParser(this.helper, this.allCards),
			new DeckstringOverrideParser(this.deckParser, this.allCards),
			new LocalPlayerParser(this.allCards),
			new OpponentPlayerParser(this.aiDecks, this.deckParser, this.helper, this.allCards, this.prefs),
			new DecklistUpdateParser(this.aiDecks, this.deckParser, this.prefs),
			new CardOnBoardAtGameStart(this.helper),
			new GameRunningParser(this.deckParser),
			new SecretTriggeredParser(this.helper),
			new QuestCreatedInGameParser(this.helper, this.allCards),
			new QuestDestroyedParser(),
			new QuestPlayedFromDeckParser(this.helper),
			new QuestPlayedFromHandParser(this.helper),
			new MinionOnBoardAttackUpdatedParser(this.helper),
			new GalakrondInvokedParser(),
			new CardBuffedInHandParser(this.helper, this.allCards),
		];
	}
}
