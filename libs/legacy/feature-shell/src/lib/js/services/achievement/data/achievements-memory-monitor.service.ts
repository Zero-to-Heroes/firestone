import { Injectable } from '@angular/core';
import { BehaviorSubject, debounceTime, distinctUntilChanged, filter } from 'rxjs';
import { MemoryUpdate } from '../../../models/memory/memory-update';
import { Events } from '../../events.service';
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
		this.events.on(Events.MEMORY_UPDATE).subscribe(async (event) => {
			const changes = event.data[0] as MemoryUpdate;
			if (changes.NumberOfAchievementsCompleted) {
				this.numberOfCompletedAchievements$$.next(changes.NumberOfAchievementsCompleted);
			}
		});

		this.numberOfCompletedAchievements$$
			.pipe(
				filter((value) => !!value),
				distinctUntilChanged(),
				debounceTime(1000),
			)
			.subscribe(async (numberOfCompletedAchievements) => {
				const achievementsFromMemory = await this.memory.getAchievementsInfo();
				console.debug(
					'[achievements-memory-monitor] updated achievements from memory',
					numberOfCompletedAchievements,
					achievementsFromMemory,
				);
				this.nativeAchievements$$.next(achievementsFromMemory.achievements);
			});
		this.numberOfCompletedAchievements$$
			.pipe(
				filter((value) => !!value),
				distinctUntilChanged(),
				debounceTime(1000),
			)
			.subscribe(async (numberOfCompletedAchievements) => {
				const achievementCategories = await this.memory.getAchievementCategories();
				console.debug(
					'[achievements-memory-monitor] updated achievement categories',
					numberOfCompletedAchievements,
					achievementCategories,
				);
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
