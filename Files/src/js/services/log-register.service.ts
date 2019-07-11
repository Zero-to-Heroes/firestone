import { Injectable } from '@angular/core';

import { SimpleIOService } from './plugins/simple-io.service'
import { LogParserService } from './collection/log-parser.service'
import { GameEvents } from './game-events.service'
import { LogListenerService } from './log-listener.service'
import { Events } from '../services/events.service';
import { DeckParserService } from './decktracker/deck-parser.service';
import { OverwolfService } from './overwolf.service';

@Injectable()
export class LogRegisterService {

	monitoring: boolean;
	fileInitiallyPresent: boolean;
	logsLocation: string;

	retriesLeft = 20;

	constructor(
		private events: Events,
		private decksService: DeckParserService,
        private collectionLogParserService: LogParserService,
        private ow: OverwolfService,
		private gameEvents: GameEvents,
		private plugin: SimpleIOService) {
		this.init();
	}

	init(): void {
		console.log('[log-register] initiating log registerservice');
		new LogListenerService(this.plugin, this.ow)
			.configure("Achievements.log", (data) => this.collectionLogParserService.receiveLogLine(data))
			.subscribe((status) => {
				console.log('[log-register] status for achievements', status);
				this.events.broadcast(status, "Achiements.log");
			})
			.start();
		new LogListenerService(this.plugin, this.ow)
			.configure("Power.log", (data) => this.gameEvents.receiveLogLine(data))
			.subscribe((status) => {
				console.log('[log-register] status for power.log', status);
				// this.events.broadcast(status, "Power.log");
			})
			.start();
		new LogListenerService(this.plugin, this.ow)
			.configure("Decks.log", (data) => this.decksService.parseActiveDeck(data))
			.subscribe((status) => {
				console.log('[log-register] status for decks', status);
			})
			.start();
	}
}
