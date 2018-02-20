import { Injectable } from '@angular/core';

import * as Raven from 'raven-js';

import { SimpleIOService } from './plugins/simple-io.service'
import { LogParserService } from './collection/log-parser.service'
import { GameEvents } from './game-events.service'
import { LogListenerService } from './log-listener.service'
import { Events } from '../services/events.service';

declare var OverwolfPlugin: any;
declare var overwolf: any;

const HEARTHSTONE_GAME_ID = 9898;
const LOG_FILE_NAME = "Achievements.log";
const prod = true;

@Injectable()
export class LogRegisterService {

	monitoring: boolean;
	fileInitiallyPresent: boolean;
	logsLocation: string;

	retriesLeft = 20;

	constructor(
		private events: Events,
		private collectionLogParserService: LogParserService,
		private gameEvents: GameEvents,
		private plugin: SimpleIOService) {
		this.init();
	}

	init(): void {
		console.log('[log-register] initiating log registerservice');
		new LogListenerService(this.plugin)
			.configure("Achievements.log", (data) => this.collectionLogParserService.receiveLogLine(data))
			.subscribe((status) => {
				console.log('[log-register] status for achievements', status);
				this.events.broadcast(status, "Achiements.log");
			})
			.start();

		new LogListenerService(this.plugin)
			.configure("Power.log", (data) => this.gameEvents.receiveLogLine(data))
			.subscribe((status) => {
				console.log('[log-register] status for power.log', status);
				this.events.broadcast(status, "Power.log");
			})
			.start();
	}
}
