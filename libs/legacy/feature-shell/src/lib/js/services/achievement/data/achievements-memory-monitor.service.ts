import { Injectable } from '@angular/core';
import { BehaviorSubject, debounceTime, distinctUntilChanged, filter } from 'rxjs';
import { GameEvent } from '../../../models/game-event';
import { MemoryUpdate } from '../../../models/memory/memory-update';
import { Events } from '../../events.service';
import { GameEventsEmitterService } from '../../game-events-emitter.service';
import { MemoryInspectionService } from '../../plugins/memory-inspection.service';
import { HsAchievementCategory, HsAchievementInfo } from '../achievements-info';
import { AchievementsStorageService } from '../achievements-storage.service';

@Injectable()
export class AchievementsMemoryMonitor {
	public nativeAchievements$$ = new BehaviorSubject<readonly HsAchievementInfo[]>([]);
	public achievementCategories$$ = new BehaviorSubject<readonly HsAchievementCategory[]>([]);

	private numberOfCompletedAchievements$$ = new BehaviorSubject<number>(0);

	// TODO: add local cache as well, in case the app is launched without the game running

	constructor(
		private readonly events: Events,
		private readonly gameEvents: GameEventsEmitterService,
		private readonly memory: MemoryInspectionService,
		private readonly db: AchievementsStorageService,
	) {
		this.init();
	}

	public async getInGameAchievementsInfo(): Promise<readonly HsAchievementInfo[]> {
		const achievementsFromMemory = await this.memory.getAchievementsInfo();
		console.debug('[achievements-memory-monitor] updated achievements from memory 2', achievementsFromMemory);
		this.nativeAchievements$$.next(achievementsFromMemory?.achievements);
		return achievementsFromMemory?.achievements ?? [];
	}

	private async init() {
		const forceRetrigger$ = new BehaviorSubject<void>(null);
		this.numberOfCompletedAchievements$$
			.pipe(
				filter((value) => !!value),
				distinctUntilChanged(),
				debounceTime(1000),
			)
			.subscribe(() => forceRetrigger$?.next(null));

		this.events.on(Events.MEMORY_UPDATE).subscribe(async (event) => {
			const changes = event.data[0] as MemoryUpdate;
			if (changes.NumberOfAchievementsCompleted) {
				this.numberOfCompletedAchievements$$.next(changes.NumberOfAchievementsCompleted);
			}
		});

		// Also update the achievements (their progress) once a game ends
		this.gameEvents.allEvents.pipe(filter((event) => event.type === GameEvent.GAME_END)).subscribe((event) => {
			forceRetrigger$.next(null);
		});

		forceRetrigger$.subscribe(async () => {
			const achievementsFromMemory = await this.memory.getAchievementsInfo();
			console.debug('[achievements-memory-monitor] updated achievements from memory', achievementsFromMemory);
			this.nativeAchievements$$.next(achievementsFromMemory.achievements);
		});
		forceRetrigger$.subscribe(async () => {
			const achievementCategories = await this.memory.getAchievementCategories();
			console.debug('[achievements-memory-monitor] updated achievement categories', achievementCategories);
			this.achievementCategories$$.next(achievementCategories);
		});

		this.nativeAchievements$$
			.pipe(filter((achievements) => !!achievements?.length))
			.subscribe((nativeAchievements) => {
				console.debug('[achievements-memory-monitor] saving achievements to db', nativeAchievements);
				this.db.saveInGameAchievements({
					achievements: nativeAchievements,
				});
			});
		const achievementsFromDb = await this.db.retrieveInGameAchievements();
		if (achievementsFromDb?.achievements?.length) {
			this.nativeAchievements$$.next(achievementsFromDb.achievements);
		}
	}
}
