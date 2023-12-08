import { Injectable } from '@angular/core';
import { AchievementsRefLoaderService, HsRefAchievement } from '@firestone/achievements/data-access';
import { HsAchievementInfo, HsAchievementsInfo, MemoryInspectionService } from '@firestone/memory';
import { GameStatusService } from '@firestone/shared/common/service';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { OverwolfService } from '@firestone/shared/framework/core';
import { BehaviorSubject, combineLatest, distinctUntilChanged, filter, skipWhile, take, tap } from 'rxjs';
import { GameEvent } from '../../models/game-event';
import { GameEventsEmitterService } from '../game-events-emitter.service';
import { AchievementsRemovePinnedAchievementsEvent } from '../mainwindow/store/processors/achievements/achievements-remove-pinned-achievements';
import { AppUiStoreFacadeService } from '../ui-store/app-ui-store-facade.service';
import { arraysEqual, deepEqual } from '../utils';
import { buildAchievementHierarchy } from './achievement-utils';
import { AchievementsStateManagerService } from './achievements-state-manager.service';
import { AchievementsMemoryMonitor } from './data/achievements-memory-monitor.service';

@Injectable()
export class AchievementsLiveProgressTrackingService {
	public achievementsProgressTracking$$ = new SubscriberAwareBehaviorSubject<readonly AchievementsProgressTracking[]>(
		[],
	);

	private achievementQuotas: { [achievementId: number]: number };
	private refAchievements: readonly HsRefAchievement[];

	private achievementIdsToTrack$$ = new BehaviorSubject<readonly number[]>([]);
	private achievementsOnGameStart$$ = new BehaviorSubject<readonly HsAchievementInfo[]>([]);
	private currentAchievementsProgress$$ = new BehaviorSubject<readonly HsAchievementInfo[]>([]);

	constructor(
		private readonly gameEvents: GameEventsEmitterService,
		private readonly store: AppUiStoreFacadeService,
		private readonly refLoaderService: AchievementsRefLoaderService,
		private readonly achievementsMemoryMonitor: AchievementsMemoryMonitor,
		private readonly stateManager: AchievementsStateManagerService,
		private readonly memory: MemoryInspectionService,
		private readonly ow: OverwolfService,
		private readonly gameStatus: GameStatusService,
	) {
		window['achievementsMonitor'] = this;
		this.init();
	}

