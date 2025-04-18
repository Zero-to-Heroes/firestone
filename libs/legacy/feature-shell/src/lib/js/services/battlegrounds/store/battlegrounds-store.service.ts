import { EventEmitter, Injectable } from '@angular/core';
import {
	BgsBoardHighlighterService,
	BgsMatchMemoryInfoService,
	BgsMetaHeroStatsDuoService,
	BgsMetaHeroStatsService,
} from '@firestone/battlegrounds/common';
import {
	BattlegroundsState,
	BgsBattleSimulationService,
	BgsIntermediateResultsSimGuardianService,
	PlayerBoard,
	RealTimeStatsState,
} from '@firestone/battlegrounds/core';
import { GameState, GameUniqueIdService } from '@firestone/game-state';
import { MemoryBgsTeamInfo, MemoryInspectionService } from '@firestone/memory';
import {
	BugReportService,
	GameStatusService,
	LogsUploaderService,
	PatchesConfigService,
	PreferencesService,
} from '@firestone/shared/common/service';
import { CardsFacadeService, OverwolfService, OwUtilsService, waitForReady } from '@firestone/shared/framework/core';
import { TwitchAuthService } from '@firestone/twitch/common';
import { BgsBuddyGainedParser } from '@services/battlegrounds/store/event-parsers/bgs-buddy-gained-parser';
import { BgsBuddyGainedEvent } from '@services/battlegrounds/store/events/bgs-buddy-gained-event';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { MainWindowStoreEvent } from '@services/mainwindow/store/events/main-window-store-event';
import { auditTime, BehaviorSubject, distinctUntilChanged, filter } from 'rxjs';
import { GameEvent } from '../../../models/game-event';
import { DamageGameEvent } from '../../../models/mainwindow/game-events/damage-game-event';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../models/mainwindow/navigation/navigation-state';
import { AdService } from '../../ad.service';
import { GameStateService } from '../../decktracker/game-state.service';
import { Events } from '../../events.service';
import { GameEventsEmitterService } from '../../game-events-emitter.service';
import { GameEvents } from '../../game-events.service';
import { ManastormInfo } from '../../manastorm-bridge/manastorm-info';
import { ProcessingQueue } from '../../processing-queue.service';
import { sleep } from '../../utils';
import { BgsBestUserStatsService } from '../bgs-best-user-stats.service';
import { BgsRunStatsService } from '../bgs-run-stats.service';
import { isBattlegrounds } from '../bgs-utils';
import { EventParser } from './event-parsers/_event-parser';
import { BgsArmorChangedParser } from './event-parsers/bgs-armor-changed-parser';
import { BgsBallerBuffChangedEvent, BgsBallerBuffChangedParser } from './event-parsers/bgs-baller-buff-changed';
import { BgsBattleResultParser } from './event-parsers/bgs-battle-result-parser';
import { BgsBattleSimulationParser } from './event-parsers/bgs-battle-simulation-parser';
import { BgsBattleSimulationResetParser } from './event-parsers/bgs-battle-simulation-reset-parser';
import { BgsBattleSimulationUpdateParser } from './event-parsers/bgs-battle-simulation-update-parser';
import { BgsBeetleArmyChangedEvent, BgsBeetleArmyChangedParser } from './event-parsers/bgs-beetle-army-changed';
import { BgsBloodGemBuffChangedEvent, BgsBloodGemBuffChangedParser } from './event-parsers/bgs-blood-gem-buff-changed';
import { BgsCardPlayedParser } from './event-parsers/bgs-card-played-parser';
import { BgsChangePostMatchStatsTabsNumberParser } from './event-parsers/bgs-change-post-match-stats-tabs-number-parser';
import { BgsCombatStartParser } from './event-parsers/bgs-combat-start-parser';
import { BgsGameEndParser } from './event-parsers/bgs-game-end-parser';
import { BgsGameSettingsParser } from './event-parsers/bgs-game-settings-parser';
import { BgsGlobalInfoUpdatedParser } from './event-parsers/bgs-global-info-updated-parser';
import { BgsHeroRerollEvent, BgsHeroRerollParser } from './event-parsers/bgs-hero-reroll-parser';
import { BgsHeroSelectedParser } from './event-parsers/bgs-hero-selected-parser';
import { BgsHeroSelectionParser } from './event-parsers/bgs-hero-selection-parser';
import { BgsInitMmrParser } from './event-parsers/bgs-init-mmr-parser';
import { BgsLeaderboardPlaceParser } from './event-parsers/bgs-leaderboard-place-parser';
import { BgsMagnetizedChangedEvent, BgsMagnetizedChangedParser } from './event-parsers/bgs-magnetized-changed';
import { BgsMatchStartParser } from './event-parsers/bgs-match-start-parser';
import { BgsNextOpponentParser } from './event-parsers/bgs-next-opponent-parser';
import { BgsOpponentRevealedParser } from './event-parsers/bgs-opponent-revealed-parser';
import { BgsPlayerBoardParser } from './event-parsers/bgs-player-board-parser';
import { BgsPostMatchStatsFilterChangeParser } from './event-parsers/bgs-post-match-stats-filter-change-parser';
import { BgsRealTimeStatsUpdatedParser } from './event-parsers/bgs-real-time-stats-updated-parser';
import { BgsReconnectStatusParser } from './event-parsers/bgs-reconnect-status-parser';
import { BgsRecruitStartParser } from './event-parsers/bgs-recruit-start-parser';
import { BgsRewardGainedParser } from './event-parsers/bgs-reward-gained-parser';
import { BgsRewardRevealedParser } from './event-parsers/bgs-reward-revealed-parser';
import { BgsSelectBattleParser } from './event-parsers/bgs-select-battle-parser';
import { BgsShowPostMatchStatsParser } from './event-parsers/bgs-show-post-match-stats-parser';
import { BgsSpectatingParser } from './event-parsers/bgs-spectating-parser';
import { BgsStageChangeParser } from './event-parsers/bgs-stage-change-parser';
import { BgsStartComputingPostMatchStatsParser } from './event-parsers/bgs-start-computing-post-match-stats-parser';
import { BgsTavernUpgradeParser } from './event-parsers/bgs-tavern-upgrade-parser';
import { BgsTrinketSelectedEvent, BgsTrinketSelectedParser } from './event-parsers/bgs-trinket-selected-parser';
import { BgsTripleCreatedParser } from './event-parsers/bgs-triple-created-parser';
import { BgsTurnStartParser } from './event-parsers/bgs-turn-start-parser';
import { BgsExtraGoldNextTurnEvent, BgsExtraGoldNextTurnParser } from './event-parsers/extra-gold-next-turn';
import { NoBgsMatchParser } from './event-parsers/no-bgs-match-parser';
import { BattlegroundsStoreEvent } from './events/_battlegrounds-store-event';
import { BattlegroundsBattleSimulationEvent } from './events/battlegrounds-battle-simulation-event';
import { BgsArmorChangedEvent } from './events/bgs-armor-changed-event';
import { BgsBattleResultEvent } from './events/bgs-battle-result-event';
import { BgsBattleSimulationResetEvent } from './events/bgs-battle-simulation-reset-event';
import { BgsBattleSimulationUpdateEvent } from './events/bgs-battle-simulation-update-event';
import { BgsCardPlayedEvent } from './events/bgs-card-played-event';
import { BgsChangePostMatchStatsTabsNumberEvent } from './events/bgs-change-post-match-stats-tabs-number-event';
import { BgsCombatStartEvent } from './events/bgs-combat-start-event';
import { BgsDamageDealtEvent } from './events/bgs-damage-dealth-event';
import { BgsGameEndEvent } from './events/bgs-game-end-event';
import { BgsGameSettingsEvent } from './events/bgs-game-settings-event';
import { BgsGlobalInfoUpdatedEvent } from './events/bgs-global-info-updated-event';
import { BgsHeroSelectedEvent } from './events/bgs-hero-selected-event';
import { BgsHeroSelectionEvent } from './events/bgs-hero-selection-event';
import { BgsInitMmrEvent } from './events/bgs-init-mmr-event';
import { BgsLeaderboardPlaceEvent } from './events/bgs-leaderboard-place-event';
import { BgsMatchStartEvent } from './events/bgs-match-start-event';
import { BgsNextOpponentEvent } from './events/bgs-next-opponent-event';
import { BgsOpponentRevealedEvent } from './events/bgs-opponent-revealed-event';
import { BgsPlayerBoardEvent } from './events/bgs-player-board-event';
import { BgsPostMatchStatsFilterChangeEvent } from './events/bgs-post-match-stats-filter-change-event';
import { BgsRealTimeStatsUpdatedEvent } from './events/bgs-real-time-stats-updated-event';
import { BgsReconnectStatusEvent } from './events/bgs-reconnect-status-event';
import { BgsRecruitStartEvent } from './events/bgs-recruit-start-event';
import { BgsRewardGainedEvent } from './events/bgs-reward-gained-event';
import { BgsRewardRevealedEvent } from './events/bgs-reward-revealed-event';
import { BgsSelectBattleEvent } from './events/bgs-select-battle-event';
import { BgsShowPostMatchStatsEvent } from './events/bgs-show-post-match-stats-event';
import { BgsSpectatingEvent } from './events/bgs-spectating-event';
import { BgsStageChangeEvent } from './events/bgs-stage-change-event';
import { BgsStartComputingPostMatchStatsEvent } from './events/bgs-start-computing-post-match-stats-event';
import { BgsTavernUpgradeEvent } from './events/bgs-tavern-upgrade-event';
import { BgsToggleOverlayWindowEvent } from './events/bgs-toggle-overlay-window-event';
import { BgsTripleCreatedEvent } from './events/bgs-triple-created-event';
import { BgsTurnStartEvent } from './events/bgs-turn-start-event';
import { NoBgsMatchEvent } from './events/no-bgs-match-event';
import { BattlegroundsOverlay } from './overlay/battlegrounds-overlay';
import { BgsMainWindowOverlay } from './overlay/bgs-main-window-overlay';
import { RealTimeStatsService } from './real-time-stats/real-time-stats.service';

