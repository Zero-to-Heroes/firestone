import { Injectable } from '@angular/core';
import { Achievement } from '../../models/achievement';
import { CompletedAchievement } from '../../models/completed-achievement';
import { GameEvent } from '../../models/game-event';
import { Events } from '../events.service';
import { GameEventsEmitterService } from '../game-events-emitter.service';
import { AchievementCompletedEvent } from '../mainwindow/store/events/achievements/achievement-completed-event';
import { PreferencesService } from '../preferences.service';
import { ProcessingQueue } from '../processing-queue.service';
import { AppUiStoreFacadeService } from '../ui-store/app-ui-store-facade.service';
import { AchievementsStorageService } from './achievements-storage.service';
import { Challenge } from './achievements/challenges/challenge';
import { AchievementsLoaderService } from './data/achievements-loader.service';
import { RemoteAchievementsService } from './remote-achievements.service';

@Injectable()
// Everything linked to Firestone challenges, as opposed to HS native achievements
export class AchievementsFirestoneChallengeService {
	private spectating: boolean;

	private processingQueue = new ProcessingQueue<InternalEvent>(
		(eventQueue) => this.processQueue(eventQueue),
		1000,
		'achievement-monitor',
	);

	constructor(
		private readonly gameEvents: GameEventsEmitterService,
		private readonly prefs: PreferencesService,
		private readonly achievementLoader: AchievementsLoaderService,
		private readonly achievementsStorage: AchievementsStorageService,
		private readonly remoteAchievements: RemoteAchievementsService,
		private readonly events: Events,
		private readonly store: AppUiStoreFacadeService,
	) {
		this.init();
	}

	private async init() {
		await this.store.initComplete();

		this.gameEvents.allEvents.subscribe((gameEvent: GameEvent) => {
			this.handleEvent(gameEvent);
			if (gameEvent.type === GameEvent.SPECTATING) {
				this.spectating = gameEvent.additionalData.spectating;
			}
		});
	}

	public async handleEvent(gameEvent: GameEvent) {
		const prefs = await this.prefs.getPreferences();
		if (this.spectating || !prefs.achievementsEnabled2) {
			return;
		}

		// TODO: handle reconnects
		for (const challenge of await this.achievementLoader.getChallengeModules()) {
			try {
				challenge.detect(gameEvent, () => {
					this.sendUnlockEvent(challenge);
				});
			} catch (e) {
				console.error('Exception while trying to handle challenge', challenge.achievementId, e);
			}
		}
	}

	private async sendUnlockEvent(challenge: Challenge) {
		const achievement: Achievement = await this.achievementLoader.getAchievement(challenge.achievementId);
		if (!achievement) {
			console.warn('trying to send unlock event for empty achievement', challenge.achievementId);
			return;
		}

		await this.sendUnlockEventFromAchievement(achievement);
	}

	private async sendUnlockEventFromAchievement(achievement: Achievement) {
		if (!achievement) {
			console.warn('trying to send unlock event for empty achievement');
			return;
		}

		const autoGrantAchievements = await this.achievementLoader.getAchievementsById(
			achievement.linkedAchievementIds,
		);
		const allAchievements =
			autoGrantAchievements.length > 0 ? [achievement, ...autoGrantAchievements] : [achievement];

		for (const achv of allAchievements) {
			const existingAchievement: CompletedAchievement = this.achievementsStorage.getAchievement(achv.id);
			// From now on, stop counting how many times each achievement has been unlocked
			if (existingAchievement.numberOfCompletions >= 1) {
				continue;
			}
			const completedAchievement = new CompletedAchievement(
				existingAchievement.id,
				existingAchievement.numberOfCompletions + 1,
			);
			console.log('[achievement-monitor] starting process of completed achievement', achievement.id);
			const mergedAchievement = Object.assign(new Achievement(), achv, {
				numberOfCompletions: completedAchievement.numberOfCompletions,
			} as Achievement);

			this.achievementsStorage.save(completedAchievement);
			console.log('[achievement-monitor] saved achievement', achievement.id);
			this.remoteAchievements.publishRemoteAchievement(mergedAchievement);
			console.log('[achievement-monitor] broadcasting event completion event', achievement.id);

			this.processingQueue.enqueue({ achievement: mergedAchievement } as InternalEvent);
		}
	}

	private async processQueue(eventQueue: readonly InternalEvent[]): Promise<readonly InternalEvent[]> {
		// Don't process an event if we've just received one, as it could indicate that other
		// related events will come soon as well
		// if (Date.now() - this.lastReceivedTimestamp < 500) {
		// 	return eventQueue;
		// }
		const candidate: InternalEvent = eventQueue[0];

		// Is there a better candidate?
		const betterCandidate: InternalEvent = eventQueue
			.filter((event) => event.achievement.type === candidate.achievement.type)
			.sort((a, b) => b.achievement.priority - a.achievement.priority)[0];

		// 	'[achievements-monitor] emitted achievement completed event',
		// 	betterCandidate,
		// 	betterCandidate.achievement.id,
		// );
		this.events.broadcast(Events.ACHIEVEMENT_COMPLETE, betterCandidate.achievement);
		this.prepareAchievementCompletedEvent(betterCandidate.achievement);

		// Now remove all the related events
		return eventQueue.filter((event) => event.achievement.type !== betterCandidate.achievement.type);
	}

	private async prepareAchievementCompletedEvent(achievement: Achievement) {
		this.store.send(new AchievementCompletedEvent(achievement));
	}
}

interface InternalEvent {
	readonly achievement: Achievement;
	// readonly challenge: Challenge;
}
