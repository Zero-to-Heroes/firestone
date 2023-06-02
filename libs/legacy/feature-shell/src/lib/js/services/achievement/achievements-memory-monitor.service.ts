import { Injectable } from '@angular/core';
import { BehaviorSubject, debounceTime, distinctUntilChanged, filter } from 'rxjs';
import { MemoryUpdate } from '../../models/memory/memory-update';
import { Events } from '../events.service';
import { MemoryInspectionService } from '../plugins/memory-inspection.service';
import { HsAchievementCategory, HsAchievementInfo } from './achievements-info';

@Injectable()
export class AchievementsMemoryMonitor {
	public nativeAchievements$$ = new BehaviorSubject<readonly HsAchievementInfo[]>([]);
	public achievementCategories$$ = new BehaviorSubject<readonly HsAchievementCategory[]>([]);

	private numberOfCompletedAchievements$$ = new BehaviorSubject<number>(0);

	constructor(private readonly events: Events, private readonly memory: MemoryInspectionService) {
		this.init();
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
	}
}
