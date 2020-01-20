import { EventEmitter, Injectable } from '@angular/core';
import { GameType } from '@firestone-hs/reference-data';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { NGXLogger } from 'ngx-logger';
import { BehaviorSubject } from 'rxjs';
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
import { GameEndParser } from './event-parser/game-end-parser';
import { GameStartParser } from './event-parser/game-start-parser';
import { HeroPowerChangedParser } from './event-parser/hero-power-changed-parser';
import { LocalPlayerParser } from './event-parser/local-player-parser';
import { MainStepReadyParser } from './event-parser/main-step-ready-parser';
import { MatchMetadataParser } from './event-parser/match-metadata-parser';
import { MinionBackOnBoardParser } from './event-parser/minion-back-on-board-parser';
import { MinionDiedParser } from './event-parser/minion-died-parser';
import { MinionSummonedParser } from './event-parser/minion-summoned-parser';
import { MulliganOverParser } from './event-parser/mulligan-over-parser';
import { NewTurnParser } from './event-parser/new-turn-parser';
import { OpponentPlayerParser } from './event-parser/opponent-player-parser';
import { ReceiveCardInHandParser } from './event-parser/receive-card-in-hand-parser';
import { SecretPlayedFromDeckParser } from './event-parser/secret-played-from-deck-parser';
import { SecretPlayedFromHandParser } from './event-parser/secret-played-from-hand-parser';
import { GameStateMetaInfoService } from './game-state-meta-info.service';
import { ZoneOrderingService } from './zone-ordering.service';
import { GameRunningParser } from './event-parser/game-running-parser';

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

	private currentReviewId: string;

	private showDecktracker: boolean;
	private showOpponentTracker: boolean;
	private showOpponentHand: boolean;

	private closedByUser: boolean;
	private opponentTrackerClosedByUser: boolean;
	private gameEnded: boolean;

	constructor(
		private gameEvents: GameEventsEmitterService,
		private events: Events,
		// private logger: NGXLogger,
		private dynamicZoneHelper: DynamicZoneHelperService,
		private gameStateMetaInfos: GameStateMetaInfoService,
		private zoneOrdering: ZoneOrderingService,
		private allCards: AllCardsService,
		private prefs: PreferencesService,
		private twitch: TwitchAuthService,
		private deckCardService: DeckCardService,
		private ow: OverwolfService,
		private logger: NGXLogger,
		private deckParser: DeckParserService,
		private helper: DeckManipulationHelper,
		private aiDecks: AiDeckService,
	) {
		this.eventParsers = this.buildEventParsers();
		this.registerGameEvents();
		this.buildEventEmitters();
		if (!this.ow) {
			console.warn('[game-state] Could not find OW service');
			return;
		}
		const preferencesEventBus: EventEmitter<any> = this.ow.getMainWindow().preferencesEventBus;
		preferencesEventBus.subscribe(async event => {
			if (event.name === PreferencesService.TWITCH_CONNECTION_STATUS) {
				this.logger.debug('rebuilding event emitters');
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
			this.logger.debug(JSON.stringify(this.state));
		};
		setTimeout(() => {
			const decktrackerDisplayEventBus: BehaviorSubject<boolean> = this.ow.getMainWindow()
				.decktrackerDisplayEventBus;
			decktrackerDisplayEventBus.subscribe(event => {
				this.showDecktracker = event;
				// this.logger.debug('decktracker display update', event);
				this.updateOverlays();
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
				this.updateOverlays();
			}
		});
	}

	public async getCurrentReviewId(): Promise<string> {
		return new Promise<string>(resolve => this.getCurrentReviewIdInternal(reviewId => resolve(reviewId)));
	}

	private async getCurrentReviewIdInternal(callback, retriesLeft = 15) {
		if (retriesLeft <= 0) {
			this.logger.error('[game-state] Could not get current review id');
			callback(null);
			return;
		}
		if (!this.currentReviewId) {
			setTimeout(() => this.getCurrentReviewIdInternal(callback, retriesLeft - 1), 2000);
			return;
		}
		// this.logger.log('[game-state] returning review id', this.currentReviewId);
		callback(this.currentReviewId);
	}

	private registerGameEvents() {
		this.gameEvents.onGameStart.subscribe(event => {
			this.logger.debug('[game-state] game start event received, resetting currentReviewId');
			this.currentReviewId = undefined;
		});
		this.gameEvents.allEvents.subscribe((gameEvent: GameEvent) => {
			this.processingQueue.enqueue(gameEvent);
		});
		this.events.on(Events.REVIEW_FINALIZED).subscribe(async event => {
			this.logger.debug('[game-state] Received review finalized event, doing nothing');
		});
		this.events.on(Events.REVIEW_INITIALIZED).subscribe(async event => {
			this.logger.debug('[game-state] Received new review id event');
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
		// TODO: process several events if the queue is long, as otherwise it can cause a big lag
		// (eg shudderwok)
		await this.processEvent(gameEvent);
		return eventQueue.slice(1);
	}

	private async processEvent(gameEvent: GameEvent) {
		// if (!this.state) {
		// 	this.logger.error('null state before processing event', gameEvent, this.state);
		// 	return;
		// }
		this.logger.debug('[game-state] ready to process event', gameEvent.type, gameEvent, this.state);
		if (gameEvent.type === 'CLOSE_TRACKER') {
			this.closedByUser = true;
			this.updateOverlays();
		} else if (gameEvent.type === 'CLOSE_OPPONENT_TRACKER') {
			this.opponentTrackerClosedByUser = true;
			this.updateOverlays();
		} else if (gameEvent.type === GameEvent.GAME_START) {
			this.closedByUser = false;
			this.opponentTrackerClosedByUser = false;
			this.gameEnded = false;
			this.updateOverlays();
		} else if (gameEvent.type === GameEvent.GAME_END) {
			this.gameEnded = true;
			this.updateOverlays();
		}
		for (const parser of this.eventParsers) {
			try {
				if (parser.applies(gameEvent, this.state, await this.prefs.getPreferences())) {
					// this.logger.debug(
					// 	'[game-state] will apply parser',
					// 	parser.event(),
					// 	gameEvent.cardId,
					// 	gameEvent.entityId,
					// );
					const stateAfterParser = await parser.parse(this.state, gameEvent);
					// this.logger.debug('[game-state] applied parser', stateAfterParser);
					// if (!stateAfterParser) {
					// 	this.logger.error('null state after processing event', gameEvent.type, parser, gameEvent);
					// 	await this.updateOverlays();
					// 	continue;
					// }
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
						// this.logger.debug('[game-state] opponentDeckWithZonesOrdered', opponentDeckWithZonesOrdered);
						this.state = Object.assign(new GameState(), stateAfterParser, {
							playerDeck: updatedPlayerDeck,
							opponentDeck: udpatedOpponentDeck,
						} as GameState);
						// this.logger.debug('[game-state] this.state', this.state);
					} else {
						this.state = null;
					}
					await this.updateOverlays();
					// this.logger.debug('[game-state] updateOverlays');
					// if (!this.state) {
					// 	this.logger.error('null state after processing event', gameEvent, this.state);
					// 	continue;
					// }
					const emittedEvent = {
						event: {
							name: parser.event(),
						},
						state: this.state,
					};
					this.logger.debug('[game-state] will emit event', emittedEvent);
					this.eventEmitters.forEach(emitter => emitter(emittedEvent));
					// this.logger.debug('[game-state] emitted deck event', emittedEvent.event.name, this.state);
					// this.logger.debug(
					// 	'board states',
					// 	this.state.playerDeck.board.length,
					// 	this.state.opponentDeck.board.length,
					// 	this.state.playerDeck.board,
					// 	this.state.opponentDeck.board,
					// );
					// this.logger.debug(
					// 	'hand states',
					// 	this.state.playerDeck.hand.length,
					// 	this.state.opponentDeck.hand.length,
					// 	this.state.playerDeck.hand,
					// 	this.state.opponentDeck.hand,
					// );
				}
			} catch (e) {
				this.logger.error('[game-state] Exception while applying parser', parser.event(), e);
			}
		}
	}

	private updateDeck(deck: DeckState, gameState: GameState, playerFromTracker): DeckState {
		// this.logger.debug('[game-state] updating deck', deck, gameState, playerFromTracker);
		const stateWithMetaInfos = this.gameStateMetaInfos.updateDeck(deck, gameState.currentTurn);
		// this.logger.debug('[game-state] stateWithMetaInfos', stateWithMetaInfos);
		// Add missing info like card names, if the card added doesn't come from a deck state
		// (like with the Chess brawl)
		const newState = this.deckCardService.fillMissingCardInfoInDeck(stateWithMetaInfos);
		// this.logger.debug('[game-state] newState', newState);
		const playerDeckWithDynamicZones = this.dynamicZoneHelper.fillDynamicZones(newState);
		// this.logger.debug('[game-state] playerDeckWithDynamicZones', playerDeckWithDynamicZones);
		const playerDeckWithZonesOrdered = this.zoneOrdering.orderZones(playerDeckWithDynamicZones, playerFromTracker);
		// this.logger.debug('[game-state] playerDeckWithZonesOrdered', playerDeckWithZonesOrdered);
		return playerDeckWithZonesOrdered;
	}

	private async updateOverlays() {
		if (!this.ow) {
			console.log('ow not defined, returning');
			return;
		}
		const [decktrackerWindow, opponentTrackerWindow, opponentHandWindow] = await Promise.all([
			this.ow.getWindowState(OverwolfService.DECKTRACKER_WINDOW),
			this.ow.getWindowState(OverwolfService.DECKTRACKER_OPPONENT_WINDOW),
			this.ow.getWindowState(OverwolfService.MATCH_OVERLAY_OPPONENT_HAND_WINDOW),
		]);
		// this.logger.debug('[game-state] retrieved windows', decktrackerWindow, opponentHandWindow);
		const shouldShowTracker =
			this.state &&
			this.state.playerDeck &&
			((this.state.playerDeck.deck && this.state.playerDeck.deck.length > 0) ||
				(this.state.playerDeck.hand && this.state.playerDeck.hand.length > 0) ||
				(this.state.playerDeck.board && this.state.playerDeck.board.length > 0) ||
				(this.state.playerDeck.otherZone && this.state.playerDeck.otherZone.length > 0));
		// console.log('[game-state] should show tracker?', shouldShowTracker, this.showDecktracker, this.state);
		if (
			shouldShowTracker &&
			decktrackerWindow.window_state_ex === 'closed' &&
			this.showDecktracker &&
			!this.closedByUser
		) {
			// console.log('[game-state] showing tracker');
			await this.ow.obtainDeclaredWindow(OverwolfService.DECKTRACKER_WINDOW);
			await this.ow.restoreWindow(OverwolfService.DECKTRACKER_WINDOW);
		} else if (
			decktrackerWindow.window_state_ex !== 'closed' &&
			(!shouldShowTracker || !this.showDecktracker || this.closedByUser)
		) {
			// console.log('[game-state] closing tracker');
			await this.ow.closeWindow(OverwolfService.DECKTRACKER_WINDOW);
		}
		// console.log('[game-state] tracker window handled');

		const shouldShowOpponentTracker =
			this.state &&
			this.state.opponentDeck &&
			((this.state.opponentDeck.deck && this.state.opponentDeck.deck.length > 0) ||
				(this.state.opponentDeck.hand && this.state.opponentDeck.hand.length > 0) ||
				(this.state.opponentDeck.board && this.state.opponentDeck.board.length > 0) ||
				(this.state.opponentDeck.otherZone && this.state.opponentDeck.otherZone.length > 0));
		// console.log('[game-state] should show tracker?', shouldShowOpponentTracker, this.showDecktracker, this.state);
		if (
			shouldShowOpponentTracker &&
			opponentTrackerWindow.window_state_ex === 'closed' &&
			this.showOpponentTracker &&
			!this.opponentTrackerClosedByUser
		) {
			// console.log('[game-state] showing tracker');
			await this.ow.obtainDeclaredWindow(OverwolfService.DECKTRACKER_OPPONENT_WINDOW);
			await this.ow.restoreWindow(OverwolfService.DECKTRACKER_OPPONENT_WINDOW);
		} else if (
			opponentTrackerWindow.window_state_ex !== 'closed' &&
			(!shouldShowOpponentTracker || !this.showOpponentTracker || this.opponentTrackerClosedByUser)
		) {
			// console.log('[game-state] closing tracker');
			await this.ow.closeWindow(OverwolfService.DECKTRACKER_OPPONENT_WINDOW);
		}

		// console.log('[game-state] showing opp hand?', this.showOpponentHand);
		if (
			this.state &&
			this.state.gameStarted &&
			this.state.metadata &&
			this.state.metadata.gameType !== GameType.GT_BATTLEGROUNDS &&
			!this.gameEnded &&
			opponentHandWindow.window_state_ex === 'closed' &&
			this.showOpponentHand
		) {
			await this.ow.obtainDeclaredWindow(OverwolfService.MATCH_OVERLAY_OPPONENT_HAND_WINDOW);
			await this.ow.restoreWindow(OverwolfService.MATCH_OVERLAY_OPPONENT_HAND_WINDOW);
		} else if (
			opponentHandWindow.window_state_ex !== 'closed' &&
			(this.gameEnded ||
				!this.state ||
				!this.state.gameStarted ||
				!this.showOpponentHand ||
				(this.state.metadata && this.state.metadata.gameType === GameType.GT_BATTLEGROUNDS))
		) {
			await this.ow.closeWindow(OverwolfService.MATCH_OVERLAY_OPPONENT_HAND_WINDOW);
		}
		// console.log('[game-state] opponentDeck window handled');
	}

	private async handleDisplayPreferences(preferences: Preferences = null) {
		preferences = preferences || (await this.prefs.getPreferences());
		this.showOpponentHand = preferences.dectrackerShowOpponentGuess || preferences.dectrackerShowOpponentTurnDraw;
		this.showOpponentTracker = preferences.opponentTracker;
		// console.log('update opp hand prefs', this.showOpponentHand, preferences);
		this.updateOverlays();
	}

	private async buildEventEmitters() {
		const result = [event => this.deckEventBus.next(event)];
		const prefs = await this.prefs.getPreferences();
		this.logger.debug('is logged in to Twitch?', prefs.twitchAccessToken);
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
			new CardPlayedFromHandParser(this.helper, this.allCards),
			new SecretPlayedFromHandParser(this.helper),
			new EndOfEchoInHandParser(this.helper),
			new GameEndParser(),
			new DiscardedCardParser(this.helper),
			new CardRecruitedParser(this.helper),
			new MinionBackOnBoardParser(this.helper),
			new MinionSummonedParser(this.helper, this.allCards),
			new CardRevealedParser(this.helper, this.allCards),
			new MinionDiedParser(this.helper),
			new BurnedCardParser(this.helper),
			new SecretPlayedFromDeckParser(this.helper),
			new NewTurnParser(),
			new FirstPlayerParser(),
			new CardStolenParser(this.helper),
			new CardCreatorChangedParser(this.helper),
			new AssignCardIdParser(this.helper),
			new HeroPowerChangedParser(this.helper, this.allCards),
			new DeckstringOverrideParser(this.deckParser, this.allCards),
			new LocalPlayerParser(),
			new OpponentPlayerParser(this.aiDecks, this.deckParser, this.helper, this.allCards, this.prefs),
			new DecklistUpdateParser(this.aiDecks, this.deckParser, this.prefs),
			new CardOnBoardAtGameStart(this.helper),
			new GameRunningParser(this.deckParser),
		];
	}
}
