import { Injectable, NgZone } from '@angular/core';
import {
	Achievement,
	AchievementsStateManagerService,
	AchievementsStorageService,
	CompletedAchievement,
	FirestoneRemoteAchievementsLoaderService,
	RawAchievement,
} from '@firestone/achievements/common';
import { GameEvent, GameEventsEmitterService } from '@firestone/game-state';
import { AchievementCompletedEvent, MainWindowStateFacadeService } from '@firestone/mainwindow/common';
import { Events, GameStatusService, PreferencesService } from '@firestone/shared/common/service';
import { waitForReady } from '@firestone/shared/framework/core';
import { combineLatest, distinctUntilChanged, filter, map, take } from 'rxjs';
import { ProcessingQueue } from '../processing-queue.service';
import { Challenge } from './achievements/challenges/challenge';
import { ChallengeBuilderService } from './achievements/challenges/challenge-builder.service';

@Injectable()
// Everything linked to Firestone challenges, as opposed to HS native achievements
// Not used anymore?
export class FirestoneAchievementsChallengeService {
	public challengeModules: readonly Challenge[] = [];

	private spectating: boolean;
	private processingQueue: ProcessingQueue<InternalEvent>;

	private activeChallengesForDispatch: readonly Challenge[] = [];
	private challengesListeningToAllEvents: Challenge[] = [];
	private challengesByGameEventType = new Map<string, Challenge[]>();

	constructor(
		private readonly gameEvents: GameEventsEmitterService,
		private readonly prefs: PreferencesService,
		private readonly achievementsStorage: AchievementsStorageService,
		private readonly remoteAchievements: FirestoneRemoteAchievementsLoaderService,
		private readonly events: Events,
		private readonly achievementsStateManager: AchievementsStateManagerService,
		private readonly challengeBuilder: ChallengeBuilderService,
		private readonly gameStatus: GameStatusService,
		private readonly ngZone: NgZone,
		private readonly mainWindowStateFacade: MainWindowStateFacadeService,
	) {
		this.processingQueue = new ProcessingQueue<InternalEvent>(
			(eventQueue) => this.processQueue(eventQueue),
			1000,
			'achievement-monitor',
			undefined,
			this.ngZone,
		);
		this.init();
	}

	private async init() {
		await waitForReady(this.prefs, this.mainWindowStateFacade);
		// return;

		combineLatest([
			this.gameStatus.inGame$$,
			this.prefs.preferences$$.pipe(
				map((prefs) => prefs.achievementsFullEnabled),
				distinctUntilChanged(),
			),
			this.prefs.preferences$$.pipe(
				map((prefs) => prefs.achievementsEnabled2),
				distinctUntilChanged(),
			),
		])
			.pipe(
				filter(([inGame, full, firestoneAchievements]) => inGame && full && firestoneAchievements),
				take(1),
			)
			.subscribe(async () => {
				console.log('[firestone-achievements] init');
				await this.initChallenges();
				this.gameStatus.onGameExit(() => {
					this.challengeModules.forEach((c) => c.resetState());
					this.resetDispatchAfterGameExit();
				});
				this.gameEvents.allEvents.subscribe((gameEvent: GameEvent) => {
					this.handleEvent(gameEvent);
					if (gameEvent.type === GameEvent.SPECTATING) {
						this.spectating = gameEvent.additionalData.spectating;
					}
				});
			});
	}

	private async initChallenges() {
		await waitForReady(this.achievementsStateManager);

		this.achievementsStateManager.rawAchievements$$
			.pipe(
				filter((achievements) => !!achievements?.length),
				take(1),
			)
			.subscribe((rawAchievements) => {
				const built = rawAchievements
					.filter((raw) => this.shouldStillTrackAchievement(raw))
					.map((rawAchievement) => this.challengeBuilder.buildChallenge(rawAchievement))
					.filter((challenge): challenge is Challenge => !!challenge);
				this.challengeModules = built;
				this.resetDispatchAfterGameExit();
				console.debug('[firestone-achievements] loaded challenges', built.length);
			});
	}

	private shouldStillTrackAchievement(raw: RawAchievement): boolean {
		if (!raw.canBeCompletedOnlyOnce) {
			return true;
		}
		const existing = this.achievementsStorage.getAchievement(raw.id);
		return (existing?.numberOfCompletions ?? 0) < 1;
	}

	private resetDispatchAfterGameExit() {
		this.activeChallengesForDispatch = [...this.challengeModules];
		this.rebuildDispatchIndex();
	}

	private rebuildDispatchIndex() {
		const listeningToAll: Challenge[] = [];
		const byType = new Map<string, Challenge[]>();

		for (const challenge of this.activeChallengesForDispatch) {
			if (challenge.listensToAllGameEvents) {
				listeningToAll.push(challenge);
				continue;
			}
			const types = challenge.interestedGameEventTypes;
			if (!types?.size) {
				listeningToAll.push(challenge);
				continue;
			}
			for (const eventType of types) {
				let bucket = byType.get(eventType);
				if (!bucket) {
					bucket = [];
					byType.set(eventType, bucket);
				}
				bucket.push(challenge);
			}
		}

		this.challengesListeningToAllEvents = listeningToAll;
		this.challengesByGameEventType = byType;
	}

	private narrowActiveChallengesForMatch(gameEvent: GameEvent) {
		const meta = gameEvent.additionalData?.metaData;
		if (!meta) {
			return;
		}
		const gameType = meta.GameType as number | undefined;
		const scenarioId = meta.ScenarioID as number | undefined;
		this.activeChallengesForDispatch = this.challengeModules.filter((c) =>
			c.isEligibleForMatch(gameType, scenarioId),
		);
		this.rebuildDispatchIndex();
	}

