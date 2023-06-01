import { Injectable } from '@angular/core';
import { OverwolfService } from '@firestone/shared/framework/core';
import { Events } from '../services/events.service';
import { CardsMonitorService } from './collection/cards-monitor.service';
import { GameEvents } from './game-events.service';
import { GameStatusService } from './game-status.service';
import { LogListenerService } from './log-listener.service';
import { PreferencesService } from './preferences.service';

@Injectable()
export class LogRegisterService {
	monitoring: boolean;
	fileInitiallyPresent: boolean;
	logsLocation: string;

	retriesLeft = 20;

	constructor(
		private readonly events: Events,
		private readonly cardsMonitor: CardsMonitorService,
		private readonly ow: OverwolfService,
		private readonly gameEvents: GameEvents,
		private readonly gameStatus: GameStatusService,
		private readonly prefs: PreferencesService,
	) {
		// Only init the log listener once the store has been initialized. This aims at preventing
		// the app from starting to parse the game logs while in an uninitialized state, which in
		// turn can lead to some weird behavior (previous match still updating while the current match
		// is being played, and some events being delayed because not all the states have been initialized)
		// this.init();
		this.events.on(Events.STORE_READY).subscribe(() => this.init());
	}

	private init(): void {
		console.log('[log-register] initiating log registerservice');

		new LogListenerService(this.ow, this.gameStatus, this.prefs)
			.configure(
				'Net.log',
				(data) => this.cardsMonitor.receiveLogLine(data),
				// Typically, the end-of-season rewards are logged as soon as the game fully
				// boots, which is before the app finishes loading. So they are always "existing
				// lines", which means we never do any processing
				// Since the cardsMonitor processing is just about triggering a memory change,
				// there should be no ill side-effect if it ever is triggered
				// too often
				(existingLine) => this.cardsMonitor.receiveLogLine(existingLine),
			)
			.subscribe((status) => {
				console.log('[log-register] status for Net.log', status);
				this.events.broadcast(status, 'Net.log');
			})
			.start();
		new LogListenerService(this.ow, this.gameStatus, this.prefs)
			.configure(
				'Power.log',
				(data) => this.gameEvents.receiveLogLine(data),
				(existingLine) => this.gameEvents.receiveExistingLogLine(existingLine),
			)
			.subscribe((status) => {
				console.log('[log-register] status for Power.log', status);
				// this.events.broadcast(status, "Power.log");
			})
			.start();
	}
}