	private init() {
		this.achievementsProgressTracking$$.onFirstSubscribe(async () => {
			console.debug('[achievements-live-progress-tracking] init');
			await this.store.initComplete();

			combineLatest([this.gameStatus.inGame$$, this.store.listenPrefs$((prefs) => prefs.showLottery)])
				.pipe(
					tap((info) => console.debug('[achievements-live-progress-tracking] will track?', info)),
					filter(([inGame, [showLottery]]) => inGame && showLottery),
					tap((info) => console.debug('[achievements-live-progress-tracking] will track 2', info)),
					take(1),
				)
				.subscribe(async () => {
					console.log('[achievements-live-progress-tracking] init');
					await this.initQuotas();
					await this.initAchievementsOnGameStart();
					const achievementsOnGameStart$ = this.achievementsOnGameStart$$.pipe(
						distinctUntilChanged((a, b) => deepEqual(a, b)),
					);
					const currentAchievementProgress$ = this.currentAchievementsProgress$$.pipe(
						distinctUntilChanged((a, b) => deepEqual(a, b)),
					);
					// TODO: refresh this when an achievement gets completed
					combineLatest([
						this.store.listenPrefs$((prefs) => prefs.pinnedAchievementIds),
						achievementsOnGameStart$,
					])
						.pipe(distinctUntilChanged((a, b) => arraysEqual(a, b)))
						.subscribe(async ([[pinnedAchievementIds], achievementsOnGameStart]) => {
							// console.debug(
							// 	'[achievements-live-progress-tracking] pinnedAchievementIds',
							// 	pinnedAchievementIds,
							// 	achievementsOnGameStart,
							// 	this.refAchievements,
							// );
							const mappedAchiements: readonly { id: number; achievement: HsRefAchievement }[] =
								pinnedAchievementIds
									.map((id) => {
										const achievementToTrack = this.findFirstUncompletedStep(
											id,
											this.refAchievements,
											achievementsOnGameStart,
										);
										return { id: id, achievement: achievementToTrack };
									})
									.filter((a) => !!a.id && !isNaN(a.id));
							const completedAchievements = mappedAchiements.filter((a) => !a.achievement);
							// console.debug(
							// 	'[achievements-live-progress-tracking] completedAchievements',
							// 	completedAchievements,
							// 	mappedAchiements,
							// 	pinnedAchievementIds,
							// 	achievementsOnGameStart,
							// );
							this.store.send(
								new AchievementsRemovePinnedAchievementsEvent(completedAchievements.map((a) => a.id)),
							);

							// When pinning an achievement, we get the first step of the achievements chain
							// We actually want to pin the most recent uncompleted step
							this.achievementIdsToTrack$$.next(
								mappedAchiements.map((a) => a.achievement?.id).filter((id) => !!id),
							);
						});

					combineLatest([currentAchievementProgress$, achievementsOnGameStart$, this.achievementIdsToTrack$$])
						// .pipe(distinctUntilChanged((a, b) => deepEqual(a, b)))
						.subscribe(async ([progress, achievementsOnGameStart, achievementIdsToTrack]) => {
							const finalAchievements = await this.buildAchievementsProgressTracking(
								achievementsOnGameStart,
								progress,
								achievementIdsToTrack,
							);
							// console.debug(
							// 	'[achievements-live-progress-tracking] emitting achievements progress',
							// 	finalAchievements,
							// 	achievementsOnGameStart,
							// 	progress,
							// );
							this.achievementsProgressTracking$$.next(finalAchievements);
						});

					setInterval(() => this.detectAchievementsProgress(), 1500);
				});
		});
	}

	private findFirstUncompletedStep(
		id: number,
		refAchievements: readonly HsRefAchievement[],
		achievementsOnGameStart: readonly HsAchievementInfo[],
	): HsRefAchievement {
		let currentAchievement = refAchievements.find((a) => a.id === id);
		if (!currentAchievement) {
			console.warn(
				'[achievements-live-progress-tracking] could not find achievement',
				id,
				refAchievements?.length,
			);
			console.debug('[achievements-live-progress-tracking] could not find achievement', id, refAchievements);
			return null;
		}

		let currentCompletion = achievementsOnGameStart.find((a) => a.id === id)?.progress ?? 0;
		//console.debug('[achievements-live-progress-tracking] currentAchievement', currentAchievement, currentCompletion);
		while (currentCompletion > 0 && currentCompletion >= currentAchievement.quota) {
			const nextStepId = currentAchievement.nextTierId;
			currentAchievement = !!nextStepId ? refAchievements.find((a) => a.id === nextStepId) : null;
			currentCompletion = !!nextStepId
				? achievementsOnGameStart.find((a) => a.id === nextStepId)?.progress ?? 0
				: 0;
			//console.debug('[achievements-live-progress-tracking] currentAchievement', currentAchievement, currentCompletion);
		}
		return currentAchievement;
	}

	private async buildAchievementsProgressTracking(
		achievementsOnGameStart: readonly HsAchievementInfo[],
		progress: readonly HsAchievementInfo[],
		achievementIdsToTrack: readonly number[],
	): Promise<readonly AchievementsProgressTracking[]> {
		const groupedAchievements = await this.stateManager.groupedAchievements$$.getValueWithInit();
		return (
			achievementIdsToTrack?.map((id) => {
				const currentProgress = progress.find((a) => a.id === id);
				const previousAchievement = achievementsOnGameStart?.find((a) => a.id === id);
				const refAchievement = this.refAchievements.find((a) => a.id === id);
				const quota = this.achievementQuotas[id];
				const result: AchievementsProgressTracking = {
					id: id,
					name: refAchievement?.name ?? 'Unknown achievement',
					text: refAchievement?.description?.replaceAll('$q', '' + quota),
					quota: quota,
					progressThisGame: !!currentProgress
						? currentProgress.progress - (previousAchievement?.progress ?? 0)
						: 0,
					progressTotal: !!currentProgress
						? currentProgress.progress
						: achievementsOnGameStart.find((a) => a.id === id)?.progress ?? 0,
					rewardTrackXp: refAchievement?.rewardTrackXp,
					hierarchy: buildAchievementHierarchy(id, groupedAchievements)?.categories?.map((c) => c.name),
				};
				// console.debug(
				// 	'[achievements-live-progress-tracking] built progress',
				// 	result,
				// 	quota,
				// 	id,
				// 	this.achievementQuotas,
				// );
				return result;
			}) ?? []
		);
	}

