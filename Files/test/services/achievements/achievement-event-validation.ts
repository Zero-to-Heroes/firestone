import { RawAchievement } from '../../../src/js/models/achievement/raw-achievement';
import { AchievementsMonitor } from '../../../src/js/services/achievement/achievements-monitor.service';
import { ChallengeBuilderService } from '../../../src/js/services/achievement/achievements/challenges/challenge-builder.service';
import { AchievementsLoaderService } from '../../../src/js/services/achievement/data/achievements-loader.service';
import { Events } from '../../../src/js/services/events.service';
import { GameEvents } from '../../../src/js/services/game-events.service';
import { AchievementCompletedEvent } from '../../../src/js/services/mainwindow/store/events/achievements/achievement-completed-event';
import { MainWindowStoreService } from '../../../src/js/services/mainwindow/store/main-window-store.service';
import { PlayersInfoService } from '../../../src/js/services/players-info.service';
import { GameEventsPluginService } from '../../../src/js/services/plugins/game-events-plugin.service';

export const achievementsValidation = async (
	rawAchievements: RawAchievement[],
	pluginEvents,
	additionalEvents?: readonly { key: string; value: any }[],
) => {
	const challengeBuilder = new ChallengeBuilderService();
	const loader = new AchievementsLoaderService(challengeBuilder);
	await loader.initializeAchievements(rawAchievements);
	if (loader.challengeModules.length !== 1) {
		throw new Error('Can only handle single achievements for now');
	}
	// Setup events
	const events = new Events();
	const mockPlugin: GameEventsPluginService = {
		get: () => {
			return new Promise<any>(() => {});
		},
	} as GameEventsPluginService;
	const playersInfoService = new PlayersInfoService(events);
	const gameEventsService = new GameEvents(mockPlugin, null, null, events, playersInfoService);
	// Setup achievement monitor, that will check for completion
	let isAchievementComplete = false;
	const store: MainWindowStoreService = {
		stateUpdater: {
			next: data => {
				if (data instanceof AchievementCompletedEvent) {
					isAchievementComplete = true;
				}
			},
		} as any,
	} as MainWindowStoreService;
	new AchievementsMonitor(gameEventsService, null, null, null, loader, store, events);

	if (additionalEvents) {
		additionalEvents.forEach(event => events.broadcast(event.key, event.value));
	}

	pluginEvents.forEach(gameEvent => gameEventsService.dispatchGameEvent(gameEvent));

	// loader.challengeModules.forEach((challenge: GenericChallenge) => {
	// 	challenge.requirements.forEach(req => {
	// 		console.debug('is req completed?', req, req.isCompleted());
	// 	});
	// });

	return isAchievementComplete;
};
