import { Injectable } from '@angular/core';
import { Achievement } from '../../models/achievement';
import { HsRawAchievement } from '../../models/achievement/hs-raw-achievement';
import { CompletedAchievement } from '../../models/completed-achievement';
import { GameEvent } from '../../models/game-event';
import { MemoryUpdate } from '../../models/memory-update';
import { Events } from '../events.service';
import { FeatureFlags } from '../feature-flags';
import { GameEventsEmitterService } from '../game-events-emitter.service';
import { AchievementCompletedEvent } from '../mainwindow/store/events/achievements/achievement-completed-event';
import { MainWindowStoreService } from '../mainwindow/store/main-window-store.service';
import { MemoryInspectionService } from '../plugins/memory-inspection.service';
import { ProcessingQueue } from '../processing-queue.service';
import { Challenge } from './achievements/challenges/challenge';
import { AchievementsLoaderService } from './data/achievements-loader.service';
import { AchievementsLocalDbService } from './indexed-db.service';
import { RemoteAchievementsService } from './remote-achievements.service';

@Injectable()
export class AchievementsMonitor {
	private processingQueue = new ProcessingQueue<InternalEvent>(
		eventQueue => this.processQueue(eventQueue),
		1000,
		'achievement-monitor',
	);
	private lastReceivedTimestamp;
	private achievementQuotas: { [achievementId: number]: number };

	constructor(
		private gameEvents: GameEventsEmitterService,
		private achievementLoader: AchievementsLoaderService,
		private events: Events,
		private store: MainWindowStoreService,
		private remoteAchievements: RemoteAchievementsService,
		private achievementsStorage: AchievementsLocalDbService,
		private memory: MemoryInspectionService,
	) {
		this.lastReceivedTimestamp = Date.now();
		this.gameEvents.allEvents.subscribe((gameEvent: GameEvent) => {
			this.handleEvent(gameEvent);
		});
		if (FeatureFlags.SHOW_HS_ACHIEVEMENTS) {
			this.events.on(Events.MEMORY_UPDATE).subscribe(event => {
				const changes: MemoryUpdate = event.data[0];
				if (changes.DisplayingAchievementToast) {
					setTimeout(() => {
						this.detectNewAchievementFromMemory();
					}, 500);
				}
			});
		}
		this.init();
	}

	private async init() {
		const rawAchievements: readonly HsRawAchievement[] = await this.remoteAchievements.loadHsRawAchievements();
		this.achievementQuotas = {};
		for (const ach of rawAchievements) {
			this.achievementQuotas[ach.id] = ach.quota;
		}
	}

	private async detectNewAchievementFromMemory() {
		console.log('[achievement-monitor] detecting achievements from memory');

		const [existingAchievements, achievementsProgress] = await Promise.all([
			this.achievementsStorage.retrieveInGameAchievements(),
			this.memory.getInGameAchievementsProgressInfo(),
		]);
		console.log('[achievement-monitor] retrieved achievements from memory');
		const unlockedAchievements = (achievementsProgress?.achievements || [])
			?.filter(progress => progress.progress >= this.achievementQuotas[progress.id])
			.map(progress => progress.id)
			.map(id => existingAchievements.achievements.find(ach => ach.id === id))
			.filter(ach => ach)
			.filter(ach => !ach.completed);
		console.log('[achievement-monitor] unlocked achievements', unlockedAchievements);
		if (!unlockedAchievements.length) {
			setTimeout(() => {
				this.detectNewAchievementFromMemory();
				return;
			}, 200);
		}
		const achievements = await Promise.all(
			unlockedAchievements.map(ach => this.achievementLoader.getAchievement(`hearthstone_game_${ach.id}`)),
		);
		console.log('[achievement-monitor] built achievements, emitting events', achievements);
		await Promise.all(achievements.map(ach => this.sendUnlockEventFromAchievement(ach)));
	}

	private async handleEvent(gameEvent: GameEvent) {
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
		await this.sendUnlockEventFromAchievement(achievement);
	}

	private async sendUnlockEventFromAchievement(achievement: Achievement) {
		const autoGrantAchievements = await this.achievementLoader.getAchievementsById(
			achievement.linkedAchievementIds,
		);
		const allAchievements =
			autoGrantAchievements.length > 0 ? [achievement, ...autoGrantAchievements] : [achievement];
		// console.debug('[achievement-monitor] will grant achievements?', allAchievements, achievement);
		for (const achv of allAchievements) {
			// console.debug('no-format', '[achievement-monitor] starting process of completed achievement', achv.id);
			const existingAchievement: CompletedAchievement = await this.achievementsStorage.getAchievement(achv.id);
			// From now on, stop counting how many times each achievement has been unlocked
			if (existingAchievement.numberOfCompletions >= 1) {
				// console.debug('[achievement-monitor] achievement can be completed only once', achievement.id);
				continue;
			}
			const completedAchievement = new CompletedAchievement(
				existingAchievement.id,
				existingAchievement.numberOfCompletions + 1,
			);
			console.log(
				'[achievement-monitor] starting process of completed achievement',
				achievement.id,
				existingAchievement,
				completedAchievement,
			);
			const mergedAchievement = Object.assign(new Achievement(), achv, {
				numberOfCompletions: completedAchievement.numberOfCompletions,
			} as Achievement);

			await this.achievementsStorage.save(completedAchievement);
			console.log(
				'[achievement-monitor] saved achievement',
				await this.achievementsStorage.getAchievement(achv.id),
			);
			this.remoteAchievements.publishRemoteAchievement(mergedAchievement);
			console.log('[achievement-monitor] broadcasting event completion event', mergedAchievement);

			this.enqueue({ achievement: mergedAchievement } as InternalEvent);
		}
	}

	private enqueue(event: InternalEvent) {
		this.lastReceivedTimestamp = Date.now();
		this.processingQueue.enqueue(event);
	}

	private async processQueue(eventQueue: readonly InternalEvent[]): Promise<readonly InternalEvent[]> {
		// Don't process an event if we've just received one, as it could indicate that other
		// related events will come soon as well
		if (Date.now() - this.lastReceivedTimestamp < 500) {
			// console.log('[achievements-monitor] too soon, waiting before processing');
			return eventQueue;
		}
		const candidate: InternalEvent = eventQueue[0];
		// console.debug('[achievements-monitor] found a candidate', candidate);
		// Is there a better candidate?
		const betterCandidate: InternalEvent = eventQueue
			.filter(event => event.achievement.type === candidate.achievement.type)
			.sort((a, b) => b.achievement.priority - a.achievement.priority)[0];
		// console.debug(
		// 	'[achievements-monitor] emitted achievement completed event',
		// 	betterCandidate,
		// 	betterCandidate.achievement.id,
		// );
		this.events.broadcast(Events.ACHIEVEMENT_COMPLETE, betterCandidate.achievement);
		this.prepareAchievementCompletedEvent(betterCandidate.achievement);

		// Now remove all the related events
		return eventQueue.filter(event => event.achievement.type !== betterCandidate.achievement.type);
	}

	private async prepareAchievementCompletedEvent(achievement: Achievement) {
		this.store.stateUpdater.next(new AchievementCompletedEvent(achievement));
	}
}

interface InternalEvent {
	readonly achievement: Achievement;
	// readonly challenge: Challenge;
}
