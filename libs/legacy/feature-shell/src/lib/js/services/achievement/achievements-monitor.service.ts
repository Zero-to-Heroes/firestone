import { Injectable } from '@angular/core';
import { HsRefAchievement } from '@firestone/achievements/data-access';
import { OverwolfService } from '@firestone/shared/framework/core';
import { BehaviorSubject, distinctUntilChanged } from 'rxjs';
import { GameEvent } from '../../models/game-event';
import { FeatureFlags } from '../feature-flags';
import { GameEventsEmitterService } from '../game-events-emitter.service';
import { MemoryInspectionService } from '../plugins/memory-inspection.service';
import { PreferencesService } from '../preferences.service';
import { AppUiStoreFacadeService } from '../ui-store/app-ui-store-facade.service';
import { deepEqual } from '../utils';
import { AchievementsFirestoneChallengeService } from './achievements-firestone-challenges.service';
import { HsAchievementInfo } from './achievements-info';
import { AchievementsManager } from './achievements-manager.service';
import { RemoteAchievementsService } from './remote-achievements.service';

@Injectable()
export class AchievementsMonitor {
	public achievementsProgressTracking$$ = new BehaviorSubject<readonly AchievementsProgressTracking[]>([]);

	private achievementQuotas: { [achievementId: number]: number };
	private achievementsOnGameStart: readonly HsAchievementInfo[];
	private rawAchievements: readonly HsRefAchievement[];

	private currentAchievementsProgress$$ = new BehaviorSubject<readonly HsAchievementInfo[]>(null);

	constructor(
		private readonly gameEvents: GameEventsEmitterService,
		private readonly store: AppUiStoreFacadeService,
		private readonly remoteAchievements: RemoteAchievementsService,
		private readonly achievementsManager: AchievementsManager,
		private readonly memory: MemoryInspectionService,
		private readonly ow: OverwolfService,
		private readonly prefs: PreferencesService,
		private readonly firestoneAchievements: AchievementsFirestoneChallengeService,
	) {
		this.init();
	}

	private async init() {
		if (!FeatureFlags.ACHIEVEMENT_PINS) {
			return;
		}

		await this.store.initComplete();
		await this.initQuotas();
		await this.initAchievementsOnGameStart();
		setInterval(() => this.detectAchievementsProgress(), 500);
		this.currentAchievementsProgress$$
			.pipe(distinctUntilChanged((a, b) => deepEqual(a, b)))
			.subscribe((progress) => {
				const finalAchievements = this.buildAchievementsProgressTracking(
					this.achievementsOnGameStart,
					progress,
				);
				console.debug(
					'[achievements-monitor] emitting achievements progress',
					finalAchievements,
					this.achievementsOnGameStart,
					progress,
				);
				this.achievementsProgressTracking$$.next(finalAchievements);
			});
	}

	private buildAchievementsProgressTracking(
		achievementsOnGameStart: readonly HsAchievementInfo[],
		progress: readonly HsAchievementInfo[],
	): readonly AchievementsProgressTracking[] {
		return (
			progress?.map((p) => {
				const previousAchievement = achievementsOnGameStart?.find((a) => a.id === p.id);
				const refAchievement = this.rawAchievements.find((a) => a.id === p.id);
				const result: AchievementsProgressTracking = {
					id: p.id,
					name: refAchievement?.name ?? 'Unknown achievement',
					quota: this.achievementQuotas[p.id],
					progressThisGame: p.progress - (previousAchievement?.progress ?? 0),
					progressTotal: p.progress,
				};
				return result;
			}) ?? []
		);
	}

	private async detectAchievementsProgress() {
		const prefs = await this.prefs.getPreferences();
		if (!prefs.pinnedAchievementIds?.length) {
			return;
		}

		const currentAchievementProgress = await this.memory.getInGameAchievementsProgressInfo(
			prefs.pinnedAchievementIds,
		);
		this.currentAchievementsProgress$$.next(currentAchievementProgress?.achievements ?? []);
	}

	private async initQuotas() {
		if (this.achievementQuotas && !!Object.keys(this.achievementQuotas).length) {
			// console.log('achievements already initialized, returning');
			return;
		}

		this.rawAchievements = await this.remoteAchievements.loadHsRawAchievements();
		this.achievementQuotas = {};
		for (const ach of this.rawAchievements) {
			this.achievementQuotas[ach.id] = ach.quota;
		}
	}

	private async initAchievementsOnGameStart() {
		if (await this.ow.inGame()) {
			this.assignAchievementsOnGameStart();
		}
		this.ow.addGameInfoUpdatedListener(async (res: any) => {
			if (this.ow.exitGame(res)) {
				this.achievementsOnGameStart = null;
			} else if ((await this.ow.inGame()) && res.gameChanged) {
				if (!this.achievementsOnGameStart) {
					this.assignAchievementsOnGameStart();
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
		this.achievementsOnGameStart = existingAchievements;
	}
}

export interface AchievementsProgressTracking {
	readonly id: number;
	readonly name: string;
	readonly quota: number;
	readonly progressThisGame: number;
	readonly progressTotal: number;
}
