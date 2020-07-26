import { EventEmitter, Injectable } from '@angular/core';
import { GameType } from '@firestone-hs/reference-data';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { BehaviorSubject } from 'rxjs';
import { BattlegroundsState } from '../../../models/battlegrounds/battlegrounds-state';
import { GameEvent } from '../../../models/game-event';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { Preferences } from '../../../models/preferences';
import { Events } from '../../events.service';
import { GameEventsEmitterService } from '../../game-events-emitter.service';
import { TwitchAuthService } from '../../mainwindow/twitch-auth.service';
import { ManastormInfo } from '../../manastorm-bridge/manastorm-info';
import { OverwolfService } from '../../overwolf.service';
import { MemoryInspectionService } from '../../plugins/memory-inspection.service';
import { PreferencesService } from '../../preferences.service';
import { ProcessingQueue } from '../../processing-queue.service';
import { BgsBattleSimulationService } from '../bgs-battle-simulation.service';
import { BgsRunStatsService } from '../bgs-run-stats.service';
import { BgsBattleResultParser } from './event-parsers/bgs-battle-result-parser';
import { BgsBattleSimulationParser } from './event-parsers/bgs-battle-simulation-parser';
import { BgsCardPlayedParser } from './event-parsers/bgs-card-played-parser';
import { BgsCombatStartParser } from './event-parsers/bgs-combat-start-parser';
import { BgsGameEndParser } from './event-parsers/bgs-game-end-parser';
import { BgsGlobalInfoUpdatedParser } from './event-parsers/bgs-global-info-updated-parser';
import { BgsHeroSelectedParser } from './event-parsers/bgs-hero-selected-parser';
import { BgsHeroSelectionDoneParser } from './event-parsers/bgs-hero-selection-done-parser';
import { BgsHeroSelectionParser } from './event-parsers/bgs-hero-selection-parser';
import { BgsInitMmrParser } from './event-parsers/bgs-init-mmr-parser';
import { BgsInitParser } from './event-parsers/bgs-init-parser';
import { BgsLeaderboardPlaceParser } from './event-parsers/bgs-leaderboard-place-parser';
import { BgsMatchStartParser } from './event-parsers/bgs-match-start-parser';
import { BgsNextOpponentParser } from './event-parsers/bgs-next-opponent-parser';
import { BgsOpponentRevealedParser } from './event-parsers/bgs-opponent-revealed-parser';
import { BgsPlayerBoardParser } from './event-parsers/bgs-player-board-parser';
import { BgsPostMatchStatsFilterChangeParser } from './event-parsers/bgs-post-match-stats-filter-change-parser';
import { BgsStageChangeParser } from './event-parsers/bgs-stage-change-parser';
import { BgsStartComputingPostMatchStatsParser } from './event-parsers/bgs-start-computing-post-match-stats-parser';
import { BgsTavernUpgradeParser } from './event-parsers/bgs-tavern-upgrade-parser';
import { BgsTripleCreatedParser } from './event-parsers/bgs-triple-created-parser';
import { BgsTurnStartParser } from './event-parsers/bgs-turn-start-parser';
import { NoBgsMatchParser } from './event-parsers/no-bgs-match-parser';
import { EventParser } from './event-parsers/_event-parser';
import { BgsBattleResultEvent } from './events/bgs-battle-result-event';
import { BgsCardPlayedEvent } from './events/bgs-card-played-event';
import { BgsCombatStartEvent } from './events/bgs-combat-start-event';
import { BgsDamageDealtEvent } from './events/bgs-damage-dealth-event';
import { BgsGlobalInfoUpdatedEvent } from './events/bgs-global-info-updated-event';
import { BgsHeroSelectedEvent } from './events/bgs-hero-selected-event';
import { BgsHeroSelectionEvent } from './events/bgs-hero-selection-event';
import { BgsInitMmrEvent } from './events/bgs-init-mmr-event';
import { BgsLeaderboardPlaceEvent } from './events/bgs-leaderboard-place-event';
import { BgsMatchStartEvent } from './events/bgs-match-start-event';
import { BgsNextOpponentEvent } from './events/bgs-next-opponent-event';
import { BgsOpponentRevealedEvent } from './events/bgs-opponent-revealed-event';
import { BgsPlayerBoardEvent } from './events/bgs-player-board-event';
import { BgsStartComputingPostMatchStatsEvent } from './events/bgs-start-computing-post-match-stats-event';
import { BgsTavernUpgradeEvent } from './events/bgs-tavern-upgrade-event';
import { BgsTripleCreatedEvent } from './events/bgs-triple-created-event';
import { BgsTurnStartEvent } from './events/bgs-turn-start-event';
import { NoBgsMatchEvent } from './events/no-bgs-match-event';
import { BattlegroundsStoreEvent } from './events/_battlegrounds-store-event';
import { BattlegroundsOverlay } from './overlay/battlegrounds-overlay';
import { BgsBannedTribesOverlay } from './overlay/bgs-banned-tribes-overlay';
import { BgsMainWindowOverlay } from './overlay/bgs-main-window-overlay';
import { BgsPlayerPogoOverlay } from './overlay/bgs-player-pogo-overlay';
import { BgsSimulationOverlay } from './overlay/bgs-simulation-overlay';

