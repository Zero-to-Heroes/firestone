import { EventEmitter, Injectable } from '@angular/core';
import { CardIds, GameType } from '@firestone-hs/reference-data';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { BehaviorSubject } from 'rxjs';
import { BattlegroundsState } from '../../../models/battlegrounds/battlegrounds-state';
import { GameEvent } from '../../../models/game-event';
import { DamageGameEvent } from '../../../models/mainwindow/game-events/damage-game-event';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { Preferences } from '../../../models/preferences';
import { GameStateService } from '../../decktracker/game-state.service';
import { Events } from '../../events.service';
import { FeatureFlags } from '../../feature-flags';
import { GameEventsEmitterService } from '../../game-events-emitter.service';
import { TwitchAuthService } from '../../mainwindow/twitch-auth.service';
import { ManastormInfo } from '../../manastorm-bridge/manastorm-info';
import { OverwolfService } from '../../overwolf.service';
import { PatchesConfigService } from '../../patches-config.service';
import { MemoryInspectionService } from '../../plugins/memory-inspection.service';
import { PreferencesService } from '../../preferences.service';
import { ProcessingQueue } from '../../processing-queue.service';
import { BgsBattleSimulationService } from '../bgs-battle-simulation.service';
import { BgsRunStatsService } from '../bgs-run-stats.service';
import { BgsBattleResultParser } from './event-parsers/bgs-battle-result-parser';
import { BgsBattleSimulationParser } from './event-parsers/bgs-battle-simulation-parser';
import { BgsCardPlayedParser } from './event-parsers/bgs-card-played-parser';
import { BgsChangePostMatchStatsTabsNumberParser } from './event-parsers/bgs-change-post-match-stats-tabs-number-parser';
import { BgsCombatStartParser } from './event-parsers/bgs-combat-start-parser';
import { BgsGameEndParser } from './event-parsers/bgs-game-end-parser';
import { BgsGlobalInfoUpdatedParser } from './event-parsers/bgs-global-info-updated-parser';
import { BgsHeroSelectedParser } from './event-parsers/bgs-hero-selected-parser';
import { BgsHeroSelectionParser } from './event-parsers/bgs-hero-selection-parser';
import { BgsInitMmrParser } from './event-parsers/bgs-init-mmr-parser';
import { BgsInitParser } from './event-parsers/bgs-init-parser';
import { BgsLeaderboardPlaceParser } from './event-parsers/bgs-leaderboard-place-parser';
import { BgsMatchStartParser } from './event-parsers/bgs-match-start-parser';
import { BgsNextOpponentParser } from './event-parsers/bgs-next-opponent-parser';
import { BgsOpponentRevealedParser } from './event-parsers/bgs-opponent-revealed-parser';
import { BgsPlayerBoardParser } from './event-parsers/bgs-player-board-parser';
import { BgsPostMatchStatsFilterChangeParser } from './event-parsers/bgs-post-match-stats-filter-change-parser';
import { BgsRealTimeStatsUpdatedParser } from './event-parsers/bgs-real-time-stats-updated-parser';
import { BgsReconnectStatusParser } from './event-parsers/bgs-reconnect-status-parser';
import { BgsRecruitStartParser } from './event-parsers/bgs-recruit-start-parser';
import { BgsResetHighlightsParser } from './event-parsers/bgs-reset-highlights-processor';
import { BgsStageChangeParser } from './event-parsers/bgs-stage-change-parser';
import { BgsStartComputingPostMatchStatsParser } from './event-parsers/bgs-start-computing-post-match-stats-parser';
import { BgsStatUpdateParser } from './event-parsers/bgs-stat-update-parser';
import { BgsTavernUpgradeParser } from './event-parsers/bgs-tavern-upgrade-parser';
import { BgsToggleHighlightMinionOnBoardParser } from './event-parsers/bgs-toggle-highlight-minion-on-board-parser';
import { BgsToggleHighlightTribeOnBoardParser } from './event-parsers/bgs-toggle-highlight-tribe-on-board-parser';
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
import { BgsRealTimeStatsUpdatedEvent } from './events/bgs-real-time-stats-updated-event';
import { BgsReconnectStatusEvent } from './events/bgs-reconnect-status-event';
import { BgsRecruitStartEvent } from './events/bgs-recruit-start-event';
import { BgsStartComputingPostMatchStatsEvent } from './events/bgs-start-computing-post-match-stats-event';
import { BgsTavernUpgradeEvent } from './events/bgs-tavern-upgrade-event';
import { BgsToggleOverlayWindowEvent } from './events/bgs-toggle-overlay-window-event';
import { BgsTripleCreatedEvent } from './events/bgs-triple-created-event';
import { BgsTurnStartEvent } from './events/bgs-turn-start-event';
import { NoBgsMatchEvent } from './events/no-bgs-match-event';
import { BattlegroundsStoreEvent } from './events/_battlegrounds-store-event';
import { BattlegroundsOverlay } from './overlay/battlegrounds-overlay';
import { BgsBannedTribesOverlay } from './overlay/bgs-banned-tribes-overlay';
import { BgsHeroSelectionOverlay } from './overlay/bgs-hero-selection-overlay';
import { BgsMainWindowOverlay } from './overlay/bgs-main-window-overlay';
import { BgsMinionsListOverlay } from './overlay/bgs-minions-list-overlay';
import { BgsMouseOverOverlay } from './overlay/bgs-mouse-over-overlay';
import { BgsOverlayButtonOverlay } from './overlay/bgs-overlay-button-overlay';
import { BgsPlayerPogoOverlay } from './overlay/bgs-player-pogo-overlay';
import { BgsSimulationOverlay } from './overlay/bgs-simulation-overlay';
import { RealTimeStatsState } from './real-time-stats/real-time-stats';
import { RealTimeStatsService } from './real-time-stats/real-time-stats.service';

