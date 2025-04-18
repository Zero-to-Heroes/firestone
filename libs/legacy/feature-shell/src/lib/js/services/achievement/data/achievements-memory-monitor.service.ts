import { Injectable } from '@angular/core';
import {
	HsAchievementCategory,
	HsAchievementInfo,
	MemoryInspectionService,
	MemoryUpdatesService,
} from '@firestone/memory';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { BehaviorSubject, debounceTime, distinctUntilChanged, filter } from 'rxjs';
import { GameEvent } from '../../../models/game-event';
import { Events } from '../../events.service';
import { GameEventsEmitterService } from '../../game-events-emitter.service';
import { AchievementsStorageService } from '../achievements-storage.service';

@Injectable()
export class AchievementsMemoryMonitor {
	public achievementsFromMemory$$ = new SubscriberAwareBehaviorSubject<readonly HsAchievementInfo[]>([]);
	public achievementCategories$$ = new SubscriberAwareBehaviorSubject<readonly HsAchievementCategory[]>([]);

	private numberOfCompletedAchievements$$ = new BehaviorSubject<number>(0);

	constructor(
		private readonly events: Events,
		private readonly memoryUpdates: MemoryUpdatesService,
		private readonly gameEvents: GameEventsEmitterService,
		private readonly memory: MemoryInspectionService,
		private readonly db: AchievementsStorageService,
	) {
		this.init();
	}

	public async fetchInGameAchievementsInfo(): Promise<readonly HsAchievementInfo[]> {
		const achievementsFromMemory = await this.memory.getAchievementsInfo();
		console.debug('[achievements-memory-monitor] updated achievements from memory 2', achievementsFromMemory);
		this.achievementsFromMemory$$.next(achievementsFromMemory?.achievements);
		return achievementsFromMemory?.achievements ?? [];
	}

	private async init() {
		this.achievementsFromMemory$$.onFirstSubscribe(async () => {
			console.log('[achievements-memory-monitor] init achievementsFromMemory');
			this.initAchievements();
		});
		this.achievementCategories$$.onFirstSubscribe(async () => {
			console.log('[achievements-memory-monitor] init achievementCategories');
			console.debug('[achievements-memory-monitor] init achievementCategories', new Error().stack);
			this.initAchievements();
		});
	}

	private async initAchievements() {
		const forceRetrigger$ = new BehaviorSubject<void>(null);
		this.numberOfCompletedAchievements$$
			.pipe(
				filter((value) => !!value),
				distinctUntilChanged(),
				debounceTime(1000),
			)
			.subscribe(() => forceRetrigger$.next(null));
		// Also update the achievements (their progress) once a game ends
		this.gameEvents.allEvents.pipe(filter((event) => event.type === GameEvent.GAME_END)).subscribe((event) => {
			return;
			forceRetrigger$.next(null);
		});

		this.memoryUpdates.memoryUpdates$$.subscribe(async (changes) => {
			if (changes.NumberOfAchievementsCompleted) {
				this.numberOfCompletedAchievements$$.next(changes.NumberOfAchievementsCompleted);
			}
		});

		forceRetrigger$.subscribe(async () => {
			const achievementsFromMemory = await this.memory.getAchievementsInfo();
			console.debug('[achievements-memory-monitor] updated achievements from memory', achievementsFromMemory);
			this.achievementsFromMemory$$.next(achievementsFromMemory?.achievements ?? []);
		});
		forceRetrigger$.subscribe(async () => {
			const achievementCategories = await this.memory.getAchievementCategories();
			console.debug('[achievements-memory-monitor] updated achievement categories', achievementCategories);
			this.achievementCategories$$.next(achievementCategories);
		});

		this.achievementsFromMemory$$
			.pipe(filter((achievements) => !!achievements?.length))
			.subscribe((nativeAchievements) => {
				console.debug('[achievements-memory-monitor] saving achievements to db', nativeAchievements);
				this.db.saveInGameAchievements({
					achievements: nativeAchievements,
				});
			});
		const achievementsFromDb = await this.db.retrieveInGameAchievements();
		if (achievementsFromDb?.achievements?.length) {
			this.achievementsFromMemory$$.next(achievementsFromDb.achievements);
		}
	}
}
