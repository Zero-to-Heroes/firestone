import { EventEmitter, Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { BehaviorSubject } from 'rxjs';
import { BattlegroundsState } from '../../models/battlegrounds/battlegrounds-state';
import { GameEvent } from '../../models/game-event';
import { GameEventsEmitterService } from '../game-events-emitter.service';
import { OverwolfService } from '../overwolf.service';
import { ProcessingQueue } from '../processing-queue.service';
import { BattlegroundsHidePlayerInfoParser } from './events-parser/battlegrounds-hide-player-info-processor';
import { BattlegroundsLeaderboardPlaceParser } from './events-parser/battlegrounds-leaderboard-place-parser';
import { BattlegroundsPlayerBoardParser } from './events-parser/battlegrounds-player-board-parser';
import { BattlegroundsPlayerTavernUpgradeParser } from './events-parser/battlegrounds-player-tavern-upgrade-parser';
import { BattlegroundsShowPlayerInfoParser } from './events-parser/battlegrounds-show-player-info-processor';
import { EventParser } from './events-parser/event-parser';
import { GameEndParser } from './events-parser/game-end-parser';
import { GameStartParser } from './events-parser/game-start-parser';
import { BattlegroundsEvent } from './events/battlegrounds-event';

@Injectable()
export class BattlegroundsStateService {
	public state: BattlegroundsState = new BattlegroundsState();
	private eventParsers: readonly EventParser[];

	private battlegroundsUpdater: EventEmitter<GameEvent | BattlegroundsEvent> = new EventEmitter<
		GameEvent | BattlegroundsEvent
	>();

	private processingQueue = new ProcessingQueue<GameEvent | BattlegroundsEvent>(
		eventQueue => this.processQueue(eventQueue),
		300,
		'battlegrounds-state',
	);

	// We need to get through a queue to avoid race conditions when two events are close together,
	// so that we're sure teh state is update sequentially
	// private eventQueue: Queue<GameEvent> = new Queue<GameEvent>();
	private battlegroundsEventBus = new BehaviorSubject<any>(null);
	private eventEmitters = [];

	constructor(private gameEvents: GameEventsEmitterService, private logger: NGXLogger, private ow: OverwolfService) {
		if (!this.ow) {
			console.warn('[game-state] Could not find OW service');
			return;
		}
		this.battlegroundsUpdater.subscribe((event: GameEvent | BattlegroundsEvent) => {
			this.logger.debug('[battlegrounds-state] enqueueing', event);
			this.processingQueue.enqueue(event);
		});
		this.eventParsers = this.buildEventParsers();
		this.registerGameEvents();
		this.buildEventEmitters();
		window['battlegroundsEventBus'] = this.battlegroundsEventBus;
		window['battlegroundsUpdater'] = this.battlegroundsUpdater;
		// window['deckDebug'] = this;
		window['logBattlegroundsState'] = () => {
			this.logger.debug(JSON.stringify(this.state));
		};
		this.loadBattlegroundsWindow();
	}

	private registerGameEvents() {
		this.gameEvents.allEvents.subscribe((gameEvent: GameEvent) => {
			this.processingQueue.enqueue(gameEvent);
		});
		// Reset the states just in case
		this.processingQueue.enqueue(Object.assign(new GameEvent(), { type: GameEvent.GAME_END } as GameEvent));
	}

	private async processQueue(eventQueue: readonly (GameEvent | BattlegroundsEvent)[]) {
		const gameEvent = eventQueue[0];
		await this.processEvent(gameEvent);
		return eventQueue.slice(1);
	}

	private async processEvent(gameEvent: GameEvent | BattlegroundsEvent) {
		// if (!this.state) {
		// 	this.logger.error('[battlegrounds-state] null state before processing event', gameEvent, this.state);
		// 	return;
		// }
		// this.logger.debug('[battlegrounds-state] trying to process', gameEvent);
		for (const parser of this.eventParsers) {
			try {
				// console.log('trying to apply parser', parser);
				if (parser.applies(gameEvent)) {
					// this.logger.debug('[battlegrounds-state] processing', gameEvent);
					// We want to keep the null state as a valid return option to signal that
					// nothing should be displayed
					const oldState = this.state;
					this.state = await parser.parse(this.state || BattlegroundsState.create(), gameEvent);
					await this.updateOverlays(oldState, this.state);
					const emittedEvent = {
						name: parser.event(),
						state: this.state,
					};
					this.logger.debug('[battlegrounds-state] Emitting new event', emittedEvent);
					this.eventEmitters.forEach(emitter => emitter(emittedEvent));
				}
			} catch (e) {
				this.logger.error('Exception while applying parser', e);
			}
		}
	}

	private async updateOverlays(oldState: BattlegroundsState, newState: BattlegroundsState) {
		const [leaderboardWindow, playerInfoWindow] = await Promise.all([
			this.ow.obtainDeclaredWindow(OverwolfService.BATTLEGROUNDS_LEADERBOARD_OVERLAY_WINDOW),
			this.ow.obtainDeclaredWindow(OverwolfService.BATTLEGROUNDS_PLAYER_INFO_WINDOW),
		]);
		if (newState && !leaderboardWindow.isVisible) {
			await this.ow.restoreWindow(OverwolfService.BATTLEGROUNDS_LEADERBOARD_OVERLAY_WINDOW);
		} else if (!newState) {
			await this.ow.closeWindow(OverwolfService.BATTLEGROUNDS_LEADERBOARD_OVERLAY_WINDOW);
		}
		if (newState && !playerInfoWindow.isVisible) {
			await this.ow.restoreWindow(OverwolfService.BATTLEGROUNDS_PLAYER_INFO_WINDOW);
		} else if (!newState) {
			await this.ow.closeWindow(OverwolfService.BATTLEGROUNDS_PLAYER_INFO_WINDOW);
		}
	}

	private async buildEventEmitters() {
		const result = [event => this.battlegroundsEventBus.next(event)];
		this.eventEmitters = result;
	}

	private buildEventParsers(): readonly EventParser[] {
		return [
			new GameStartParser(),
			new GameEndParser(),
			new BattlegroundsPlayerBoardParser(),
			new BattlegroundsLeaderboardPlaceParser(),
			new BattlegroundsPlayerTavernUpgradeParser(),
			new BattlegroundsHidePlayerInfoParser(),
			new BattlegroundsShowPlayerInfoParser(),
		];
	}

	private async loadBattlegroundsWindow() {
		// const window = await this.ow.obtainDeclaredWindow(OverwolfService.BATTLEGROUNDS_WINDOW);
		// const windowId = window.id;
		// await this.ow.restoreWindow(windowId);
		// await this.ow.hideWindow(windowId);
	}
}
