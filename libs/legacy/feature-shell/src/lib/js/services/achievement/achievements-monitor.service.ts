import { Injectable } from '@angular/core';
import { HsRefAchievement } from '@firestone/achievements/data-access';
import { OverwolfService } from '@firestone/shared/framework/core';
import { BehaviorSubject, combineLatest, distinctUntilChanged } from 'rxjs';
import { GameEvent } from '../../models/game-event';
import { FeatureFlags } from '../feature-flags';
import { GameEventsEmitterService } from '../game-events-emitter.service';
import { MemoryInspectionService } from '../plugins/memory-inspection.service';
import { AppUiStoreFacadeService } from '../ui-store/app-ui-store-facade.service';
import { arraysEqual, deepEqual } from '../utils';
import { AchievementsFirestoneChallengeService } from './achievements-firestone-challenges.service';
import { HsAchievementInfo, HsAchievementsInfo } from './achievements-info';
import { AchievementsManager } from './achievements-manager.service';
import { RemoteAchievementsService } from './remote-achievements.service';

@Injectable()
export class AchievementsMonitor {
	public achievementsProgressTracking$$ = new BehaviorSubject<readonly AchievementsProgressTracking[]>([]);

	private achievementQuotas: { [achievementId: number]: number };
	private refAchievements: readonly HsRefAchievement[];

	private achievementIdsToTrack: readonly number[] = [];
	private achievementsOnGameStart$$ = new BehaviorSubject<readonly HsAchievementInfo[]>([]);
	private currentAchievementsProgress$$ = new BehaviorSubject<readonly HsAchievementInfo[]>([]);

	constructor(
		private readonly gameEvents: GameEventsEmitterService,
		private readonly store: AppUiStoreFacadeService,
		private readonly remoteAchievements: RemoteAchievementsService,
		private readonly achievementsManager: AchievementsManager,
		private readonly memory: MemoryInspectionService,
		private readonly ow: OverwolfService,
		private readonly firestoneAchievements: AchievementsFirestoneChallengeService,
	) {
		this.init();
		window['achievementsMonitor'] = this;
	}

	private async init() {
		if (!FeatureFlags.ACHIEVEMENT_PINS) {
			return;
		}

		await this.store.initComplete();
		await this.initQuotas();
		await this.initAchievementsOnGameStart();

		const achievementsOnGameStart$ = this.achievementsOnGameStart$$.pipe(
			distinctUntilChanged((a, b) => deepEqual(a, b)),
		);
		const currentAchievementProgress$ = this.currentAchievementsProgress$$.pipe(
			distinctUntilChanged((a, b) => deepEqual(a, b)),
		);

		combineLatest([currentAchievementProgress$, achievementsOnGameStart$])
			// .pipe(distinctUntilChanged((a, b) => deepEqual(a, b)))
			.subscribe(([progress, achievementsOnGameStart]) => {
				const finalAchievements = this.buildAchievementsProgressTracking(achievementsOnGameStart, progress);
				console.debug(
					'[achievements-monitor] emitting achievements progress',
					finalAchievements,
					achievementsOnGameStart,
					progress,
				);
				this.achievementsProgressTracking$$.next(finalAchievements);
			});

		// TODO: refresh this when an achievement gets completed
		combineLatest([this.store.listenPrefs$((prefs) => prefs.pinnedAchievementIds), this.achievementsOnGameStart$$])
			.pipe(distinctUntilChanged((a, b) => arraysEqual(a, b)))
			.subscribe(async ([[pinnedAchievementIds], achievementsOnGameStart]) => {
				console.debug(
					'[achievements-monitor] pinnedAchievementIds',
					pinnedAchievementIds,
					achievementsOnGameStart,
				);
				// When pinning an achievement, we get the first step of the achievements chain
				// We actually want to pin the most recent uncompleted step
				this.achievementIdsToTrack = pinnedAchievementIds
					.map((id) => {
						const achievementToTrack = this.findFirstUncompletedStep(id, achievementsOnGameStart);
						// console.debug('[achievements-monitor] achievementToTrack', achievementToTrack, id);
						return achievementToTrack?.id ?? id;
					})
					.filter((id) => !isNaN(id));
			});

		setInterval(() => this.detectAchievementsProgress(), 1500);
	}

	private findFirstUncompletedStep(
		id: number,
		achievementsOnGameStart: readonly HsAchievementInfo[],
	): HsRefAchievement {
		let currentAchievement = this.refAchievements.find((a) => a.id === id);
		let currentCompletion = achievementsOnGameStart.find((a) => a.id === id)?.progress ?? 0;
		// console.debug('[achievements-monitor] currentAchievement', currentAchievement, currentCompletion);
		while (currentCompletion > 0 && currentCompletion >= currentAchievement.quota) {
			const nextStepId = currentAchievement.nextTierId;
			currentAchievement = this.refAchievements.find((a) => a.id === nextStepId);
			currentCompletion = achievementsOnGameStart.find((a) => a.id === nextStepId)?.progress ?? 0;
			// console.debug('[achievements-monitor] currentAchievement', currentAchievement, currentCompletion);
		}
		return currentAchievement;
	}