@Injectable()
export class BattlegroundsStoreService {
	private mainWindowState: MainWindowState;
	private state: BattlegroundsState = new BattlegroundsState();
	private eventParsers: readonly EventParser[];
	private battlegroundsUpdater: EventEmitter<BattlegroundsStoreEvent> = new EventEmitter<BattlegroundsStoreEvent>();
	private battlegroundsStoreEventBus = new BehaviorSubject<BattlegroundsState>(null);

	private processingQueue = new ProcessingQueue<BattlegroundsStoreEvent>(
		eventQueue => this.processQueue(eventQueue),
		50,
		'battlegrounds-queue',
	);

	private queuedEvents: { event: BattlegroundsStoreEvent; trigger: string }[] = [];
	private overlayHandlers: BattlegroundsOverlay[];
	private eventEmitters = [];

	constructor(
		private gameEvents: GameEventsEmitterService,
		private allCards: AllCardsService,
		private events: Events,
		private simulation: BgsBattleSimulationService,
		private ow: OverwolfService,
		private prefs: PreferencesService,
		private memory: MemoryInspectionService,
		private twitch: TwitchAuthService,
		private init_BgsRunStatsService: BgsRunStatsService,
	) {
		this.eventParsers = this.buildEventParsers();
		this.registerGameEvents();
		this.buildEventEmitters();
		this.buildOverlayHandlers();
		this.battlegroundsUpdater.subscribe((event: GameEvent | BattlegroundsStoreEvent) => {
			// console.log('[battlegrounds-state] enqueueing', event);
			this.processingQueue.enqueue(event);
		});
		window['battlegroundsStore'] = this.battlegroundsStoreEventBus;
		window['battlegroundsUpdater'] = this.battlegroundsUpdater;
		window['bgsHotkeyPressed'] = this.handleHotkeyPressed;

		this.ow.addHotKeyPressedListener('battlegrounds', async hotkeyResult => {
			console.log('[bgs-store] hotkey pressed', hotkeyResult);
			if (hotkeyResult.status === 'success') {
				this.handleHotkeyPressed();
			}
		});

		this.handleDisplayPreferences();
		setTimeout(() => {
			const preferencesEventBus: EventEmitter<any> = this.ow.getMainWindow().preferencesEventBus;
			preferencesEventBus.subscribe(event => {
				if (event.name === PreferencesService.TWITCH_CONNECTION_STATUS) {
					console.log('[bgs-store] rebuilding event emitters');
					this.buildEventEmitters();
					return;
				}
				if (event) {
					this.handleDisplayPreferences(event.preferences);
				}
			});

			const mainWindowStoreEmitter: BehaviorSubject<MainWindowState> = window['mainWindowStore'];
			mainWindowStoreEmitter.subscribe(newState => {
				this.mainWindowState = newState;
				// console.log('[bgs-store] received new main state', this.mainWindowState);
			});
		});
	}