@Injectable()
export class BattlegroundsStoreService {
	public state: BattlegroundsState = new BattlegroundsState();
	public battlegroundsUpdater: EventEmitter<BattlegroundsStoreEvent> = new EventEmitter<BattlegroundsStoreEvent>();

	private mainWindowState: MainWindowState;
	private stateUpdater: EventEmitter<MainWindowStoreEvent>;
	private deckState: GameState;
	private eventParsers: { [eventName: string]: readonly EventParser[] } = {};
	private battlegroundsStoreEventBus = new BehaviorSubject<BattlegroundsState>(null);
	private battlegroundsWindowsListener: EventEmitter<boolean> = new EventEmitter<boolean>();

	private processingQueue = new ProcessingQueue<BattlegroundsStoreEvent>(
		(eventQueue) => this.processQueue(eventQueue),
		50,
		'battlegrounds-queue',
	);

	private queuedEvents: { event: BattlegroundsStoreEvent; trigger: string }[] = [];
	private overlayHandlers: BattlegroundsOverlay[];
	private eventEmitters = [];
	// private memoryInterval;
	private battlegroundsHotkeyListener;
	private realTimeStatsListener: (state: RealTimeStatsState) => void;

	private duoPendingBoards: { playerBoard: PlayerBoard; opponentBoard: PlayerBoard }[] = [];
	// private teammateBoard: MemoryBgsPlayerInfo;
	// private playerBoard: PlayerBoard;
	private playerTeams: MemoryBgsTeamInfo;