@Injectable()
export class BattlegroundsStoreService {
	private mainWindowState: MainWindowState;
	private state: BattlegroundsState = new BattlegroundsState();
	private eventParsers: readonly EventParser[] = [];
	private battlegroundsUpdater: EventEmitter<BattlegroundsStoreEvent> = new EventEmitter<BattlegroundsStoreEvent>();
	private battlegroundsStoreEventBus = new BehaviorSubject<BattlegroundsState>(null);
	private battlegroundsWindowsListener: EventEmitter<boolean> = new EventEmitter<boolean>();

	private processingQueue = new ProcessingQueue<BattlegroundsStoreEvent>(
		eventQueue => this.processQueue(eventQueue),
		50,
		'battlegrounds-queue',
	);

	private queuedEvents: { event: BattlegroundsStoreEvent; trigger: string }[] = [];
	private overlayHandlers: BattlegroundsOverlay[];
	private eventEmitters = [];
	private memoryInterval;
	private battlegroundsHotkeyListener;

	constructor(
		private gameEvents: GameEventsEmitterService,
		private allCards: AllCardsService,
		private events: Events,
		private simulation: BgsBattleSimulationService,
		private ow: OverwolfService,
		private prefs: PreferencesService,
		private memory: MemoryInspectionService,
		private twitch: TwitchAuthService,
		private patchesService: PatchesConfigService,
		private realTimeStats: RealTimeStatsService,
		private gameState: GameStateService,
		private init_BgsRunStatsService: BgsRunStatsService,
	) {
		window['battlegroundsStore'] = this.battlegroundsStoreEventBus;
		window['battlegroundsUpdater'] = this.battlegroundsUpdater;
		window['bgsHotkeyPressed'] = this.battlegroundsWindowsListener;
		this.eventParsers = this.buildEventParsers();
		this.registerGameEvents();
		this.buildEventEmitters();
		this.buildOverlayHandlers();
		this.battlegroundsUpdater.subscribe((event: GameEvent | BattlegroundsStoreEvent) => {
			// console.log('[battlegrounds-state] enqueueing', event);
			this.processingQueue.enqueue(event);
		});
		this.battlegroundsWindowsListener.subscribe((event: boolean) => {
			console.log('[bgs-store] hotkey pressed');
			this.handleHotkeyPressed(true);
		});

		this.battlegroundsHotkeyListener = this.ow.addHotKeyPressedListener('battlegrounds', async hotkeyResult => {
			console.log('[bgs-store] hotkey pressed', hotkeyResult);
			this.handleHotkeyPressed();
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

	private async handleHotkeyPressed(force = false) {
		//console.log('handling hotley', force, this.overlayHandlers, this);
		if (this.overlayHandlers) {
			await Promise.all(this.overlayHandlers.map(handler => handler.handleHotkeyPressed(this.state, force)));
		}
	}

	private registerGameEvents() {
		this.gameEvents.allEvents.subscribe(async (gameEvent: GameEvent) => {
			const prefs = await this.prefs.getPreferences();
			this.eventsThisTurn.push(gameEvent.type);
			if (gameEvent.type === GameEvent.RECONNECT_START) {
				this.battlegroundsUpdater.next(new BgsReconnectStatusEvent(true));
			} else if (gameEvent.type === GameEvent.RECONNECT_OVER) {
				this.battlegroundsUpdater.next(new BgsReconnectStatusEvent(false));
			} else if (gameEvent.type === GameEvent.BATTLEGROUNDS_HERO_SELECTION) {
				this.battlegroundsUpdater.next(new BgsHeroSelectionEvent(gameEvent.additionalData.heroCardIds));
				this.battlegroundsUpdater.next(new BgsInitMmrEvent());
			} else if (gameEvent.type === GameEvent.BATTLEGROUNDS_HERO_SELECTED) {
				this.battlegroundsUpdater.next(new BgsHeroSelectedEvent(gameEvent.cardId, gameEvent.additionalData));
			} else if (gameEvent.type === GameEvent.MATCH_METADATA) {
				this.queuedEvents = [];
				if (
					gameEvent.additionalData.metaData.GameType === GameType.GT_BATTLEGROUNDS ||
					gameEvent.additionalData.metaData.GameType === GameType.GT_BATTLEGROUNDS_FRIENDLY
				) {
					this.battlegroundsUpdater.next(new BgsMatchStartEvent(this.mainWindowState));
					if (this.memoryInterval) {
						clearInterval(this.memoryInterval);
						this.memoryInterval = null;
					}
					// console.log('[battlegrounds-store] triggering setInterval', this.memoryInterval);
					this.memoryInterval = setInterval(async () => {
						// Here we want to get the players info, mostly
						// console.log('[battlegrounds-store] getting battlegrounds info');
						let info = await this.memory.getBattlegroundsMatchWithPlayers(2);
						// console.log('[battlegrounds-store] bgs info', info);
						if (info?.game?.Players && info.game.Players.length > 0) {
							// console.log('[battlegrounds-store] removing damage info from memory players', info);
							info = {
								...info,
								game: {
									...info.game,
									Players: info.game.Players.map(player => ({
										...player,
										Damage: null,
									})),
								},
							};
							// console.log('[battlegrounds-store] removed damage info', info);
						}
						this.battlegroundsUpdater.next(new BgsGlobalInfoUpdatedEvent(info));
						// console.log('BgsGlobalInfoUpdatedEvent emit done');
					}, 3000);
				} else {
					this.battlegroundsUpdater.next(new NoBgsMatchEvent());
				}
			} else if (gameEvent.type === GameEvent.BATTLEGROUNDS_NEXT_OPPONENT) {
				this.handleEventOnlyAfterTrigger(
					new BgsNextOpponentEvent(gameEvent.additionalData.nextOpponentCardId),
					GameEvent.TURN_START,
				);
				const info = await this.memory.getBattlegroundsMatchWithPlayers(2);
				this.handleEventOnlyAfterTrigger(new BgsGlobalInfoUpdatedEvent(info), GameEvent.TURN_START);
			} else if (gameEvent.type === GameEvent.BATTLEGROUNDS_OPPONENT_REVEALED) {
				this.battlegroundsUpdater.next(
					new BgsOpponentRevealedEvent(
						gameEvent.additionalData.cardId,
						gameEvent.additionalData.leaderboardPlace,
					),
				);
			} else if (gameEvent.type === GameEvent.TURN_START) {
				this.processAllPendingEvents(gameEvent.additionalData.turnNumber);
				this.battlegroundsUpdater.next(new BgsTurnStartEvent(gameEvent.additionalData.turnNumber));
			} else if (gameEvent.type === GameEvent.BATTLEGROUNDS_COMBAT_START) {
				this.battlegroundsUpdater.next(new BgsCombatStartEvent());
			} else if (gameEvent.type === GameEvent.BATTLEGROUNDS_RECRUIT_PHASE) {
				this.battlegroundsUpdater.next(new BgsRecruitStartEvent());
			} else if (gameEvent.type === GameEvent.BATTLEGROUNDS_TAVERN_UPGRADE) {
				this.battlegroundsUpdater.next(
					new BgsTavernUpgradeEvent(gameEvent.additionalData.cardId, gameEvent.additionalData.tavernLevel),
				);
			} else if (
				gameEvent.type === GameEvent.DAMAGE &&
				gameEvent.additionalData.targets &&
				Object.keys(gameEvent.additionalData.targets).length === 1
			) {
				const targetValues = Object.values((gameEvent as DamageGameEvent).additionalData.targets);
				const playerCardId = targetValues[0].TargetCardId;
				const damage = targetValues.find(target => target.TargetCardId === playerCardId)?.Damage;
				this.battlegroundsUpdater.next(new BgsDamageDealtEvent(playerCardId, damage));
			} else if (gameEvent.type === GameEvent.BATTLEGROUNDS_PLAYER_BOARD) {
				this.handleEventOnlyAfterTrigger(
					new BgsPlayerBoardEvent(
						{
							heroCardId: gameEvent.additionalData.playerBoard.cardId,
							board: gameEvent.additionalData.playerBoard.board,
							hero: gameEvent.additionalData.playerBoard.hero,
							heroPowerCardId: gameEvent.additionalData.playerBoard.heroPowerCardId,
							heroPowerUsed: gameEvent.additionalData.playerBoard.heroPowerUsed,
						},
						{
							heroCardId: gameEvent.additionalData.opponentBoard.cardId,
							board: gameEvent.additionalData.opponentBoard.board,
							hero: gameEvent.additionalData.opponentBoard.hero,
							heroPowerCardId: gameEvent.additionalData.opponentBoard.heroPowerCardId,
							heroPowerUsed: gameEvent.additionalData.opponentBoard.heroPowerUsed,
						},
					),
					GameEvent.BATTLEGROUNDS_COMBAT_START,
				);
			} else if (gameEvent.type === GameEvent.BATTLEGROUNDS_BATTLE_RESULT) {
				// Sometimes the battle result arrives before the simulation is completed
				if (
					this.state.currentGame.battleInfo?.opponentBoard?.player?.cardId &&
					this.state.currentGame.battleInfo?.opponentBoard?.player?.cardId !==
						gameEvent.additionalData.opponent &&
					gameEvent.additionalData.opponent != CardIds.NonCollectible.Neutral.KelthuzadTavernBrawl2
				) {
					console.error(
						'no-format',
						'[bgs-simulation] Received battle result with an incompatible battle sim',
						this.state.currentGame.battleInfo?.opponentBoard?.player?.cardId,
						gameEvent.additionalData.opponent,
						this.state.currentGame.battleInfo,
						this.state.currentGame.battleResult,
					);
				} else if (
					!this.state.currentGame.battleResult ||
					(prefs.bgsEnableSimulation && !this.state.currentGame.battleInfo)
				) {
					// When no one has a board (or rather, when no player ever attacks during the battle),
					// the PLAYER_BOARD event is not sent, and so battle result is never set
					// Ties in battle are the only situation where this can happen, so I'm for now downgrading
					// the severity when the result is a tie
					if (gameEvent.additionalData.result === 'tied') {
						console.warn(
							'no-format',
							'[bgs-simulation] Received battle result with an incomplete battle info',
							this.state.currentGame.battleInfo,
							this.state.currentGame.battleResult,
							prefs.bgsEnableSimulation,
						);
					} else {
						console.error(
							'no-format',
							'[bgs-simulation] Received battle result with an incomplete battle info',
							this.state.currentGame.battleInfo,
							this.state.currentGame.battleResult,
							prefs.bgsEnableSimulation,
						);
					}
				}
				this.battlegroundsUpdater.next(
					new BgsBattleResultEvent(
						gameEvent.additionalData.opponent,
						gameEvent.additionalData.result,
						gameEvent.additionalData.damage,
					),
				);
			} else if (gameEvent.type === GameEvent.BATTLEGROUNDS_TRIPLE) {
				this.battlegroundsUpdater.next(new BgsTripleCreatedEvent(gameEvent.cardId));
			} else if (gameEvent.type === GameEvent.CARD_PLAYED) {
				this.battlegroundsUpdater.next(new BgsCardPlayedEvent(gameEvent));
			} else if (gameEvent.type === GameEvent.GAME_END) {
				// console.log('[bgs-store] Game ended', gameEvent);
				if (this.memoryInterval) {
					clearInterval(this.memoryInterval);
					this.memoryInterval = null;
				}
				this.battlegroundsUpdater.next(
					new BgsStartComputingPostMatchStatsEvent(gameEvent.additionalData.replayXml),
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
		this.realTimeStats.addListener((state: RealTimeStatsState) => {
			this.battlegroundsUpdater.next(new BgsRealTimeStatsUpdatedEvent(state));
		});

		this.events.on(Events.REVIEW_FINALIZED).subscribe(async event => {
			console.log('[bgs-store] Replay created, received info');
			const info: ManastormInfo = event.data[0];
			if (info && info.type === 'new-review' && this.state && this.state.inGame && this.state.currentGame) {
				this.events.broadcast(
					Events.START_BGS_RUN_STATS,
					info.reviewId,
					this.state.currentGame,
					this.mainWindowState?.stats?.bestBgsUserStats,
					info.game,
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
			this.battlegroundsUpdater.next(event.event);
		}
	}

	private processAllPendingEvents(turnNumber: number) {
		for (const event of this.queuedEvents) {
			// console.log('[bgs-store] force processing pending event', event.event.type);
			this.battlegroundsUpdater.next(event.event);
		}
		this.queuedEvents = [];
		this.eventsThisTurn = [];
	}

	private eventsThisTurn: string[] = [];

	private handleEventOnlyAfterTrigger(gameEvent: BattlegroundsStoreEvent, nextTrigger: string): void {
		if (this.eventsThisTurn.includes(nextTrigger)) {
			this.battlegroundsUpdater.next(gameEvent);
		} else {
			// console.log('requeueing', gameEvent);
			this.queuedEvents.push({ event: gameEvent, trigger: nextTrigger });
		}
	}

	private async processEvent(gameEvent: BattlegroundsStoreEvent) {
		await Promise.all(this.overlayHandlers.map(handler => handler.processEvent(gameEvent)));
		if (gameEvent.type === 'BgsCloseWindowEvent') {
			this.state = this.state.update({
				forceOpen: false,
			} as BattlegroundsState);
			this.updateOverlay();
		} else if (gameEvent.type === BgsToggleOverlayWindowEvent.NAME) {
			const window = await this.ow.obtainDeclaredWindow(OverwolfService.BATTLEGROUNDS_WINDOW_OVERLAY);
			if (window.stateEx === 'normal' || window.stateEx === 'maximized') {
				await this.ow.minimizeWindow(OverwolfService.BATTLEGROUNDS_WINDOW_OVERLAY);
			} else {
				this.state = this.state.update({
					forceOpen: true,
				} as BattlegroundsState);
				// await this.ow.obtainDeclaredWindow(OverwolfService.BATTLEGROUNDS_WINDOW_OVERLAY);
				await this.ow.restoreWindow(OverwolfService.BATTLEGROUNDS_WINDOW_OVERLAY);
			}
		}
		let newState = this.state;
		for (const parser of this.eventParsers) {
			try {
				if (parser.applies(gameEvent, newState)) {
					newState = await parser.parse(newState, gameEvent);
				}
			} catch (e) {
				console.error('[bgs-store] Exception while applying parser', gameEvent.type, e.message, e);
			}
		}
		if (newState !== this.state) {
			this.state = newState;
			this.eventEmitters.forEach(emitter => emitter(this.state));
			// console.log('emitted state', gameEvent.type, this.state);
			this.updateOverlay();
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
		if (this.overlayHandlers?.length) {
			await Promise.all(this.overlayHandlers.map(handler => handler.updateOverlay(this.state)));
		}
		if (this.state.forceOpen) {
			this.state = this.state.update({ forceOpen: false } as BattlegroundsState);
		}
	}

	private buildEventParsers(): readonly EventParser[] {
		const eventParsers = [
			new NoBgsMatchParser(),
			// new BattlegroundsResetBattleStateParser(),
			new BgsInitParser(this.prefs),
			new BgsStatUpdateParser(this.allCards, this.patchesService),
			new BgsHeroSelectionParser(this.memory, this.patchesService),
			new BgsHeroSelectedParser(this.allCards),
			new BgsNextOpponentParser(),
			new BgsTavernUpgradeParser(),
			new BgsPlayerBoardParser(this.simulation, this.prefs),
			new BgsTripleCreatedParser(),
			new BgsOpponentRevealedParser(this.allCards),
			new BgsTurnStartParser(),
			new BgsMatchStartParser(this.prefs, this.gameState),
			new BgsGameEndParser(this.prefs, this.memory),
			new BgsStageChangeParser(),
			new BgsBattleResultParser(this.events, this.ow),
			// new BgsResetBattleStateParser(),
			new BgsBattleSimulationParser(this.prefs),
			new BgsPostMatchStatsFilterChangeParser(this.prefs),
			new BgsChangePostMatchStatsTabsNumberParser(this.prefs),
			// new BgsDamageDealtParser(),
			new BgsLeaderboardPlaceParser(),
			new BgsCombatStartParser(),
			new BgsRecruitStartParser(this.prefs),
			new BgsGlobalInfoUpdatedParser(),
			new BgsStartComputingPostMatchStatsParser(this.prefs),
			new BgsInitMmrParser(this.memory),
			new BgsCardPlayedParser(),
			new BgsToggleHighlightTribeOnBoardParser(),
			new BgsToggleHighlightMinionOnBoardParser(),
			new BgsResetHighlightsParser(),
			new BgsReconnectStatusParser(),
		];

		if (FeatureFlags.ENABLE_REAL_TIME_STATS) {
			eventParsers.push(new BgsRealTimeStatsUpdatedParser());
		}
		return eventParsers;
	}

	private buildOverlayHandlers() {
		this.overlayHandlers = [
			new BgsMainWindowOverlay(this.prefs, this.ow),
			new BgsPlayerPogoOverlay(this.ow),
			new BgsSimulationOverlay(this.prefs, this.ow),
			new BgsBannedTribesOverlay(this.prefs, this.ow),
			new BgsMouseOverOverlay(this.prefs, this.ow),
			new BgsMinionsListOverlay(this.prefs, this.ow),
			new BgsOverlayButtonOverlay(this.ow),
			new BgsHeroSelectionOverlay(this.ow),
		];
	}
}