	private async handleHotkeyPressed() {
		if (this.overlayHandlers) {
			await Promise.all(this.overlayHandlers.map(handler => handler.handleHotkeyPressed(this.state)));
		}
	}

	private registerGameEvents() {
		this.gameEvents.allEvents.subscribe((gameEvent: GameEvent) => {
			if (gameEvent.type === GameEvent.BATTLEGROUNDS_HERO_SELECTION) {
				this.battlegroundsUpdater.next(new BgsHeroSelectionEvent(gameEvent.additionalData.heroCardIds));
				// TODO: retrieve current MMR
				this.battlegroundsUpdater.next(new BgsInitMmrEvent());
			} else if (gameEvent.type === GameEvent.BATTLEGROUNDS_HERO_SELECTED) {
				this.battlegroundsUpdater.next(new BgsHeroSelectedEvent(gameEvent.cardId));
			} else if (gameEvent.type === GameEvent.MATCH_METADATA) {
				this.queuedEvents = [];
				if (
					gameEvent.additionalData.metaData.GameType === GameType.GT_BATTLEGROUNDS ||
					gameEvent.additionalData.metaData.GameType === GameType.GT_BATTLEGROUNDS_FRIENDLY
				) {
					this.battlegroundsUpdater.next(new BgsMatchStartEvent());
				} else {
					this.battlegroundsUpdater.next(new NoBgsMatchEvent());
				}
			} else if (gameEvent.type === GameEvent.BATTLEGROUNDS_NEXT_OPPONENT) {
				this.maybeHandleNextEvent(
					new BgsNextOpponentEvent(gameEvent.additionalData.nextOpponentCardId),
					GameEvent.BATTLEGROUNDS_BATTLE_RESULT,
				);
			} else if (gameEvent.type === GameEvent.BATTLEGROUNDS_OPPONENT_REVEALED) {
				this.battlegroundsUpdater.next(new BgsOpponentRevealedEvent(gameEvent.additionalData.cardId));
			} else if (gameEvent.type === GameEvent.TURN_START) {
				this.battlegroundsUpdater.next(new BgsTurnStartEvent(gameEvent.additionalData.turnNumber));
			} else if (gameEvent.type === GameEvent.BATTLEGROUNDS_TAVERN_UPGRADE) {
				this.battlegroundsUpdater.next(
					new BgsTavernUpgradeEvent(gameEvent.additionalData.cardId, gameEvent.additionalData.tavernLevel),
				);
			} else if (
				gameEvent.type === GameEvent.DAMAGE &&
				gameEvent.additionalData.targets &&
				Object.keys(gameEvent.additionalData.targets).length === 1
			) {
				const playerCardId = Object.keys(gameEvent.additionalData.targets)[0];
				const damage = gameEvent.additionalData.targets[playerCardId].Damage;
				this.battlegroundsUpdater.next(new BgsDamageDealtEvent(playerCardId, damage));
			} else if (gameEvent.type === GameEvent.BATTLEGROUNDS_PLAYER_BOARD) {
				this.battlegroundsUpdater.next(
					new BgsPlayerBoardEvent(
						gameEvent.additionalData.cardId,
						gameEvent.additionalData.board,
						gameEvent.additionalData.hero,
						gameEvent.additionalData.heroPowerCardId,
						gameEvent.additionalData.heroPowerUsed,
					),
				);
				// } else if (gameEvent.type === GameEvent.MAIN_STEP_READY) {
				// 	this.battlegroundsUpdater.next(new BgsResetBattleStateEvent());
			} else if (gameEvent.type === GameEvent.BATTLEGROUNDS_COMBAT_START) {
				this.battlegroundsUpdater.next(new BgsCombatStartEvent());
				// 	} else {
				// 		console.warn('not ready to send battle simulation')
				// 	}
			} else if (gameEvent.type === GameEvent.BATTLEGROUNDS_BATTLE_RESULT) {
				this.battlegroundsUpdater.next(
					new BgsBattleResultEvent(
						gameEvent.additionalData.opponent,
						gameEvent.additionalData.result,
						gameEvent.additionalData.damage,
					),
				);
				setTimeout(async () => {
					const info = await this.memory.getBattlegroundsInfo(1);
					// console.log('bgs info', JSON.stringify(info, null, 4));
					this.battlegroundsUpdater.next(new BgsGlobalInfoUpdatedEvent(info));
					// console.log('BgsGlobalInfoUpdatedEvent emit done');
				}, 5000);
			} else if (gameEvent.type === GameEvent.BATTLEGROUNDS_TRIPLE) {
				this.battlegroundsUpdater.next(new BgsTripleCreatedEvent(gameEvent.cardId));
				// } else if (gameEvent.type === GameEvent.BATTLEGROUNDS_BOARD_COMPOSITION) {
				// 	this.battlegroundsUpdater.next(new BgsBoardCompositionEvent());
			} else if (gameEvent.type === GameEvent.CARD_PLAYED) {
				this.battlegroundsUpdater.next(new BgsCardPlayedEvent(gameEvent));
				// } else if (gameEvent.type === GameEvent.BATTLEGROUNDS_BOARD_COMPOSITION) {
				// 	this.battlegroundsUpdater.next(new BgsBoardCompositionEvent());
			} else if (gameEvent.type === GameEvent.GAME_END) {
				console.log('[bgs-store] Game ended');
				this.maybeHandleNextEvent(
					new BgsStartComputingPostMatchStatsEvent(gameEvent.additionalData.replayXml),
					GameEvent.BATTLEGROUNDS_BATTLE_RESULT,
				);
			} else if (gameEvent.type === GameEvent.BATTLEGROUNDS_LEADERBOARD_PLACE) {
				this.battlegroundsUpdater.next(
					new BgsLeaderboardPlaceEvent(
						gameEvent.additionalData.cardId,
						gameEvent.additionalData.leaderboardPlace,
					),
				);
			}
			this.processPendingEvents(gameEvent);
		});
		this.events.on(Events.REVIEW_FINALIZED).subscribe(async event => {
			console.log('[bgs-store] Replay created, received info', this.mainWindowState);
			const info: ManastormInfo = event.data[0];
			if (info && info.type === 'new-review' && this.state && this.state.inGame && this.state.currentGame) {
				this.events.broadcast(
					Events.START_BGS_RUN_STATS,
					info.reviewId,
					this.state.currentGame,
					this.mainWindowState?.stats?.bestBgsUserStats,
				);
			}
		});
	}