	private buildAchievementsProgressTracking(
		achievementsOnGameStart: readonly HsAchievementInfo[],
		progress: readonly HsAchievementInfo[],
	): readonly AchievementsProgressTracking[] {
		return (
			progress?.map((p) => {
				const previousAchievement = achievementsOnGameStart?.find((a) => a.id === p.id);
				const refAchievement = this.refAchievements.find((a) => a.id === p.id);
				const quota = this.achievementQuotas[p.id];
				const result: AchievementsProgressTracking = {
					id: p.id,
					name: refAchievement?.name ?? 'Unknown achievement',
					text: refAchievement?.description?.replaceAll('$q', '' + quota),
					quota: quota,
					progressThisGame: p.progress - (previousAchievement?.progress ?? 0),
					progressTotal: p.progress,
				};
				return result;
			}) ?? []
		);
	}

	private async detectAchievementsProgress() {
		if (!this.achievementIdsToTrack?.length) {
			return;
		}

		// const currentAchievementProgress2 = await this.memory.getInGameAchievementsProgressInfo(
		// 	this.achievementIdsToTrack,
		// );
		// this.currentAchievementsProgress$$.next(currentAchievementProgress2?.achievements ?? []);
		// return;

		const startTime = performance.now();
		const currentProgressIds = this.currentAchievementsProgress$$.value.map((a) => a.id) ?? [];
		let currentAchievementProgress: HsAchievementsInfo = null;
		const useIndexDetection = this.achievementIdsToTrack.every((id) => currentProgressIds.includes(id));
		// console.debug(
		// 	'[achievements-monitor] using index detection?',
		// 	useIndexDetection,
		// 	this.achievementIdsToTrack,
		// 	currentProgressIds,
		// 	this.currentAchievementsProgress$$.value,
		// );
		if (!useIndexDetection) {
			currentAchievementProgress = await this.memory.getInGameAchievementsProgressInfo(
				this.achievementIdsToTrack,
			);
		} else {
			const indexes = this.currentAchievementsProgress$$.value.map((a) => a.index);
			currentAchievementProgress = await this.memory.getInGameAchievementsProgressInfoByIndex(indexes);
			// Check if we got the right achievements
			// This means that the achievements returned have the same ids as the achievementIdsToTrack
			// const currentProgressIds = currentAchievementProgress?.achievements?.map((a) => a.id);
			// if (!arraysEqual([...currentProgressIds].sort(), [...this.achievementIdsToTrack])) {
			// 	console.warn(
			// 		'[achievements-monitor] wrong achievements returned, falling back to non-index detection',
			// 		currentAchievementProgress,
			// 		this.achievementIdsToTrack,
			// 	);
			// 	currentAchievementProgress = await this.memory.getInGameAchievementsProgressInfo(
			// 		this.achievementIdsToTrack,
			// 	);
			// }
		}

		const endTime = performance.now();
		// console.debug('[achievements-monitor] got achievements progress', endTime - startTime, 'ms\n');
		this.currentAchievementsProgress$$.next(currentAchievementProgress?.achievements ?? []);
	}

	private async initQuotas() {
		if (this.achievementQuotas && !!Object.keys(this.achievementQuotas).length) {
			// console.log('achievements already initialized, returning');
			return;
		}

		this.refAchievements = await this.remoteAchievements.loadHsRawAchievements();
		this.achievementQuotas = {};
		for (const ach of this.refAchievements) {
			this.achievementQuotas[ach.id] = ach.quota;
		}
	}

	private async initAchievementsOnGameStart() {
		if (await this.ow.inGame()) {
			await this.assignAchievementsOnGameStart();
		}
		this.ow.addGameInfoUpdatedListener(async (res: any) => {
			if (this.ow.exitGame(res)) {
				this.achievementsOnGameStart$$.next([]);
			} else if ((await this.ow.inGame()) && res.gameChanged) {
				if (!this.achievementsOnGameStart$$.value.length) {
					await this.assignAchievementsOnGameStart();
				}
			}
		});
		this.gameEvents.allEvents.subscribe((gameEvent: GameEvent) => {
			if (gameEvent.type === GameEvent.GAME_START) {
				this.assignAchievementsOnGameStart();
			}
		});
	}

	private async assignAchievementsOnGameStart() {
		const existingAchievements = await this.achievementsManager.getAchievements(true);
		if (!existingAchievements) {
			return;
		}

		console.log('[achievements-monitor] assigning previous achievements', existingAchievements.length);
		this.achievementsOnGameStart$$.next(existingAchievements);
	}
}

export interface AchievementsProgressTracking {
	readonly id: number;
	readonly name: string;
	readonly text: string;
	readonly quota: number;
	readonly progressThisGame: number;
	readonly progressTotal: number;
}
