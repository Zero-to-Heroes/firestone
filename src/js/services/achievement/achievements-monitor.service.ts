import { Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { Achievement } from '../../models/achievement';
import { CompletedAchievement } from '../../models/completed-achievement';
import { GameEvent } from '../../models/game-event';
import { Events } from '../events.service';
import { GameEventsEmitterService } from '../game-events-emitter.service';
import { AchievementCompletedEvent } from '../mainwindow/store/events/achievements/achievement-completed-event';
import { MainWindowStoreService } from '../mainwindow/store/main-window-store.service';
import { ProcessingQueue } from '../processing-queue.service';
import { AchievementsLocalStorageService } from './achievements-local-storage.service';
import { Challenge } from './achievements/challenges/challenge';
import { AchievementsLoaderService } from './data/achievements-loader.service';
import { RemoteAchievementsService } from './remote-achievements.service';

@Injectable()
export class AchievementsMonitor {
	private processingQueue = new ProcessingQueue<InternalEvent>(
		eventQueue => this.processQueue(eventQueue),
		1000,
		'achievement-monitor',
	);
	private lastReceivedTimestamp;

	constructor(
		private gameEvents: GameEventsEmitterService,
		private achievementLoader: AchievementsLoaderService,
		private events: Events,
		private logger: NGXLogger,
		private store: MainWindowStoreService,
		private achievementStats: RemoteAchievementsService,
		private achievementsStorage: AchievementsLocalStorageService,
	) {
		this.lastReceivedTimestamp = Date.now();
		this.gameEvents.allEvents.subscribe((gameEvent: GameEvent) => {
			this.handleEvent(gameEvent);
		});
	}

	private async handleEvent(gameEvent: GameEvent) {
		for (const challenge of await this.achievementLoader.getChallengeModules()) {
			challenge.detect(gameEvent, () => {
				this.sendUnlockEvent(challenge);
			});
		}
	}

	private async sendUnlockEvent(challenge: Challenge) {
		// console.log('[achievement-monitor] starting process of completed achievement', challenge);
		const existingAchievement: CompletedAchievement =
			(await this.achievementsStorage.loadAchievementFromCache(challenge.achievementId)) ||
			challenge.defaultAchievement();
		// console.log('[achievement-monitor] loaded existing completed achievement', existingAchievement);
		const completedAchievement = new CompletedAchievement(
			existingAchievement.id,
			existingAchievement.numberOfCompletions + 1,
			existingAchievement.replayInfo || [],
		);
		const achievement: Achievement = await this.achievementLoader.getAchievement(completedAchievement.id);
		if (achievement.canBeCompletedOnlyOnce && existingAchievement.numberOfCompletions >= 1) {
			// console.log('[achievement-monitor] achievement can be completed only once', completedAchievement.id);
			return;
		}
		console.log('[achievement-monitor] starting process of completed achievement', challenge.achievementId);
		const mergedAchievement = Object.assign(new Achievement(), achievement, {
			numberOfCompletions: completedAchievement.numberOfCompletions,
			replayInfo: completedAchievement.replayInfo,
		} as Achievement);

		this.achievementStats.publishRemoteAchievement(mergedAchievement);
		await this.achievementsStorage.cacheAchievement(completedAchievement);
		// console.log('[achievement-monitor] broadcasting event completion event', mergedAchievement);
		// this.events.broadcast(Events.ACHIEVEMENT_UNLOCKED, mergedAchievement, challenge);

		this.enqueue({ achievement: mergedAchievement, challenge: challenge } as InternalEvent);
	}

	private enqueue(event: InternalEvent) {
		this.lastReceivedTimestamp = Date.now();
		this.processingQueue.enqueue(event);
	}

	private async processQueue(eventQueue: readonly InternalEvent[]): Promise<readonly InternalEvent[]> {
		// Don't process an event if we've just received one, as it could indicate that other
		// related events will come soon as well
		if (Date.now() - this.lastReceivedTimestamp < 500) {
			// this.logger.debug('[achievements-monitor] too soon, waiting before processing');
			return eventQueue;
		}
		const candidate: InternalEvent = eventQueue[0];
		// this.logger.debug('[achievements-monitor] found a candidate', candidate);
		// Is there a better candidate?
		const betterCandidate: InternalEvent = eventQueue
			.filter(event => event.achievement.type === candidate.achievement.type)
			.sort((a, b) => b.achievement.priority - a.achievement.priority)[0];
		// this.logger.debug(
		// 	'[achievements-monitor] emitted achievement completed event',
		// 	betterCandidate,
		// 	betterCandidate.achievement.id,
		// );
		this.events.broadcast(Events.ACHIEVEMENT_COMPLETE, betterCandidate.achievement, betterCandidate.challenge);
		// console.debug('found and broadcast achievemtn comleted');
		this.store.stateUpdater.next(new AchievementCompletedEvent(betterCandidate.achievement));

		// Now remove all the related events
		return eventQueue.filter(event => event.achievement.type !== betterCandidate.achievement.type);
	}
}

interface InternalEvent {
	readonly achievement: Achievement;
	readonly challenge: Challenge;
}