	private updateOverlay$$ = new BehaviorSubject<void>(null);

	constructor(
		private gameEvents: GameEventsEmitterService,
		private allCards: CardsFacadeService,
		private events: Events,
		private simulation: BgsBattleSimulationService,
		private ow: OverwolfService,
		private prefs: PreferencesService,
		private memory: MemoryInspectionService,
		private twitch: TwitchAuthService,
		private patchesService: PatchesConfigService,
		private realTimeStats: RealTimeStatsService,
		private gameStateService: GameStateService,
		private init_BgsRunStatsService: BgsRunStatsService,
		private readonly gameEventsService: GameEvents,
		private readonly logsUploader: LogsUploaderService,
		private readonly owUtils: OwUtilsService,
		private readonly i18n: LocalizationFacadeService,
		private readonly bgsUserStatsService: BgsBestUserStatsService,
		private readonly gameStatus: GameStatusService,
		private readonly bugService: BugReportService,
		private readonly matchMemoryInfo: BgsMatchMemoryInfoService,
		private readonly metaHeroStats: BgsMetaHeroStatsService,
		private readonly metaHeroStatsDuo: BgsMetaHeroStatsDuoService,
		private readonly gameIdService: GameUniqueIdService,
		private readonly intermediateSimGuardian: BgsIntermediateResultsSimGuardianService,
		private readonly adService: AdService,
		private readonly highlighter: BgsBoardHighlighterService,
	) {
		window['battlegroundsStore'] = this.battlegroundsStoreEventBus;
		window['battlegroundsUpdater'] = this.battlegroundsUpdater;
		window['bgsHotkeyPressed'] = this.battlegroundsWindowsListener;
		window['buildBgsPlayerBoardEvent'] = (event) => this.buildBgsPlayerBoardEvent(event);
		this.init();
	}

	// TODO: I'd like to find a way to only initialize this if we actually play BG
	// But waiting until we get a "game start" event for BG is too late, and we would
	// need to buffer all the events we receive after this game start event, until we're properly
	// initialized, and replay them. Doable, but cumbersome, and will probably lead to bugs

	private async init() {
		await waitForReady(this.metaHeroStats, this.metaHeroStatsDuo);

		this.eventParsers = this.buildEventParsers();
		this.realTimeStatsListener = (state: RealTimeStatsState) => {
			this.battlegroundsUpdater.next(new BgsRealTimeStatsUpdatedEvent(state));
		};
		this.registerGameEvents();
		this.buildEventEmitters();
		this.buildOverlayHandlers();

		this.events.on(Events.REVIEW_FINALIZED).subscribe(async (event) => {
			const info: ManastormInfo = event.data[0];
			console.debug(
				'[bgs-store] Replay created, received info',
				info.type,
				this.state?.inGame,
				!!this.state?.currentGame,
			);
			// FIXME: this could be an issue if the review_finalized event takes too long to fire, as the state
			// could be already reset when it arrives
			if (info && info.type === 'new-review' && this.state?.inGame && !!this.state.currentGame) {
				const currentGame = this.state.currentGame;
				console.debug('[bgs-store] will trigger START_BGS_RUN_STATS');
				const bestBgsUserStats = await this.bgsUserStatsService.bestStats$$.getValueWithInit();
				this.events.broadcast(
					Events.START_BGS_RUN_STATS,
					info.reviewId,
					currentGame,
					bestBgsUserStats,
					info.game,
				);
			}
		});
		this.battlegroundsUpdater.subscribe((event: GameEvent | BattlegroundsStoreEvent) => {
			this.processingQueue.enqueue(event);
		});
		this.battlegroundsWindowsListener.subscribe((event: boolean) => {
			this.handleHotkeyPressed(true);
		});
		this.battlegroundsHotkeyListener = this.ow.addHotKeyPressedListener('battlegrounds', async (hotkeyResult) => {
			this.handleHotkeyPressed();
		});
		this.updateOverlay$$.pipe(auditTime(500)).subscribe(() => this.updateOverlay());
		// this.handleDisplayPreferences();
		// this.gameStatus.onGameExit(() => {
		// 	if (this.memoryInterval) {
		// 		clearInterval(this.memoryInterval);
		// 		this.memoryInterval = null;
		// 	}
		// });

		await sleep(1);
		const mainWindowStoreEmitter: BehaviorSubject<[MainWindowState, NavigationState]> =
			window['mainWindowStoreMerged'];
		mainWindowStoreEmitter.subscribe((newState) => {
			this.mainWindowState = newState[0];
		});
		this.stateUpdater = window['mainWindowStoreUpdater'];
		const deckEventBus: BehaviorSubject<any> = window['deckEventBus'];
		deckEventBus.subscribe((event) => {
			this.deckState = event?.state as GameState;
		});

		await this.prefs.isReady();
		this.prefs.preferences$$
			.pipe(
				distinctUntilChanged(
					(a, b) =>
						a.twitchAccessToken === b.twitchAccessToken &&
						a.twitchLoginName === b.twitchLoginName &&
						a.twitchUserName === b.twitchUserName,
				),
			)
			.subscribe((prefs) => {
				console.log('[bgs-store] rebuilding event emitters');
				this.buildEventEmitters();
			});
		this.prefs.preferences$$.subscribe((prefs) => {
			this.updateOverlay$$.next();
		});
		this.matchMemoryInfo.battlegroundsMemoryInfo$$
			.pipe(filter((info) => !!info))
			.subscribe((info) => this.battlegroundsUpdater.next(new BgsGlobalInfoUpdatedEvent(info)));
		this.simulation.battleInfo$$.pipe(filter((info) => !!info)).subscribe((info) => {
			this.battlegroundsUpdater.next(
				new BattlegroundsBattleSimulationEvent(
					info.battleId,
					info.result,
					info.heroCardId,
					info.intermediateResult,
				),
			);
		});
	}