	private async detectAchievementsProgress() {
		if (!this.achievementIdsToTrack$$.value?.length) {
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
		const useIndexDetection = this.achievementIdsToTrack$$.value.every((id) => currentProgressIds.includes(id));
		// console.debug(
		// 	'[achievements-live-progress-tracking] using index detection?',
		// 	useIndexDetection,
		// 	this.achievementIdsToTrack,
		// 	currentProgressIds,
		// 	this.currentAchievementsProgress$$.value,
		// );
		if (!useIndexDetection) {
			currentAchievementProgress = await this.memory.getInGameAchievementsProgressInfo(
				this.achievementIdsToTrack$$.value,
			);
		} else {
			const indexes = this.currentAchievementsProgress$$.value.map((a) => a.index);
			currentAchievementProgress = await this.memory.getInGameAchievementsProgressInfoByIndex(indexes);
			// Check if we got the right achievements
			// This means that the achievements returned have the same ids as the achievementIdsToTrack
			// const currentProgressIds = currentAchievementProgress?.achievements?.map((a) => a.id);
			// if (!arraysEqual([...currentProgressIds].sort(), [...this.achievementIdsToTrack])) {
			// 	console.warn(
			// 		'[achievements-live-progress-tracking] wrong achievements returned, falling back to non-index detection',
			// 		currentAchievementProgress,
			// 		this.achievementIdsToTrack,
			// 	);
			// 	currentAchievementProgress = await this.memory.getInGameAchievementsProgressInfo(
			// 		this.achievementIdsToTrack,
			// 	);
			// }
		}

		const endTime = performance.now();
		// console.debug('[achievements-live-progress-tracking] got achievements progress', endTime - startTime, 'ms\n');
		this.currentAchievementsProgress$$.next(currentAchievementProgress?.achievements ?? []);
	}

	private async initQuotas() {
		if (this.achievementQuotas && !!Object.keys(this.achievementQuotas).length) {
			// console.log('achievements already initialized, returning');
			return;
		}

		return new Promise<void>((resolve) => {
			this.achievementQuotas = {};
			this.refLoaderService.refData$$
				.pipe(
					skipWhile((refData) => !refData?.achievements?.length),
					take(1),
				)
				.subscribe((refData) => {
					this.refAchievements = refData?.achievements ?? [];
					for (const ach of this.refAchievements) {
						this.achievementQuotas[ach.id] = ach.quota;
					}
					console.log(
						'[achievements-live-progress-tracking] loaded ref achievements and built quotas',
						this.refAchievements?.length,
					);
					resolve();
				});
		});
		// this.refLoaderService.getLatestRefData();
	}

	private async initAchievementsOnGameStart() {
		if (await this.ow.inGame()) {
			await this.assignAchievementsOnGameStart();
		}
		this.ow.addGameInfoUpdatedListener(async (res: any) => {
			if (this.ow.exitGame(res)) {
				// this.achievementsOnGameStart$$.next([]);
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
		const existingAchievements = await this.achievementsMemoryMonitor.achievementsFromMemory$$.getValueWithInit();
		if (!existingAchievements) {
			return;
		}

		console.log(
			'[achievements-live-progress-tracking] assigning previous achievements',
			existingAchievements.length,
		);
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
	readonly rewardTrackXp: number;
	readonly hierarchy: readonly string[];
}
