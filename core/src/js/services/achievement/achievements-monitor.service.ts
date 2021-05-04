import { EventEmitter, Injectable } from '@angular/core';
import { Achievement } from '../../models/achievement';
import { AchievementProgress, AchievementsProgress } from '../../models/achievement/achievement-progress';
import { HsRawAchievement } from '../../models/achievement/hs-raw-achievement';
import { CompletedAchievement } from '../../models/completed-achievement';
import { GameEvent } from '../../models/game-event';
import { MemoryUpdate } from '../../models/memory/memory-update';
import { Events } from '../events.service';
import { FeatureFlags } from '../feature-flags';
import { GameEventsEmitterService } from '../game-events-emitter.service';
import { AchievementCompletedEvent } from '../mainwindow/store/events/achievements/achievement-completed-event';
import { AchievementsUpdatedEvent } from '../mainwindow/store/events/achievements/achievements-updated-event';
import { MainWindowStoreEvent } from '../mainwindow/store/events/main-window-store-event';
import { MainWindowStoreService } from '../mainwindow/store/main-window-store.service';
import { OverwolfService } from '../overwolf.service';
import { MemoryInspectionService } from '../plugins/memory-inspection.service';
import { ProcessingQueue } from '../processing-queue.service';
import { HsAchievementInfo, HsAchievementsInfo } from './achievements-info';
import { AchievementsManager } from './achievements-manager.service';
import { Challenge } from './achievements/challenges/challenge';
import { AchievementsLoaderService } from './data/achievements-loader.service';
import { AchievementsLocalDbService } from './indexed-db.service';
import { RemoteAchievementsService } from './remote-achievements.service';

@Injectable()
export class AchievementsMonitor {
	private processingQueue = new ProcessingQueue<InternalEvent>(
		(eventQueue) => this.processQueue(eventQueue),
		1000,
		'achievement-monitor',
	);
	private lastReceivedTimestamp;
	private achievementQuotas: { [achievementId: number]: number };
	private previousAchievements: readonly HsAchievementInfo[];

