import { Injectable } from '@angular/core';
import { GameEvents } from '../game-events.service';
import { GameEvent } from '../../models/game-event';
import { GameState } from '../../models/decktracker/game-state';
import { DeckParserService } from './deck-parser.service';
import { DeckCard } from '../../models/decktracker/deck-card';
import { AllCardsService } from '../all-cards.service';
import { EventParser } from './event-parser/event-parser';
import { GameStartParser } from './event-parser/game-start-parser';
import { CardDrawParser } from './event-parser/card-draw-parser';

@Injectable()
export class GameStateService {

	private state: GameState;
	private eventParsers: ReadonlyArray<EventParser>;

	constructor(
			private gameEvents: GameEvents, 
			private allCards: AllCardsService,
			private deckParser: DeckParserService) {
		this.eventParsers = this.buildEventParsers();
		this.registerGameEvents();
	}

	private registerGameEvents() {
		this.gameEvents.allEvents.subscribe((gameEvent: GameEvent) => {
			for (let parser of this.eventParsers) {
				if (parser.applies(gameEvent)) {
					console.log('[game-state] applying parser', parser);
					this.state = parser.parse(this.state, gameEvent);
					console.log('[game-state] new game state is', this.state, parser);
				}
			}
		})
	}

	buildEventParsers(): ReadonlyArray<EventParser> {
		return [
			new GameStartParser(this.deckParser, this.allCards),
			new CardDrawParser(this.deckParser, this.allCards),
		];
	}
}