	public async handleEvent(gameEvent: GameEvent) {
		if (gameEvent.type === GameEvent.MATCH_METADATA) {
			this.narrowActiveChallengesForMatch(gameEvent);
		}

		const prefs = await this.prefs.getPreferences();
		if (this.spectating || !prefs.achievementsEnabled2) {
			return;
		}

		const seenAchievementIds = new Set<string>();
		const runChallenge = (challenge: Challenge) => {
			if (seenAchievementIds.has(challenge.achievementId)) {
				return;
			}
			seenAchievementIds.add(challenge.achievementId);
			try {
				challenge.detect(gameEvent, () => {
					this.sendUnlockEvent(challenge);
				});
			} catch (e) {
				console.error(
					'[firestone-achievements] Exception while trying to handle challenge',
					challenge.achievementId,
					e,
				);
			}
		};

		for (const challenge of this.challengesListeningToAllEvents) {
			runChallenge(challenge);
		}
		for (const challenge of this.challengesByGameEventType.get(gameEvent.type) ?? []) {
			runChallenge(challenge);
		}
	}

	private async sendUnlockEvent(challenge: Challenge) {
		const achievementId = challenge.achievementId;
		const storedPrimary = this.achievementsStorage.getAchievement(achievementId);
		if ((storedPrimary?.numberOfCompletions ?? 0) >= 1) {
			console.debug('[firestone-achievements] skip unlock (alreadyCompleteInStorage)', achievementId);
			return;
		}

		const rawAchievements = await this.achievementsStateManager.rawAchievements$$.getValueWithInit();
		const achievement: Achievement = getAchievement(rawAchievements, achievementId);
		if (!achievement) {
			console.warn('[firestone-achievements] skip unlock (noDefinition)', achievementId);
			return;
		}
		if ((achievement.numberOfCompletions ?? 0) >= 1) {
			console.debug(
				'[firestone-achievements] skip unlock (alreadyCompleteInDefinition)',
				achievementId,
				achievement.numberOfCompletions,
			);
			return;
		}

		console.debug('[firestone-achievements] processing unlock event', achievementId, achievement.type);
		await this.sendUnlockEventFromAchievement(achievement);
	}

	private async sendUnlockEventFromAchievement(achievement: Achievement) {
		if (!achievement) {
			console.warn('[firestone-achievements] trying to send unlock event for empty achievement');
			return;
		}

		const rawAchievements = await this.achievementsStateManager.rawAchievements$$.getValueWithInit();
		const autoGrantAchievements = getAchievements(rawAchievements, achievement.linkedAchievementIds);
		const allAchievements =
			autoGrantAchievements.length > 0 ? [achievement, ...autoGrantAchievements] : [achievement];
		console.debug('[firestone-achievements] unlock persistence targets', {
			primaryId: achievement.id,
			count: allAchievements.length,
			ids: allAchievements.map((a) => a.id),
		});

		let enqueuedAny = false;
		for (const achv of allAchievements) {
			const existingAchievement: CompletedAchievement = this.achievementsStorage.getAchievement(achv.id);
			const completionsFromStorage = existingAchievement.numberOfCompletions ?? 0;
			const completionsFromDefinition = achv.numberOfCompletions ?? 0;
			if (completionsFromStorage >= 1 || completionsFromDefinition >= 1) {
				console.debug('[firestone-achievements] skip grant (already complete)', achv.id, {
					completionsFromStorage,
					completionsFromDefinition,
				});
				continue;
			}
			const completedAchievement = new CompletedAchievement(
				existingAchievement.id,
				existingAchievement.numberOfCompletions + 1,
			);
			console.debug('[firestone-achievements] persisting completion', achv.id, achv.type);
			const mergedAchievement = {
				...achv,
				numberOfCompletions: completedAchievement.numberOfCompletions,
			} as Achievement;

			this.achievementsStorage.save(completedAchievement);
			await this.remoteAchievements.publishRemoteAchievement(mergedAchievement);
			console.debug('[firestone-achievements] completion published to local stream + optional remote', achv.id);

			this.processingQueue.enqueue({ achievement: mergedAchievement } as InternalEvent);
			enqueuedAny = true;
		}
		if (!enqueuedAny) {
			console.debug('[firestone-achievements] unlock had no grants (all targets already complete)', achievement.id);
		}
	}

	private async processQueue(eventQueue: readonly InternalEvent[]): Promise<readonly InternalEvent[]> {
		const candidate: InternalEvent = eventQueue[0];

		const betterCandidate: InternalEvent = eventQueue
			.filter((event) => event.achievement.type === candidate.achievement.type)
			.sort((a, b) => b.achievement.priority - a.achievement.priority)[0];

		this.events.broadcast(Events.ACHIEVEMENT_COMPLETE, betterCandidate.achievement);
		this.prepareAchievementCompletedEvent(betterCandidate.achievement);

		return eventQueue.filter((event) => event.achievement.type !== betterCandidate.achievement.type);
	}

	private async prepareAchievementCompletedEvent(achievement: Achievement) {
		this.mainWindowStateFacade.send(new AchievementCompletedEvent(achievement));
	}
}

const getAchievement = (achievements: readonly Achievement[], achievementId: string): Achievement => {
	return achievements.find((ach) => ach.id === achievementId);
};

const getAchievements = (
	achievements: readonly Achievement[],
	achievementIds: readonly string[],
): readonly Achievement[] => {
	if (!achievementIds?.length || !achievements?.length) {
		return [];
	}
	const wanted = new Set(achievementIds);
	return achievements.filter((ach) => wanted.has(ach.id));
};

interface InternalEvent {
	readonly achievement: Achievement;
}
