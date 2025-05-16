import { Injectable } from '@angular/core';
import { SceneMode } from '@firestone-hs/reference-data';
import { RealTimeStatsState } from '@firestone/battlegrounds/core';
import { SceneService } from '@firestone/memory';
import { filter, take } from 'rxjs';
import { GameEvent } from '../../../../models/game-event';
import { Events } from '../../../events.service';
import { GameEventsEmitterService } from '../../../game-events-emitter.service';
import { ProcessingQueue } from '../../../processing-queue.service';
import { EventParser } from './event-parsers/_event-parser';
import { RealTimeStatsParsersService } from './real-time-stats-parsers.service';

// TODO: move this into a mode-independant package, as it could be used for non-bg stuff
@Injectable()
export class RealTimeStatsService {
	private state: RealTimeStatsState = new RealTimeStatsState();
	private processingQueue = new ProcessingQueue<GameEvent>(
		(eventQueue) => this.processQueue(eventQueue),
		50,
		'bgs-real-time-stats-queue',
	);
	private eventParsers: { [eventKey: string]: readonly EventParser[] };
	private supportedEventTypes: readonly string[];
	private listeners: ((state: RealTimeStatsState) => void)[] = [];

	constructor(
		private readonly gameEvents: GameEventsEmitterService,
		private readonly events: Events,
		private readonly scene: SceneService,
		private readonly parsers: RealTimeStatsParsersService,
	) {
		// Not sure how we can improve this
		// If I wait until I know we're in a BG game, then I miss the first few events
		this.initListeners();
	}

	public addListener(listener: (state: RealTimeStatsState) => void): void {
		if (!this.listeners.includes(listener)) {
			this.listeners.push(listener);
		}
	}

	private async initListeners() {
		await this.scene.isReady();

		this.scene.currentScene$$
			.pipe(
				filter((scene) => scene === SceneMode.BACON),
				take(1),
			)
			.subscribe(() => this.init());
	}

	private init() {
		console.log('[real-time-stats] init');
		this.eventParsers = this.parsers.buildEventParsers();
		this.supportedEventTypes = Object.keys(this.eventParsers);
		this.gameEvents.allEvents.subscribe(async (gameEvent: GameEvent) => {
			this.processingQueue.enqueue(gameEvent);
		});
		this.events.on(Events.BATTLE_SIMULATION_HISTORY_UPDATED).subscribe((data) => {
			this.processingQueue.enqueue(
				Object.assign(new GameEvent(), {
					type: Events.BATTLE_SIMULATION_HISTORY_UPDATED,
					additionalData: {
						game: data.data[0],
					},
				}),
			);
		});
	}

	private async processQueue(eventQueue: readonly GameEvent[]) {
		const supportedEvents = eventQueue.filter((event) => this.supportedEventTypes.includes(event.type));

		let currentState = this.state;
		for (let i = 0; i < supportedEvents.length; i++) {
			currentState = await this.processEvent(currentState, supportedEvents[i]);
		}

		if (currentState && currentState !== this.state) {
			this.state = currentState;
			this.listeners.forEach((listener) => listener(this.state));
		}

		return [];
	}

	private async processEvent(currentState: RealTimeStatsState, gameEvent: GameEvent) {
		let newState = currentState;
		const parsersForEvent = this.eventParsers[gameEvent.type] ?? [];
		for (const parser of parsersForEvent) {
			try {
				if (parser.applies(gameEvent, newState)) {
					newState = await parser.parse(gameEvent, newState);
					newState = newState ?? currentState;
				}
			} catch (e) {
				console.error('[game-state] Exception while applying parser', parser.name(), e.message, e.stack, e);
			}
		}
		return newState;
	}
}
