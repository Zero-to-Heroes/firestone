import { Injectable, EventEmitter } from '@angular/core';
import { Queue } from 'queue-typescript';
import { GameEvents } from '../game-events.service';
import { GameEvent } from '../../models/game-event';
import { GameState } from '../../models/decktracker/game-state';
import { DeckParserService } from './deck-parser.service';
import { AllCardsService } from '../all-cards.service';
import { EventParser } from './event-parser/event-parser';
import { GameStartParser } from './event-parser/game-start-parser';
import { CardDrawParser } from './event-parser/card-draw-parser';
import { MulliganOverParser } from './event-parser/mulligan-over-parser';
import { CardBackToDeckParser } from './event-parser/card-back-to-deck-parser';
import { GameEndParser } from './event-parser/game-end-parser';
import { FeatureFlags } from '../feature-flags.service';
import { CardPlayedFromHandParser } from './event-parser/card-played-from-hand-parser';

declare var overwolf: any;

@Injectable()
export class GameStateService {

	public state: GameState;
	private eventParsers: ReadonlyArray<EventParser>;
	// We need to get through a queue to avoid race conditions when two events are close together, 
	// so that we're sure teh state is update sequentially
	private eventQueue: Queue<GameEvent> = new Queue<GameEvent>();
	private deckEventBus = new EventEmitter<any>();

	constructor(
			private gameEvents: GameEvents, 
			private allCards: AllCardsService,
			private flags: FeatureFlags,
			private deckParser: DeckParserService) {
		if (!flags.decktracker()) {
			return;
		}
		this.registerGameEvents();
		this.eventParsers = this.buildEventParsers();
		window['deckEventBus'] = this.deckEventBus;
		window['deckDebug'] = this;
		this.loadDecktrackerWindow();
	}

	private registerGameEvents() {
		this.gameEvents.allEvents.subscribe((gameEvent: GameEvent) => {
			this.eventQueue.enqueue(gameEvent);
		});
		setInterval(() => {
			if (!this.deckParser.currentDeck) {
				return;
			}
			let gameEvent: GameEvent;
			while (gameEvent = this.eventQueue.dequeue()) {
				this.processEvent(gameEvent);
			}
		}, 100);
	}

	private processEvent(gameEvent: GameEvent) {
		console.log('[game-state] Processing event', gameEvent);
		for (let parser of this.eventParsers) {
			if (parser.applies(gameEvent)) {
				this.state = parser.parse(this.state, gameEvent);
				this.deckEventBus.next({ 
					state: this.state, 
					event: {
						name: parser.event() 
					}
				});
			}
		}
	}

	private buildEventParsers(): ReadonlyArray<EventParser> {
		return [
			new GameStartParser(this.deckParser, this.allCards),
			new MulliganOverParser(this.deckParser, this.allCards),
			new CardDrawParser(this.deckParser, this.allCards),
			new CardBackToDeckParser(this.deckParser, this.allCards),
			new CardPlayedFromHandParser(this.deckParser, this.allCards),
			new GameEndParser(this.deckParser, this.allCards),
		];
	}

	private loadDecktrackerWindow() {
		overwolf.windows.obtainDeclaredWindow("DeckTrackerWindow", (result) => {
			if (result.status !== 'success') {
				console.warn('Could not get DeckTrackerWindow', result);
			}
			// console.log('got notifications window', result);
			let windowId = result.window.id;

			overwolf.windows.restore(windowId, (result) => {
				console.log('DeckTrackerWindow is on?', result);
				overwolf.windows.hide(windowId, (result) => {
					console.log('DeckTrackerWindow hidden', result);
				})
			})
		});
	}
}
