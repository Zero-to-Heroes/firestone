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

declare var overwolf: any;

@Injectable()
export class GameStateService {

	private state: GameState;
	private eventParsers: ReadonlyArray<EventParser>;
	// We need to get through a queue to avoid race conditions when two events are close together, 
	// so that we're sure teh state is update sequentially
	private eventQueue: Queue<GameEvent> = new Queue<GameEvent>();
	private deckEventBus = new EventEmitter<any>();

	constructor(
			private gameEvents: GameEvents, 
			private allCards: AllCardsService,
			private deckParser: DeckParserService) {
		this.eventParsers = this.buildEventParsers();
		this.registerGameEvents();
		window['deckEventBus'] = this.deckEventBus;
		this.loadDecktrackerWindow();
	}

	private registerGameEvents() {
		setInterval(() => {
			let gameEvent: GameEvent;
			while (gameEvent = this.eventQueue.dequeue()) {
				this.processEvent(gameEvent);
			}
		}, 100);
		this.gameEvents.allEvents.subscribe((gameEvent: GameEvent) => {
			this.eventQueue.enqueue(gameEvent);
		});
	}

	private processEvent(gameEvent: GameEvent) {
		for (let parser of this.eventParsers) {
			if (parser.applies(gameEvent)) {
				console.log('[game-state] applying parser', parser);
				this.state = parser.parse(this.state, gameEvent);
				console.log('[game-state] new state computed, sending event to eventBus')
				this.deckEventBus.next({ 
					state: this.state, 
					event: {
						name: parser.event() 
					}
				});
				console.log('[game-state] sent new state to event bus', this.state);
			}
		}
	}

	private buildEventParsers(): ReadonlyArray<EventParser> {
		return [
			new GameStartParser(this.deckParser, this.allCards),
			new MulliganOverParser(this.deckParser, this.allCards),
			new CardDrawParser(this.deckParser, this.allCards),
			new CardBackToDeckParser(this.deckParser, this.allCards),
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
				// console.log('notifications window is on?', result);
				overwolf.windows.hide(windowId, (result) => {
				})
			})
		});
	}
}