	private async processQueue(eventQueue: readonly BattlegroundsStoreEvent[]) {
		const gameEvent = eventQueue[0];
		// console.log('[bgs-store] processing', gameEvent.type, gameEvent);
		try {
			await this.processEvent(gameEvent);
		} catch (e) {
			console.error('[bgs-store] Exception while processing event', e);
		}
		return eventQueue.slice(1);
	}

	private processPendingEvents(gameEvent: BattlegroundsStoreEvent) {
		const eventsToProcess = this.queuedEvents.filter(event => event.trigger === gameEvent.type);
		this.queuedEvents = this.queuedEvents.filter(event => event.trigger !== gameEvent.type);
		for (const event of eventsToProcess) {
			// console.log('[bgs-store] enqueueing pending event', event.event.type, event.trigger);
			this.battlegroundsUpdater.next(event.event);
		}
	}

	private maybeHandleNextEvent(gameEvent: BattlegroundsStoreEvent, nextTrigger: string): void {
		// Battle not over yet, deferring the event
		// console.log('should handle event?', this.state.currentGame, gameEvent);
		if (this.state.currentGame?.battleInfo?.opponentBoard) {
			// console.log('requeueing', gameEvent);
			this.queuedEvents.push({ event: gameEvent, trigger: nextTrigger });
			// if (this.requeueTimeout) {
			// 	clearTimeout(this.requeueTimeout);
			// }
			// this.requeueTimeout = setTimeout(() => {
			// 	this.maybeHandleNextEvent(gameEvent);
			// }, 2000);
		} else {
			// console.log('sending event', gameEvent);
			// if (this.requeueTimeout) {
			// 	clearTimeout(this.requeueTimeout);
			// }
			this.battlegroundsUpdater.next(gameEvent);
		}
	}