	private achievementsProgressInterval;
	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private gameEvents: GameEventsEmitterService,
		private achievementLoader: AchievementsLoaderService,
		private events: Events,
		private store: MainWindowStoreService,
		private remoteAchievements: RemoteAchievementsService,
		private achievementsStorage: AchievementsLocalDbService,
		private achievementsManager: AchievementsManager,
		private memory: MemoryInspectionService,
		private ow: OverwolfService,
	) {
		this.lastReceivedTimestamp = Date.now();
		this.gameEvents.allEvents.subscribe((gameEvent: GameEvent) => {
			this.handleEvent(gameEvent);

			if (gameEvent.type === GameEvent.GAME_START) {
				this.assignPreviousAchievements();
				if (FeatureFlags.SHOW_CONSTRUCTED_SECONDARY_WINDOW) {
					this.startAchievementsProgressDetection();
				}
			} else if (gameEvent.type === GameEvent.GAME_END) {
				this.stopAchievementsProgressDetection();
			}
		});

		this.events.on(Events.MEMORY_UPDATE).subscribe((event) => {
			const changes: MemoryUpdate = event.data[0];
			if (changes.DisplayingAchievementToast) {
				setTimeout(() => {
					this.detectNewAchievementFromMemory();
				}, 500);
			}
		});
		// If we start the detection too early, the first pass will be done against
		// an uninitialized achievements state, and thus discarded
		this.events.on(Events.STORE_READY).subscribe((event) => this.startGlobalAchievementsProgressDetection());
		this.init();
	}

	private async init() {
		const rawAchievements: readonly HsRawAchievement[] = await this.remoteAchievements.loadHsRawAchievements();
		this.achievementQuotas = {};
		for (const ach of rawAchievements) {
			this.achievementQuotas[ach.id] = ach.quota;
		}
		if (await this.ow.inGame()) {
			this.assignPreviousAchievements();
		}
		this.ow.addGameInfoUpdatedListener(async (res: any) => {
			// console.log('[mind-vision] updated game status', res);
			if (this.ow.exitGame(res)) {
				this.previousAchievements = null;
			} else if ((await this.ow.inGame()) && res.gameChanged) {
				if (!this.previousAchievements) {
					this.assignPreviousAchievements();
				}
			}
		});
		setTimeout(() => {
			this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
		});
	}

	private async detectNewAchievementFromMemory(retriesLeft = 10, forceAchievementsUpdate = false) {
		if (retriesLeft < 0) {
			return;
		}

		console.log('[achievement-monitor] detecting achievements from memory');
		const [existingAchievements, achievementsProgress] = await Promise.all([
			this.achievementsManager.getAchievements(),
			this.memory.getInGameAchievementsProgressInfo(),
		]);
		if (process.env.NODE_ENV !== 'production') {
			console.debug('[achievement-monitor] retrieved achievements from memory', {
				existingAchievements: existingAchievements, // This doesn't have 1876, which is normal since it has not been unlocked
				achievementsProgress: achievementsProgress, // This has the correct progress, unbless you're not in a game?
				achievementQuotas: this.achievementQuotas,
				previousAchievements: this.previousAchievements,
				prorgressWithQuota: (achievementsProgress?.achievements || [])?.filter(
					(progress) => progress.progress >= this.achievementQuotas[progress.id],
				),
			});
		} else {
			console.log('[achievement-monitor] retrieved achievements from memory');
		}
		const computedProgress: readonly HsAchievementInfo[] = achievementsProgress?.achievements?.length
			? achievementsProgress.achievements
			: this.achievementsDiff(this.previousAchievements, existingAchievements);
		if (process.env.NODE_ENV !== 'production') {
			console.debug(
				'[achievement-monitor] computed progress',
				computedProgress,
				achievementsProgress,
				this.previousAchievements,
				existingAchievements,
			);
		}
		const unlockedAchievements = computedProgress
			?.filter((progress) => progress.progress >= this.achievementQuotas[progress.id])
			.map((progress) => progress.id)
			.map(
				(id) =>
					// Only achievement with a current progress are in the game's memory, so the ones that are simply
					// yes/no will always be missing
					existingAchievements.find((ach) => ach.id === id) || {
						id: id,
						progress: 0,
						completed: false,
					},
			)
			.filter(
				(ach) =>
					!ach.completed ||
					// It looks like the game might be flagging the achievements as completed right away now
					// Using a === false check doesn't work if the achievement was not part of the previous
					// achievements, which is the case for BG top finishes
					(this.previousAchievements && !this.previousAchievements.find((a) => a.id === ach.id)?.completed),
			);
		console.log('[achievement-monitor] unlocked achievements', unlockedAchievements);
		if (!unlockedAchievements.length) {
			if (process.env.NODE_ENV !== 'production') {
				console.log(
					'[achievement-monitor] nothing from memory',
					existingAchievements, // This doesn't have 1876, which is normal since it has not been unlocked
					achievementsProgress, // This has the correct progress
					(achievementsProgress?.achievements || [])?.filter(
						(progress) => progress.progress >= this.achievementQuotas[progress.id],
					),
					unlockedAchievements,
				);
			}
			setTimeout(() => {
				this.detectNewAchievementFromMemory(retriesLeft - 1, true);
				return;
			}, 150);
			return;
		}
		const achievements = await Promise.all(
			unlockedAchievements.map((ach) => this.achievementLoader.getAchievement(`hearthstone_game_${ach.id}`)),
		);
		console.log('[achievement-monitor] built achievements, emitting events', achievements);
		await Promise.all(achievements.map((ach) => this.sendUnlockEventFromAchievement(ach)));
		this.previousAchievements = existingAchievements;
	}

	private achievementsDiff(
		previousAchievements: readonly HsAchievementInfo[],
		currentAchievements: readonly HsAchievementInfo[],
	): readonly HsAchievementInfo[] {
		if (!previousAchievements?.length) {
			return currentAchievements ?? [];
		}

		if (!currentAchievements?.length) {
			return previousAchievements ?? [];
		}

		const allKeys = [...previousAchievements.map((a) => a.id), ...currentAchievements.map((a) => a.id)].filter(
			(id) => id,
		);
		if (!allKeys?.length) {
			return [];
		}

		const uniqueKeys = [...new Set(allKeys)];
		return uniqueKeys
			.map((achievementId) => {
				const previousAchievement = previousAchievements.find((a) => a.id === achievementId);
				const currentAchievement = currentAchievements.find((a) => a.id === achievementId);
				const progress = (currentAchievement?.progress ?? 0) - (previousAchievement?.progress ?? 0);
				if (progress <= 0) {
					return null;
				}
				return {
					id: achievementId,
					progress: progress,
					completed: currentAchievement?.completed || previousAchievement?.completed,
				};
			})
			.filter((a) => a);
	}

	private async handleEvent(gameEvent: GameEvent) {
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
			const existingAchievement: CompletedAchievement = this.achievementsStorage.getAchievement(achv.id);
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

			this.achievementsStorage.save(completedAchievement);
			console.log('[achievement-monitor] saved achievement', this.achievementsStorage.getAchievement(achv.id));
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
			.filter((event) => event.achievement.type === candidate.achievement.type)
			.sort((a, b) => b.achievement.priority - a.achievement.priority)[0];
		// console.debug(
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
		this.store.stateUpdater.next(new AchievementCompletedEvent(achievement));
	}

	private async startAchievementsProgressDetection() {
		this.achievementsProgressInterval = setInterval(() => this.detectAchievementProgress(), 5000);
	}

	private async stopAchievementsProgressDetection() {
		if (this.achievementsProgressInterval) {
			clearInterval(this.achievementsProgressInterval);
		}
	}

	private async assignPreviousAchievements() {
		const existingAchievements = await this.achievementsManager.getAchievements(true);
		// console.debug('[achievements-monitor] existing achievements', existingAchievements, this.previousAchievements);
		if (!existingAchievements) {
			return;
		}

		if (!this.previousAchievements) {
			// console.debug('[achievements-monitor] assigning previous achievements', existingAchievements);
			console.log('[achievements-monitor] assigning previous achievements', existingAchievements.length);
			this.previousAchievements = existingAchievements;
		}
	}

	private async detectAchievementProgress() {
		const achievementsProgress: HsAchievementsInfo = await this.memory.getInGameAchievementsProgressInfo();
		const allAchievements = await this.achievementLoader.getAchievements();
		if (!achievementsProgress?.achievements?.length) {
			return;
		}

		const achievementInfos: readonly AchievementProgress[] = achievementsProgress.achievements.map((ach) => {
			const ref = allAchievements.find((a) => a.id === `hearthstone_game_${ach.id}`);
			const quota = this.achievementQuotas[ach.id];
			return {
				id: ref.id,
				progress: ach.progress,
				quota: quota,
				completed: ach.completed || ref.numberOfCompletions > 0 || ach.progress >= quota,
				text: ref.text,
				name: ref.name,
				step: ref.priority,
				type: ref.type,
				ref: ref,
			};
		});
		const achievementsInfo: AchievementsProgress = {
			achievements: achievementInfos,
		};
		this.events.broadcast(Events.ACHIEVEMENT_PROGRESSION, achievementsInfo);
	}

	// There is some duplication here with the in-game live detection.
	// However, the purpose is different, so for now I won't explore merging them together (unless it proves
	// to be a performance issue)
	// Keeping them separate also means that I can add options to turn the updates off if users
	// find it too resource-intensive
	private previousState: readonly HsAchievementInfo[] = [];
	private async startGlobalAchievementsProgressDetection() {
		// TODO: addd pref
		setInterval(async () => {
			const inGame = await this.ow.inGame();
			if (!inGame) {
				return;
			}

			const currentState = await this.achievementsManager.getAchievements(true, false);
			const diff = this.achievementsDiff(this.previousState, currentState);
			if (diff?.length) {
				this.stateUpdater.next(new AchievementsUpdatedEvent(diff));
			}
			this.previousState = currentState;
		}, 15 * 1000);
	}
}

interface InternalEvent {
	readonly achievement: Achievement;
	// readonly challenge: Challenge;
}
