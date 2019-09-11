import { EventEmitter, Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { GameState } from '../../models/decktracker/game-state';
import { GameEvent } from '../../models/game-event';
import { AllCardsService } from '../all-cards.service';
import { GameEvents } from '../game-events.service';
import { TwitchAuthService } from '../mainwindow/twitch-auth.service';
import { OverwolfService } from '../overwolf.service';
import { PreferencesService } from '../preferences.service';
import { ProcessingQueue } from '../processing-queue.service';
import { DeckCardService } from './deck-card.service';
import { DeckParserService } from './deck-parser.service';
import { DynamicZoneHelperService } from './dynamic-zone-helper.service';
import { BurnedCardParser } from './event-parser/burned-card-parser';
import { CardBackToDeckParser } from './event-parser/card-back-to-deck-parser';
import { CardChangedOnBoardParser } from './event-parser/card-changed-on-board-parser';
import { CardDrawParser } from './event-parser/card-draw-parser';
import { CardPlayedFromHandParser } from './event-parser/card-played-from-hand-parser';
import { CardRecruitedParser } from './event-parser/card-recruited-parser';
import { CardRemovedFromDeckParser } from './event-parser/card-removed-from-deck-parser';
import { CardRemovedFromHandParser } from './event-parser/card-removed-from-hand-parser';
import { CreateCardInDeckParser } from './event-parser/create-card-in-deck-parser';
import { DiscardedCardParser } from './event-parser/discarded-card-parser';
import { EndOfEchoInHandParser } from './event-parser/end-of-echo-in-hand-parser';
import { EventParser } from './event-parser/event-parser';
import { FirstPlayerParser } from './event-parser/first-player-parser';
import { GameEndParser } from './event-parser/game-end-parser';
import { GameStartParser } from './event-parser/game-start-parser';
import { MainStepReadyParser } from './event-parser/main-step-ready-parser';
import { MatchMetadataParser } from './event-parser/match-metadata-parser';
import { MinionDiedParser } from './event-parser/minion-died-parser';
import { MinionSummonedParser } from './event-parser/minion-summoned-parser';
import { MulliganOverParser } from './event-parser/mulligan-over-parser';
import { NewTurnParser } from './event-parser/new-turn-parser';
import { ReceiveCardInHandParser } from './event-parser/receive-card-in-hand-parser';
import { SecretPlayedFromDeckParser } from './event-parser/secret-played-from-deck-parser';
import { SecretPlayedFromHandParser } from './event-parser/secret-played-from-hand-parser';
import { GameStateMetaInfoService } from './game-state-meta-info.service';
import { ZoneOrderingService } from './zone-ordering.service';

@Injectable()
export class GameStateService {
	public state: GameState = new GameState();
	private eventParsers: readonly EventParser[];

	private processingQueue = new ProcessingQueue<GameEvent>(eventQueue => this.processQueue(eventQueue), 100, 'game-state');

	// We need to get through a queue to avoid race conditions when two events are close together,
	// so that we're sure teh state is update sequentially
	// private eventQueue: Queue<GameEvent> = new Queue<GameEvent>();
	private deckEventBus = new EventEmitter<any>();
	private eventEmitters = [];

	constructor(
		private gameEvents: GameEvents,
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
	) {
		this.eventParsers = this.buildEventParsers();
		this.registerGameEvents();
		this.buildEventEmitters();
		const preferencesEventBus: EventEmitter<any> = this.ow.getMainWindow().preferencesEventBus;
		preferencesEventBus.subscribe(async event => {
			this.logger.debug('received pref', event);
			if (event.name === PreferencesService.TWITCH_CONNECTION_STATUS) {
				this.logger.debug('rebuilding event emitters');
				this.buildEventEmitters();
			}
		});
		window['deckEventBus'] = this.deckEventBus;
		window['deckDebug'] = this;
		window['logGameState'] = () => {
			this.logger.debug(JSON.stringify(this.state));
		};
		this.loadDecktrackerWindow();
		this.loadMatchOverlayWindows();
	}

	private registerGameEvents() {
		this.gameEvents.allEvents.subscribe((gameEvent: GameEvent) => {
			this.processingQueue.enqueue(gameEvent);
		});
		// setInterval(() => {
		// 	console.log('interval - gs events');
		// 	// if (!this.deckParser.currentDeck) {
		// 	// 	return;
		// 	// }
		// 	let gameEvent: GameEvent;
		// 	while ((gameEvent = this.eventQueue.dequeue())) {
		// 		this.processEvent(gameEvent);
		// 	}
		// }, 100);
		// Reset the deck if it exists
		this.processingQueue.enqueue(Object.assign(new GameEvent(), { type: GameEvent.GAME_END } as GameEvent));
	}

	private async processQueue(eventQueue: readonly GameEvent[]) {
		const gameEvent = eventQueue[0];
		this.processEvent(gameEvent);
		return eventQueue.slice(1);
	}

	private processEvent(gameEvent: GameEvent) {
		if (!this.state) {
			this.logger.error('null state before processing event', gameEvent, this.state);
			return;
		}
		for (const parser of this.eventParsers) {
			try {
				if (parser.applies(gameEvent)) {
					this.logger.debug('[game-state] will apply parser', parser.event());
					const stateAfterParser = parser.parse(this.state, gameEvent);
					if (!stateAfterParser) {
						this.logger.error('null state after processing event', gameEvent.type, parser, gameEvent);
						continue;
					}
					// Add information that is not linked to events, like the number of turns the
					// card has been present in the zone
					const stateWithMetaInfos = this.gameStateMetaInfos.addMetaInfos(stateAfterParser);
					// Add missing info like card names, if the card added doesn't come from a deck state
					// (like with the Chess brawl)
					const newState = this.deckCardService.fillMissingCardInfo(stateWithMetaInfos);
					const playerDeckWithDynamicZones = this.dynamicZoneHelper.fillDynamicZones(newState.playerDeck);
					const stateFromTracker = gameEvent.gameState || {};
					const playerDeckWithZonesOrdered = this.zoneOrdering.orderZones(playerDeckWithDynamicZones, stateFromTracker.Player);
					const opponentDeckWithZonesOrdered = this.zoneOrdering.orderZones(newState.opponentDeck, stateFromTracker.Opponent);
					this.state = Object.assign(new GameState(), newState, {
						playerDeck: playerDeckWithZonesOrdered,
						opponentDeck: opponentDeckWithZonesOrdered,
					} as GameState);
					if (!this.state) {
						this.logger.error('null state after processing event', gameEvent, this.state);
						continue;
					}
					const emittedEvent = {
						event: {
							name: parser.event(),
						},
						state: this.state,
					};
					this.eventEmitters.forEach(emitter => emitter(emittedEvent));
					// this.logger.debug('emitted deck event', emittedEvent.event.name);
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
				this.logger.error('Exception while applying parser', parser.event(), gameEvent, e, this.state);
			}
		}
	}

	private async buildEventEmitters() {
		const result = [event => this.deckEventBus.next(event)];
		const prefs = await this.prefs.getPreferences();
		this.logger.debug('is logged in to Twitch?', prefs.twitchAccessToken);
		if (prefs.twitchAccessToken) {
			result.push(event => this.twitch.emitDeckEvent(event));
		}
		this.eventEmitters = result;
		// this.logger.debug('emitting twitch event');
		// this.twitch.emitDeckEvent({ hop: "fakeEven" });
	}

	private buildEventParsers(): readonly EventParser[] {
		return [
			new GameStartParser(this.deckParser, this.allCards),
			new MatchMetadataParser(this.deckParser, this.allCards),
			new MulliganOverParser(this.deckParser, this.allCards),
			new MainStepReadyParser(this.deckParser, this.allCards),
			new CardDrawParser(this.deckParser, this.allCards),
			new ReceiveCardInHandParser(this.deckParser, this.allCards),
			new CardBackToDeckParser(this.deckParser, this.allCards),
			new CreateCardInDeckParser(this.deckParser, this.allCards),
			new CardRemovedFromDeckParser(this.deckParser, this.allCards),
			new CardRemovedFromHandParser(),
			new CardChangedOnBoardParser(this.allCards),
			new CardPlayedFromHandParser(this.deckParser, this.allCards),
			new SecretPlayedFromHandParser(this.deckParser, this.allCards),
			new EndOfEchoInHandParser(this.deckParser, this.allCards),
			new GameEndParser(this.deckParser, this.allCards),
			new DiscardedCardParser(),
			new CardRecruitedParser(),
			new MinionSummonedParser(this.allCards),
			new MinionDiedParser(this.allCards),
			new BurnedCardParser(),
			new SecretPlayedFromDeckParser(),
			new NewTurnParser(),
			new FirstPlayerParser(),
		];
	}

	private async loadDecktrackerWindow() {
		const window = await this.ow.obtainDeclaredWindow(OverwolfService.DECKTRACKER_WINDOW);
		const windowId = window.id;
		await this.ow.restoreWindow(windowId);
		await this.ow.hideWindow(windowId);
	}

	private async loadMatchOverlayWindows() {
		const window = await this.ow.obtainDeclaredWindow(OverwolfService.MATCH_OVERLAY_OPPONENT_HAND_WINDOW);
		const windowId = window.id;
		await this.ow.restoreWindow(windowId);
		await this.ow.hideWindow(windowId);
	}
}
