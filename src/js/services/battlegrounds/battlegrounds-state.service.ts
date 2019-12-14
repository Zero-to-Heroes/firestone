import { EventEmitter, Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { BehaviorSubject } from 'rxjs';
import { BattlegroundsState } from '../../models/battlegrounds/battlegrounds-state';
import { GameEvent } from '../../models/game-event';
import { Preferences } from '../../models/preferences';
import { AllCardsService } from '../all-cards.service';
import { GameEventsEmitterService } from '../game-events-emitter.service';
import { MainWindowStoreService } from '../mainwindow/store/main-window-store.service';
import { OverwolfService } from '../overwolf.service';
import { PreferencesService } from '../preferences.service';
import { ProcessingQueue } from '../processing-queue.service';
import { BattlegroundsHeroInfoService } from './battlegrounds-hero-info.service';
import { BattlegroundsHideHeroSelectionParser } from './events-parser/battlegrounds-hide-hero-selection-parser';
import { BattlegroundsHidePlayerInfoParser } from './events-parser/battlegrounds-hide-player-info-parser';
import { BattlegroundsLeaderboardPlaceParser } from './events-parser/battlegrounds-leaderboard-place-parser';
import { BattlegroundsPlayerBoardParser } from './events-parser/battlegrounds-player-board-parser';
import { BattlegroundsPlayerTavernUpgradeParser } from './events-parser/battlegrounds-player-tavern-upgrade-parser';
import { BattlegroundsShowHeroSelectionParser } from './events-parser/battlegrounds-show-hero-selection-parser';
import { BattlegroundsShowPlayerInfoParser } from './events-parser/battlegrounds-show-player-info-parser';
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

	private showHeroSelectionPref: boolean;
	private showLeaderboardPref: boolean;

	constructor(
		private gameEvents: GameEventsEmitterService,
		private mainStore: MainWindowStoreService,
		private logger: NGXLogger,
		private ow: OverwolfService,
		private readonly prefs: PreferencesService,
		private readonly infoService: BattlegroundsHeroInfoService,
		private readonly allCards: AllCardsService,
	) {
		if (!this.ow) {
			console.warn('[game-state] Could not find OW service');
			return;
		}
		this.battlegroundsUpdater.subscribe((event: GameEvent | BattlegroundsEvent) => {
			// this.logger.debug('[battlegrounds-state] enqueueing', event);
			this.processingQueue.enqueue(event);
		});
		this.eventParsers = this.buildEventParsers();
		this.registerGameEvents();
		this.buildEventEmitters();
		window['battlegroundsEventBus'] = this.battlegroundsEventBus;
		window['battlegroundsUpdater'] = this.battlegroundsUpdater;
		window['logBattlegroundsState'] = () => {
			this.logger.debug(JSON.stringify(this.state));
		};
		this.handleDisplayPreferences();
		setTimeout(() => {
			const preferencesEventBus: EventEmitter<any> = this.ow.getMainWindow().preferencesEventBus;
			preferencesEventBus.subscribe(event => {
				if (event && event.name === PreferencesService.DECKTRACKER_OVERLAY_DISPLAY) {
					this.handleDisplayPreferences(event.preferences);
				}
			});
		});
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
		// this.logger.debug('[battlegrounds-state] trying to process', gameEvent);
		for (const parser of this.eventParsers) {
			try {
				// console.log('trying to apply parser', parser);
				if (parser.applies(gameEvent, this.state)) {
					// this.logger.debug('[battlegrounds-state] processing', gameEvent);
					// We want to keep the null state as a valid return option to signal that
					// nothing should be displayed
					this.state = await parser.parse(this.state, gameEvent, this.mainStore.state);
					// this.logger.debug('[battlegrounds-state] udpated state', this.state);
					await this.updateOverlays();
					const emittedEvent = {
						name: parser.event(),
						state: this.state,
					};
					// this.logger.debug('[battlegrounds-state] Emitting new event', emittedEvent.name);
					this.eventEmitters.forEach(emitter => emitter(emittedEvent));
				}
			} catch (e) {
				this.logger.error('Exception while applying parser', e);
			}
		}
	}

	private async updateOverlays() {
		const [leaderboardWindow, playerInfoWindow, heroInfoWindow] = await Promise.all([
			this.ow.obtainDeclaredWindow(OverwolfService.BATTLEGROUNDS_LEADERBOARD_OVERLAY_WINDOW),
			this.ow.obtainDeclaredWindow(OverwolfService.BATTLEGROUNDS_PLAYER_INFO_WINDOW),
			this.ow.obtainDeclaredWindow(OverwolfService.BATTLEGROUNDS_HERO_SELECTION_OVERLAY_WINDOW),
		]);
		// this.logger.debug(
		// 	'[battlegrounds-state] udpating overlays?',
		// 	leaderboardWindow,
		// 	playerInfoWindow,
		// 	heroInfoWindow,
		// 	this.state,
		// 	this,
		// );
		if (this.state && !leaderboardWindow.isVisible && this.showLeaderboardPref) {
			await this.ow.restoreWindow(OverwolfService.BATTLEGROUNDS_LEADERBOARD_OVERLAY_WINDOW);
		} else if (!this.state || !this.showLeaderboardPref) {
			await this.ow.closeWindow(OverwolfService.BATTLEGROUNDS_LEADERBOARD_OVERLAY_WINDOW);
		}

		if (this.state && !playerInfoWindow.isVisible && this.showLeaderboardPref) {
			await this.ow.restoreWindow(OverwolfService.BATTLEGROUNDS_PLAYER_INFO_WINDOW);
		} else if (!this.state || !this.showLeaderboardPref) {
			await this.ow.closeWindow(OverwolfService.BATTLEGROUNDS_PLAYER_INFO_WINDOW);
		}

		if (
			this.state &&
			this.state.heroSelection.length > 0 &&
			!heroInfoWindow.isVisible &&
			this.showHeroSelectionPref
		) {
			await this.ow.restoreWindow(OverwolfService.BATTLEGROUNDS_HERO_SELECTION_OVERLAY_WINDOW);
		} else if (!this.state || this.state.heroSelection.length === 0 || !this.showHeroSelectionPref) {
			await this.ow.closeWindow(OverwolfService.BATTLEGROUNDS_HERO_SELECTION_OVERLAY_WINDOW);
		}
	}

	private async handleDisplayPreferences(preferences: Preferences = null) {
		preferences = preferences || (await this.prefs.getPreferences());
		this.showHeroSelectionPref = preferences.batlegroundsShowHeroSelectionPref;
		this.showLeaderboardPref = preferences.battlegroundsShowLastOpponentBoard;
		this.updateOverlays();
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
			new BattlegroundsShowPlayerInfoParser(),
			new BattlegroundsHidePlayerInfoParser(),
			new BattlegroundsShowHeroSelectionParser(this.infoService, this.allCards),
			new BattlegroundsHideHeroSelectionParser(),
		];
	}
}