	private async processEvent(gameEvent: BattlegroundsStoreEvent) {
		await Promise.all(this.overlayHandlers.map(handler => handler.processEvent(gameEvent)));
		if (gameEvent.type === 'BgsCloseWindowEvent') {
			this.state = this.state.update({
				forceOpen: false,
			} as BattlegroundsState);
			this.updateOverlay();
		}
		for (const parser of this.eventParsers) {
			try {
				if (parser.applies(gameEvent, this.state)) {
					const newState = await parser.parse(this.state, gameEvent);
					if (newState !== this.state) {
						this.state = newState;
						this.eventEmitters.forEach(emitter => emitter(this.state));

						// this.battlegroundsStoreEventBus.next(this.state);
						// console.log('emitted state', gameEvent.type, this.state);
						this.updateOverlay();
					}
				}
			} catch (e) {
				console.error('[bgs-store] Exception while applying parser', gameEvent.type, e.message, e);
			}
		}
	}

	private async buildEventEmitters() {
		const result = [state => this.battlegroundsStoreEventBus.next(state)];
		const prefs = await this.prefs.getPreferences();
		console.log('[bgs-store] is logged in to Twitch?', prefs.twitchAccessToken);
		if (prefs.twitchAccessToken) {
			const isTokenValid = await this.twitch.validateToken(prefs.twitchAccessToken);
			if (!isTokenValid) {
				this.prefs.setTwitchAccessToken(undefined);
				// Don't send the notif, as it's already sent by game-state.service
				// await this.twitch.sendExpiredTwitchTokenNotification();
			} else {
				result.push(state => this.twitch.emitBattlegroundsEvent(state));
			}
		}
		this.eventEmitters = result;
	}

	private async handleDisplayPreferences(preferences: Preferences = null) {
		preferences = preferences || (await this.prefs.getPreferences());
		await Promise.all(this.overlayHandlers.map(handler => handler.handleDisplayPreferences(preferences)));
		this.updateOverlay();
	}

	private async updateOverlay() {
		await Promise.all(this.overlayHandlers.map(handler => handler.updateOverlay(this.state)));
		if (this.state.forceOpen) {
			this.state = this.state.update({ forceOpen: false } as BattlegroundsState);
		}
	}

	private buildEventParsers(): readonly EventParser[] {
		return [
			new NoBgsMatchParser(),
			// new BattlegroundsResetBattleStateParser(),
			new BgsInitParser(),
			new BgsHeroSelectionParser(this.memory),
			new BgsHeroSelectedParser(this.allCards),
			new BgsHeroSelectionDoneParser(),
			new BgsNextOpponentParser(),
			new BgsTavernUpgradeParser(),
			new BgsPlayerBoardParser(this.simulation),
			new BgsTripleCreatedParser(),
			new BgsOpponentRevealedParser(this.allCards),
			new BgsTurnStartParser(),
			new BgsMatchStartParser(),
			new BgsGameEndParser(this.prefs),
			new BgsStageChangeParser(),
			new BgsBattleResultParser(),
			// new BgsResetBattleStateParser(),
			new BgsBattleSimulationParser(),
			new BgsPostMatchStatsFilterChangeParser(),
			// new BgsDamageDealtParser(),
			new BgsLeaderboardPlaceParser(),
			new BgsCombatStartParser(),
			new BgsGlobalInfoUpdatedParser(),
			new BgsStartComputingPostMatchStatsParser(this.prefs),
			new BgsInitMmrParser(this.memory),
			new BgsCardPlayedParser(),
		];
	}

	private buildOverlayHandlers() {
		this.overlayHandlers = [
			new BgsMainWindowOverlay(this.prefs, this.ow),
			new BgsPlayerPogoOverlay(this.ow),
			new BgsSimulationOverlay(this.prefs, this.ow),
			new BgsBannedTribesOverlay(this.prefs, this.ow),
		];
	}
}
