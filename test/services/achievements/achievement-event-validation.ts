import { NGXLogger, NGXLoggerMock } from 'ngx-logger';
import { RawAchievement } from '../../../src/js/models/achievement/raw-achievement';
import { CompletedAchievement } from '../../../src/js/models/completed-achievement';
import { GameStats } from '../../../src/js/models/mainwindow/stats/game-stats';
import { PlayerInfo } from '../../../src/js/models/player-info.js';
import { AchievementsLocalStorageService } from '../../../src/js/services/achievement/achievements-local-storage.service.js';
import { AchievementsMonitor } from '../../../src/js/services/achievement/achievements-monitor.service';
import { ChallengeBuilderService } from '../../../src/js/services/achievement/achievements/challenges/challenge-builder.service';
import { AchievementsLoaderService } from '../../../src/js/services/achievement/data/achievements-loader.service';
import { RemoteAchievementsService } from '../../../src/js/services/achievement/remote-achievements.service.js';
import { AllCardsService } from '../../../src/js/services/all-cards.service';
import { DeckParserService } from '../../../src/js/services/decktracker/deck-parser.service';
import { GameStateService } from '../../../src/js/services/decktracker/game-state.service';
import { Events } from '../../../src/js/services/events.service';
import { GameEventsEmitterService } from '../../../src/js/services/game-events-emitter.service';
import { GameEvents } from '../../../src/js/services/game-events.service';
import { AchievementCompletedEvent } from '../../../src/js/services/mainwindow/store/events/achievements/achievement-completed-event';
import { RecomputeGameStatsEvent } from '../../../src/js/services/mainwindow/store/events/stats/recompute-game-stats-event';
import { MainWindowStoreService } from '../../../src/js/services/mainwindow/store/main-window-store.service';
import { GameParserService } from '../../../src/js/services/manastorm-bridge/game-parser.service';
import { PlayersInfoService } from '../../../src/js/services/players-info.service';
import { GameEventsPluginService } from '../../../src/js/services/plugins/game-events-plugin.service';
import { MemoryInspectionService } from '../../../src/js/services/plugins/memory-inspection.service';
import { PreferencesService } from '../../../src/js/services/preferences.service.js';
import { GameStatsLoaderService } from '../../../src/js/services/stats/game/game-stats-loader.service';
import { GameStatsUpdaterService } from '../../../src/js/services/stats/game/game-stats-updater.service';
import cardsJson from '../../cards.json';