	private async handleHotkeyPressed(force = false) {
		if (this.overlayHandlers) {
			await Promise.all(this.overlayHandlers.map((handler) => handler.handleHotkeyPressed(this.state, force)));
		}
	}

	private registerGameEvents() {
		this.gameEvents.allEvents.subscribe(async (gameEvent: GameEvent) => {
			return;
			const start = Date.now();
			// console.debug('[bgs-store] received game event', gameEvent.type, gameEvent);
			const prefs = await this.prefs.getPreferences();
			this.eventsThisTurn.push(gameEvent.type);
			if (gameEvent.type === GameEvent.RECONNECT_START) {
				this.duoPendingBoards = [];
				this.battlegroundsUpdater.next(new BgsReconnectStatusEvent(true));
			} else if (gameEvent.type === GameEvent.SPECTATING) {
				this.battlegroundsUpdater.next(new BgsSpectatingEvent(gameEvent.additionalData.spectating));
			} else if (gameEvent.type === GameEvent.RECONNECT_OVER) {
				this.battlegroundsUpdater.next(new BgsReconnectStatusEvent(false));
			} else if (gameEvent.type === GameEvent.BATTLEGROUNDS_HERO_SELECTION) {
				// #Duos: use stats for Duos
				const heroStats = await this.metaHeroStats.metaHeroStats$$.getValueWithInit();
				const heroStatsDuo = await this.metaHeroStatsDuo.metaHeroStats$$.getValueWithInit();
				// Order is important here, so that when the MMR is set the races are already populated
				this.battlegroundsUpdater.next(new BgsHeroSelectionEvent(gameEvent.additionalData.options));
				this.battlegroundsUpdater.next(
					new BgsInitMmrEvent(heroStats?.mmrPercentiles, heroStatsDuo?.mmrPercentiles),
				);
			} else if (gameEvent.type === GameEvent.BATTLEGROUNDS_HERO_REROLL) {
				this.battlegroundsUpdater.next(new BgsHeroRerollEvent(gameEvent.entityId, gameEvent.cardId));
			} else if (gameEvent.type === GameEvent.BATTLEGROUNDS_HERO_SELECTED) {
				this.battlegroundsUpdater.next(
					new BgsHeroSelectedEvent(
						gameEvent.cardId,
						gameEvent.localPlayer.PlayerId,
						gameEvent.additionalData,
					),
				);
				this.startMemoryReading();
			} else if (gameEvent.type === GameEvent.BATTLEGROUNDS_TRINKET_SELECTED) {
				this.battlegroundsUpdater.next(
					new BgsTrinketSelectedEvent(
						gameEvent.additionalData.heroCardId,
						gameEvent.additionalData.playerId,
						gameEvent.additionalData.trinketDbfId,
						gameEvent.additionalData.isFirstTrinket,
					),
				);
			} else if (gameEvent.type === GameEvent.GAME_START) {
				this.duoPendingBoards = [];
				this.battlegroundsUpdater.next(new BgsMatchStartEvent(this.mainWindowState, null, true));
			} else if (gameEvent.type === GameEvent.GAME_SETTINGS) {
				this.battlegroundsUpdater.next(new BgsGameSettingsEvent(gameEvent));
			} else if (gameEvent.type === GameEvent.MATCH_METADATA) {
				this.queuedEvents = [];
				if (isBattlegrounds(gameEvent.additionalData.metaData.GameType)) {
					this.battlegroundsUpdater.next(
						new BgsMatchStartEvent(this.mainWindowState, gameEvent.additionalData.spectating, false),
					);
					this.realTimeStats.addListener(this.realTimeStatsListener);
				} else {
					this.battlegroundsUpdater.next(new NoBgsMatchEvent());
				}
			} else if (gameEvent.type === GameEvent.BATTLEGROUNDS_NEXT_OPPONENT) {
				// console.debug('[bgs-store] will send next opponent', gameEvent);
				this.handleEventOnlyAfterTrigger(
					// cardID is null when repeating the same opponent
					new BgsNextOpponentEvent(
						gameEvent.additionalData.nextOpponentCardId,
						gameEvent.additionalData.nextOpponentPlayerId,
						gameEvent.additionalData.isSameOpponent,
					),
					GameEvent.TURN_START,
				);
			} else if (gameEvent.type === GameEvent.BATTLEGROUNDS_OPPONENT_REVEALED) {
				this.battlegroundsUpdater.next(
					new BgsOpponentRevealedEvent(
						gameEvent.additionalData.cardId,
						gameEvent.additionalData.playerId,
						gameEvent.additionalData.leaderboardPlace,
						gameEvent.additionalData.health,
						gameEvent.additionalData.armor,
					),
				);
			} else if (gameEvent.type === GameEvent.TURN_START) {
				this.processAllPendingEvents(gameEvent.additionalData.turnNumber);
				this.battlegroundsUpdater.next(new BgsTurnStartEvent(gameEvent.additionalData.turnNumber));
				if (this.state.currentGame && !this.state.currentGame.gameEnded) {
					setTimeout(async () => {
						const info = await this.memory.getBattlegroundsMatchWithPlayers(1);
						// We already only send the event at the beginning of the turn
						this.battlegroundsUpdater.next(new BgsGlobalInfoUpdatedEvent(info));
					});
				}
			} else if (gameEvent.type === GameEvent.BATTLEGROUNDS_COMBAT_START) {
				this.battlegroundsUpdater.next(new BgsCombatStartEvent());
			} else if (gameEvent.type === GameEvent.BATTLEGROUNDS_RECRUIT_PHASE) {
				this.battlegroundsUpdater.next(new BgsRecruitStartEvent());
			} else if (gameEvent.type === GameEvent.BATTLEGROUNDS_TAVERN_UPGRADE) {
				this.battlegroundsUpdater.next(
					new BgsTavernUpgradeEvent(
						gameEvent.additionalData.cardId,
						gameEvent.additionalData.playerId,
						gameEvent.additionalData.tavernLevel,
					),
				);
			} else if (gameEvent.type === GameEvent.BATTLEGROUNDS_BUDDY_GAINED) {
				this.battlegroundsUpdater.next(
					new BgsBuddyGainedEvent(
						gameEvent.additionalData.cardId,
						gameEvent.additionalData.playerId,
						gameEvent.additionalData.totalBuddies,
					),
				);
			} else if (gameEvent.type === GameEvent.BATTLEGROUNDS_REWARD_REVEALED) {
				this.battlegroundsUpdater.next(
					new BgsRewardRevealedEvent(
						gameEvent.cardId,
						gameEvent.additionalData.playerId,
						gameEvent.additionalData.questRewardDbfId,
						gameEvent.additionalData.isHeroPowerReward,
					),
				);
			} else if (gameEvent.type === GameEvent.BATTLEGROUNDS_REWARD_GAINED) {
				this.battlegroundsUpdater.next(
					new BgsRewardGainedEvent(
						gameEvent.cardId,
						gameEvent.additionalData.playerId,
						gameEvent.additionalData.questRewardDbfId,
						gameEvent.additionalData.isHeroPowerReward,
					),
				);
			} else if (gameEvent.type === GameEvent.BATTLEGROUNDS_EXTRA_GOLD_NEXT_TURN) {
				this.battlegroundsUpdater.next(
					new BgsExtraGoldNextTurnEvent(
						gameEvent.additionalData.extraGold,
						gameEvent.additionalData.overconfidences,
						gameEvent.additionalData.boardAndEnchantments,
					),
				);
			} else if (
				gameEvent.type === GameEvent.DAMAGE &&
				gameEvent.additionalData.targets &&
				Object.keys(gameEvent.additionalData.targets).length === 1
			) {
				const targetValues = Object.values((gameEvent as DamageGameEvent).additionalData.targets);
				const playerCardId = targetValues[0].TargetCardId;
				const damage = targetValues.find((target) => target.TargetCardId === playerCardId)?.Damage;
				this.battlegroundsUpdater.next(
					new BgsDamageDealtEvent(playerCardId, targetValues[0].TargetControllerId, damage),
				);
			} else if (gameEvent.type === GameEvent.ARMOR_CHANGED) {
				this.battlegroundsUpdater.next(
					new BgsArmorChangedEvent(
						gameEvent.additionalData.cardId,
						gameEvent.additionalData.playerId,
						gameEvent.additionalData.totalArmor,
					),
				);
			} else if (gameEvent.type === GameEvent.BLOOD_GEM_BUFF_CHANGED) {
				if (gameEvent.entityId === gameEvent.localPlayer.Id) {
					this.battlegroundsUpdater.next(
						new BgsBloodGemBuffChangedEvent(
							gameEvent.additionalData.attack,
							gameEvent.additionalData.health,
						),
					);
				}
			} else if (gameEvent.type === GameEvent.BEETLE_ARMY_CHANGED) {
				if (gameEvent.controllerId === gameEvent.localPlayer.PlayerId) {
					this.battlegroundsUpdater.next(
						new BgsBeetleArmyChangedEvent(gameEvent.additionalData.attack, gameEvent.additionalData.health),
					);
				}
			} else if (gameEvent.type === GameEvent.BALLER_BUFF_CHANGED) {
				if (gameEvent.controllerId === gameEvent.localPlayer.PlayerId) {
					this.battlegroundsUpdater.next(new BgsBallerBuffChangedEvent(gameEvent.additionalData.buff));
				}
			} else if (gameEvent.type === GameEvent.TOTAL_MAGNETIZE_CHANGED) {
				if (gameEvent.controllerId === gameEvent.localPlayer.PlayerId) {
					this.battlegroundsUpdater.next(new BgsMagnetizedChangedEvent(gameEvent.additionalData.newValue));
				}
			} else if (gameEvent.type === GameEvent.BATTLEGROUNDS_ACTIVE_PLAYER_BOARD) {
				// this.teammateBoard = await this.memory.getBgsPlayerTeammateBoard();
				// this.playerBoard = gameEvent.additionalData.playerBoard;
				const playerTeams = await this.memory.getBgsPlayerBoard();
				console.debug(
					'[bgs-simulation] BATTLEGROUNDS_ACTIVE_PLAYER_BOARD snapshot player board',
					// gameEvent.additionalData.playerBoard.board,
					gameEvent,
					playerTeams,
				);
				if (
					playerTeams?.Teammate?.Hero?.CardId &&
					playerTeams.Teammate.Hero.CardId !== playerTeams.Player.Hero.CardId
				) {
					console.debug('player teams from memory', playerTeams);
					this.playerTeams = playerTeams;
				}
			} else if (gameEvent.type === GameEvent.BATTLEGROUNDS_DUO_FUTURE_TEAMMATE_BOARD) {
				const newBoard = {
					playerBoard: {
						heroCardId: gameEvent.additionalData.playerBoard.cardId,
						playerId: gameEvent.additionalData.playerBoard.playerId,
						board: gameEvent.additionalData.playerBoard.board,
						secrets: gameEvent.additionalData.playerBoard.secrets,
						trinkets: gameEvent.additionalData.playerBoard.trinkets,
						hand: gameEvent.additionalData.playerBoard.hand,
						hero: gameEvent.additionalData.playerBoard.hero,
						heroPowers: gameEvent.additionalData.playerBoard.heroPowers,
						questRewards: gameEvent.additionalData.playerBoard.questRewards,
						questRewardEntities: gameEvent.additionalData.playerBoard.questRewardEntities,
						questEntities: gameEvent.additionalData.playerBoard.questEntities,
						globalInfo: gameEvent.additionalData.playerBoard.globalInfo,
					},
					opponentBoard: {
						heroCardId: gameEvent.additionalData.opponentBoard.cardId,
						playerId: gameEvent.additionalData.opponentBoard.playerId,
						board: gameEvent.additionalData.opponentBoard.board,
						secrets: gameEvent.additionalData.opponentBoard.secrets,
						trinkets: gameEvent.additionalData.opponentBoard.trinkets,
						hand: gameEvent.additionalData.opponentBoard.hand,
						hero: gameEvent.additionalData.opponentBoard.hero,
						heroPowers: gameEvent.additionalData.opponentBoard.heroPowers,
						questRewards: gameEvent.additionalData.opponentBoard.questRewards,
						questRewardEntities: gameEvent.additionalData.opponentBoard.questRewardEntities,
						questEntities: gameEvent.additionalData.opponentBoard.questEntities,
						globalInfo: gameEvent.additionalData.opponentBoard.globalInfo,
					},
				};
				console.debug('[bgs-simulation] BATTLEGROUNDS_DUO_FUTURE_TEAMMATE_BOARD', gameEvent, newBoard);
				this.duoPendingBoards.push(newBoard);
			} else if (gameEvent.type === GameEvent.BATTLEGROUNDS_PLAYER_BOARD) {
				const boardEvent = this.buildBgsPlayerBoardEvent(gameEvent);
				this.handleEventOnlyAfterTrigger(boardEvent, GameEvent.BATTLEGROUNDS_COMBAT_START);
				this.duoPendingBoards = [];
			} else if (gameEvent.type === GameEvent.BATTLEGROUNDS_BATTLE_RESULT) {
				// Sometimes the battle result arrives before the simulation is completed
				// This can typically happen in reconnection scenarios, and in this case we
				// ignore it (while it's true that properly supporting it in reco cases would
				// be good, there might be too many changes required to achieve this at a reasonable
				// cost)
				if (
					!this.state.reconnectOngoing &&
					!this.gameEventsService.isCatchingUpLogLines() &&
					prefs.bgsEnableSimulation
				) {
				}
				this.battlegroundsUpdater.next(
					new BgsBattleResultEvent(
						gameEvent.additionalData.opponent,
						gameEvent.additionalData.opponentPlayerId,
						gameEvent.additionalData.result,
						gameEvent.additionalData.damage,
					),
				);
			} else if (gameEvent.type === GameEvent.BATTLEGROUNDS_TRIPLE) {
				this.battlegroundsUpdater.next(
					new BgsTripleCreatedEvent(gameEvent.cardId, gameEvent.additionalData.playerId),
				);
			} else if (gameEvent.type === GameEvent.CARD_PLAYED) {
				this.battlegroundsUpdater.next(new BgsCardPlayedEvent(gameEvent));
			} else if (
				gameEvent.type === GameEvent.GAME_END ||
				(gameEvent.type === GameEvent.SPECTATING && !gameEvent.additionalData.spectating)
			) {
				this.duoPendingBoards = [];
				this.matchMemoryInfo.stopMemoryReading();
				// if (this.memoryInterval) {
				// 	clearInterval(this.memoryInterval);
				// 	this.memoryInterval = null;
				// }
				this.battlegroundsUpdater.next(new BgsStartComputingPostMatchStatsEvent());
			} else if (gameEvent.type === GameEvent.BATTLEGROUNDS_LEADERBOARD_PLACE) {
				this.battlegroundsUpdater.next(
					new BgsLeaderboardPlaceEvent(
						gameEvent.additionalData.cardId,
						gameEvent.additionalData.playerId,
						gameEvent.additionalData.leaderboardPlace,
					),
				);
			}
			console.debug('[bgs-store] processed game event', gameEvent.type, Date.now() - start, 'ms');
			if (Date.now() - start > 1000) {
				console.warn(
					'[bgs-store] processing game event took too long',
					gameEvent.type,
					Date.now() - start,
					'ms',
				);
			}
			this.processPendingEvents(gameEvent);
		});
	}