export const achievementsValidation = async (
	rawAchievements: RawAchievement[],
	pluginEvents,
	additionalEvents?: readonly { key: string; value: any }[],
	collaborators?: {
		gameStats?: GameStats;
		deckstring?: string;
		playerRank?: number;
	},
) => {
	const cards = buildCardsService();
	const memoryService: MemoryInspectionService = {
		getPlayerInfo: () => {
			return new Promise<any>(resolve => {
				resolve(
					collaborators && collaborators.playerRank
						? {
								localPlayer: {
									standardRank: collaborators.playerRank,
								} as PlayerInfo,
								opponent: {} as PlayerInfo,
						  }
						: {
								localPlayer: {} as PlayerInfo,
								opponent: {} as PlayerInfo,
						  },
				);
			});
		},
		getBattlegroundsInfo: () => {
			return new Promise<any>(resolve => {
				resolve({});
			});
		},
	} as MemoryInspectionService;
	const challengeBuilder = new ChallengeBuilderService(cards, memoryService);
	const loader = new AchievementsLoaderService(null, challengeBuilder);
	await loader.initializeAchievements(rawAchievements);
	if (loader.challengeModules.length !== 1) {
		throw new Error('Can only handle single achievements for now');
	}
	// Don't reset achievements
	loader.challengeModules.forEach(challenge => (challenge['resetState'] = () => {}));
	// Setup events
	const events = new Events();
	const mockPlugin: GameEventsPluginService = {
		get: () => {
			return new Promise<any>(resolve => {
				resolve();
			});
		},
	} as GameEventsPluginService;
	const emitter = new GameEventsEmitterService();
	const playersInfoService = new PlayersInfoService(events, memoryService);
	const deckService = new DeckParserService(emitter, null);
	deckService.currentDeck.deckstring = collaborators ? collaborators.deckstring : undefined;
	deckService.decodeDeckString();
	deckService['reset'] = () => {};
	const prefs = {
		getPreferences: () => {
			return {};
		},
	} as PreferencesService;
	// console.debug('built current deck', deckService);
	const gameEventsService = new GameEvents(
		mockPlugin,
		null,
		null,
		events,
		playersInfoService,
		emitter,
		deckService,
		prefs,
	);
	// Setup achievement monitor, that will check for completion
	let isAchievementComplete = false;
	const store: MainWindowStoreService = {
		stateUpdater: {
			next: data => {
				if (data instanceof AchievementCompletedEvent) {
					// console.debug('achievemnt completed event', data);
					isAchievementComplete = true;
				} else if (data instanceof RecomputeGameStatsEvent && collaborators && collaborators.gameStats) {
					// This will send an event to be processed by the requirements
					// eslint-disable-next-line @typescript-eslint/no-use-before-define
					console.debug('broadcasting stats', collaborators.gameStats);
					events.broadcast(Events.GAME_STATS_UPDATED, collaborators.gameStats);
					// statsUpdater.recomputeGameStats(collaborators.gameStats, 'fakeReviewId');
				}
			},
		} as any,
	} as MainWindowStoreService;
	const gameState = {
		getCurrentReviewId: async () => {
			return '';
		},
	} as GameStateService;
	const statsLoader = {
		retrieveStats: async () => {
			return new GameStats();
		},
	} as GameStatsLoaderService;
	const statsUpdater = new GameStatsUpdaterService(
		emitter,
		events,
		null,
		new GameParserService(null, null),
		deckService,
		playersInfoService,
		new NGXLoggerMock() as NGXLogger,
		gameState,
		statsLoader,
	);
	statsUpdater.stateUpdater = store.stateUpdater;
	const storage: AchievementsLocalStorageService = {
		loadAchievementFromCache: async (achievementId: string) => {
			return null;
		},
		cacheAchievement: async (achievement: CompletedAchievement) => {
			return null;
		},
	} as AchievementsLocalStorageService;
	const achievementStats = {
		publishRemoteAchievement: async achievement => {},
	} as RemoteAchievementsService;

	// Launch the monitoring
	new AchievementsMonitor(
		emitter,
		loader,
		events,
		new NGXLoggerMock() as NGXLogger,
		store,
		achievementStats,
		storage,
	);

	// So that it has time to register all the events first
	await sleep(1400);

	if (additionalEvents) {
		additionalEvents.forEach(event => events.broadcast(event.key, event.value));
	}

	// wait for a short while, so that all events are processed.
	// The processing queue is configured with a 1s delay, se we need to wait for a long time
	await sleep(1000);

	pluginEvents.forEach(gameEvent => gameEventsService.dispatchGameEvent(gameEvent));

	await sleep(2000);

	if (collaborators && collaborators.gameStats) {
		// console.debug('broadcasting stats', collaborators.gameStats);
		events.broadcast(Events.GAME_STATS_UPDATED, collaborators.gameStats);
	}

	await sleep(2000);

	// if (!isAchievementComplete) {
	// 	loader.challengeModules.forEach((challenge: GenericChallenge) => {
	// 		challenge.requirements.forEach(req => {
	// 			if (!req.isCompleted()) {
	// 				console.debug('req not completed', Object.assign(req, { cards: undefined }));
	// 			}
	// 		});
	// 	});
	// }

	return isAchievementComplete;
};

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

function buildCardsService() {
	const service = new AllCardsService(null, null);
	service['allCards'] = [...(cardsJson as any[])];
	return service;
}