	private async startMemoryReading() {
		this.matchMemoryInfo.startMemoryReading();
	}

	private async processQueue(eventQueue: readonly BattlegroundsStoreEvent[]) {
		let processedQueue = eventQueue;
		while (processedQueue.length > 0) {
			const gameEvent = processedQueue[0];
			try {
				await this.processEvent(gameEvent);
			} catch (e) {
				console.error('[bgs-store] Exception while processing event', e);
			}
			processedQueue = processedQueue.slice(1);
		}
		return processedQueue;
	}

	private processPendingEvents(gameEvent: BattlegroundsStoreEvent) {
		const start = Date.now();
		const eventsToProcess = this.queuedEvents.filter((event) => event.trigger === gameEvent.type);
		this.queuedEvents = this.queuedEvents.filter((event) => event.trigger !== gameEvent.type);
		for (const event of eventsToProcess) {
			this.battlegroundsUpdater.next(event.event);
		}
		console.debug('[bgs-store] processed pending events', gameEvent.type, Date.now() - start, 'ms');
	}

	private processAllPendingEvents(turnNumber: number) {
		for (const event of this.queuedEvents) {
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
			this.queuedEvents.push({ event: gameEvent, trigger: nextTrigger });
		}
	}

	private async processEvent(gameEvent: BattlegroundsStoreEvent) {
		const start = Date.now();
		// console.debug('[bgs-store] processing event', gameEvent.type, gameEvent);
		await Promise.all(this.overlayHandlers.map((handler) => handler.processEvent(gameEvent)));
		if (gameEvent.type === 'BgsCloseWindowEvent') {
			this.state = this.state.update({
				forceOpen: false,
			} as BattlegroundsState);
			this.updateOverlay$$.next();
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
		const parsers = this.eventParsers[gameEvent.type];
		for (const parser of parsers ?? []) {
			try {
				if (parser.applies(gameEvent, newState)) {
					newState = (await parser.parse(newState, gameEvent, this.deckState)) ?? newState;
				}
			} catch (e) {
				console.error('[bgs-store] Exception while applying parser', gameEvent.type, gameEvent, e.message, e);
			}
		}
		if (newState !== this.state) {
			this.state = newState;
			// console.debug(
			// 	'[bgs-store] emitting new state',
			// 	gameEvent.type,
			// 	JSON.stringify(
			// 		this.state.currentGame?.players?.map((p) => ({
			// 			name: this.allCards.getCard(p.cardId).name,
			// 			playerId: p.playerId,
			// 		})),
			// 	),
			// 	this.state.currentGame?.players?.map((p) => ({
			// 		name: this.allCards.getCard(p.cardId).name,
			// 		playerId: p.playerId,
			// 	})),
			// 	gameEvent,
			// 	this.state,
			// );
			this.eventEmitters.forEach((emitter) => emitter(this.state));
			this.updateOverlay$$.next();
		}
		console.debug('[bgs-store] processed event', gameEvent.type, Date.now() - start, 'ms');
		if (Date.now() - start > 1000) {
			console.warn('[bgs-store] processing event took too long', gameEvent.type, Date.now() - start, 'ms');
		}
	}

	private async buildEventEmitters() {
		const result = [(state) => this.battlegroundsStoreEventBus.next(state)];
		const prefs = await this.prefs.getPreferences();
		if (prefs.twitchAccessToken) {
			const isTokenValid = await this.twitch.validateToken(prefs.twitchAccessToken);
			if (!isTokenValid) {
				console.log('Twitch token is not valid BGS, removing it');
				this.prefs.setTwitchAccessToken(undefined);
				// Don't send the notif, as it's already sent by game-state.service
				// await this.twitch.sendExpiredTwitchTokenNotification();
			} else {
				result.push((state) => this.twitch.emitBattlegroundsEvent(state));
			}
		}
		this.eventEmitters = []; //result;
	}

	private async updateOverlay() {
		if (this.overlayHandlers?.length) {
			const start = Date.now();
			await Promise.all(this.overlayHandlers.map((handler) => handler.updateOverlay(this.state)));
			// console.debug('[bgs-store] overlay updated in', Date.now() - start, 'ms');
		}
		if (this.state.forceOpen) {
			this.state = this.state.update({ forceOpen: false } as BattlegroundsState);
		}
	}

	private buildEventParsers(): { [eventName: string]: readonly EventParser[] } {
		return {
			[NoBgsMatchEvent.eventName]: [new NoBgsMatchParser()],
			[BgsMatchStartEvent.eventName]: [
				new BgsMatchStartParser(this.prefs, this.gameStateService, this.i18n, this.highlighter),
			],
			[BgsGameSettingsEvent.eventName]: [new BgsGameSettingsParser(this.allCards)],
			[BgsHeroSelectionEvent.eventName]: [
				new BgsHeroSelectionParser(this.memory, this.owUtils, this.prefs, this.i18n),
			],
			[BgsHeroSelectedEvent.eventName]: [new BgsHeroSelectedParser(this.allCards, this.i18n)],
			[BgsHeroRerollEvent.eventName]: [new BgsHeroRerollParser(this.allCards, this.i18n)],
			[BgsNextOpponentEvent.eventName]: [new BgsNextOpponentParser(this.i18n, this.allCards)],
			[BgsTavernUpgradeEvent.eventName]: [new BgsTavernUpgradeParser(this.gameEventsService, this.allCards)],
			[BgsBuddyGainedEvent.eventName]: [new BgsBuddyGainedParser(this.gameEventsService, this.allCards)],
			[BgsRewardRevealedEvent.eventName]: [new BgsRewardRevealedParser(this.allCards)],
			[BgsRewardGainedEvent.eventName]: [new BgsRewardGainedParser(this.allCards)],
			[BgsExtraGoldNextTurnEvent.eventName]: [new BgsExtraGoldNextTurnParser(this.allCards)],
			[BgsPlayerBoardEvent.eventName]: [
				new BgsPlayerBoardParser(
					this.simulation,
					this.logsUploader,
					this.gameEventsService,
					this.allCards,
					this.memory,
					this.gameIdService,
					this.prefs,
					this.intermediateSimGuardian,
					this.adService,
				),
			],
			[BgsTripleCreatedEvent.eventName]: [new BgsTripleCreatedParser(this.allCards)],
			[BgsTrinketSelectedEvent.eventName]: [new BgsTrinketSelectedParser(this.allCards)],
			[BgsOpponentRevealedEvent.eventName]: [new BgsOpponentRevealedParser(this.allCards)],
			[BgsTurnStartEvent.eventName]: [new BgsTurnStartParser(this.logsUploader, this.i18n)],
			[BgsGameEndEvent.eventName]: [new BgsGameEndParser(this.prefs, this.i18n, this.highlighter)],
			[BgsStageChangeEvent.eventName]: [new BgsStageChangeParser()],
			[BgsBattleResultEvent.eventName]: [
				new BgsBattleResultParser(this.events, this.allCards, this.gameEventsService, this.bugService),
			],
			[BgsArmorChangedEvent.eventName]: [new BgsArmorChangedParser(this.allCards)],
			[BgsBloodGemBuffChangedEvent.eventName]: [new BgsBloodGemBuffChangedParser()],
			[BgsBeetleArmyChangedEvent.eventName]: [new BgsBeetleArmyChangedParser()],
			[BgsBallerBuffChangedEvent.eventName]: [new BgsBallerBuffChangedParser()],
			[BgsMagnetizedChangedEvent.eventName]: [new BgsMagnetizedChangedParser()],
			[BattlegroundsBattleSimulationEvent.eventName]: [new BgsBattleSimulationParser(this.allCards)],
			[BgsPostMatchStatsFilterChangeEvent.eventName]: [new BgsPostMatchStatsFilterChangeParser(this.prefs)],
			[BgsChangePostMatchStatsTabsNumberEvent.eventName]: [
				new BgsChangePostMatchStatsTabsNumberParser(this.prefs),
			],
			[BgsLeaderboardPlaceEvent.eventName]: [new BgsLeaderboardPlaceParser(this.allCards)],
			[BgsCombatStartEvent.eventName]: [new BgsCombatStartParser()],
			[BgsRecruitStartEvent.eventName]: [new BgsRecruitStartParser(this.owUtils, this.prefs)],
			[BgsGlobalInfoUpdatedEvent.eventName]: [new BgsGlobalInfoUpdatedParser(this.allCards)],
			[BgsStartComputingPostMatchStatsEvent.eventName]: [new BgsStartComputingPostMatchStatsParser()],
			[BgsInitMmrEvent.eventName]: [
				new BgsInitMmrParser(this.memory, this.gameStateService, this.prefs, () => this.stateUpdater),
			],
			[BgsCardPlayedEvent.eventName]: [new BgsCardPlayedParser()],
			[BgsReconnectStatusEvent.eventName]: [new BgsReconnectStatusParser()],
			[BgsSpectatingEvent.eventName]: [new BgsSpectatingParser()],
			[BgsSelectBattleEvent.eventName]: [new BgsSelectBattleParser()],
			[BgsBattleSimulationUpdateEvent.eventName]: [new BgsBattleSimulationUpdateParser()],
			[BgsBattleSimulationResetEvent.eventName]: [new BgsBattleSimulationResetParser()],
			[BgsRealTimeStatsUpdatedEvent.eventName]: [new BgsRealTimeStatsUpdatedParser(this.i18n)],
			[BgsShowPostMatchStatsEvent.eventName]: [new BgsShowPostMatchStatsParser()],
		};
	}

	private buildOverlayHandlers() {
		this.overlayHandlers = [new BgsMainWindowOverlay(this.prefs, this.ow)];
	}

	private buildBgsPlayerBoardEvent(gameEvent: GameEvent): BgsPlayerBoardEvent {
		return new BgsPlayerBoardEvent(
			{
				heroCardId: gameEvent.additionalData.playerBoard.cardId,
				playerId: gameEvent.additionalData.playerBoard.playerId,
				board: gameEvent.additionalData.playerBoard.board,
				secrets: gameEvent.additionalData.playerBoard.secrets,
				trinkets: gameEvent.additionalData.playerBoard.trinkets,
				hand: gameEvent.additionalData.playerBoard.hand,
				hero: gameEvent.additionalData.playerBoard.hero,
				heroPowers: gameEvent.additionalData.playerBoard.heroPowers.map((heroPower) => ({
					cardId: heroPower.cardId,
					entityId: heroPower.entityId,
					used: heroPower.used,
					info: heroPower.info,
					info2: heroPower.info2,
				})),
				questRewards: gameEvent.additionalData.playerBoard.questRewards,
				questRewardEntities: gameEvent.additionalData.playerBoard.questRewardEntities,
				questEntities: gameEvent.additionalData.playerBoard.questEntities,
				globalInfo: gameEvent.additionalData.playerBoard.globalInfo,
			},
			{
				heroCardId: gameEvent.additionalData.opponentBoard.cardId,
				playerId: gameEvent.additionalData.opponentBoard.playerId,
				board: gameEvent.additionalData.opponentBoard.board,
				secrets: gameEvent.additionalData.opponentBoard.secrets,
				trinkets: gameEvent.additionalData.opponentBoard.trinkets,
				hand: gameEvent.additionalData.opponentBoard.hand,
				hero: gameEvent.additionalData.opponentBoard.hero,
				heroPowers: gameEvent.additionalData.opponentBoard.heroPowers.map((heroPower) => ({
					cardId: heroPower.cardId,
					entityId: heroPower.entityId,
					used: heroPower.used,
					info: heroPower.info,
					info2: heroPower.info2,
				})),
				questRewards: gameEvent.additionalData.opponentBoard.questRewards,
				questRewardEntities: gameEvent.additionalData.opponentBoard.questRewardEntities,
				questEntities: gameEvent.additionalData.opponentBoard.questEntities,
				globalInfo: gameEvent.additionalData.opponentBoard.globalInfo,
			},
			// this.playerBoard,
			// this.teammateBoard,
			this.duoPendingBoards,
			this.playerTeams,
		);
	}
}
