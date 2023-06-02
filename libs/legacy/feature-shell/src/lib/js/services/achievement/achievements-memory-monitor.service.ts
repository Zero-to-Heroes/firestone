import { Injectable } from '@angular/core';
import { OverwolfService } from '@firestone/shared/framework/core';
import { BehaviorSubject, debounceTime, distinctUntilChanged } from 'rxjs';
import { MemoryUpdate } from '../../models/memory/memory-update';
import { Events } from '../events.service';
import { MemoryInspectionService } from '../plugins/memory-inspection.service';
import { PreferencesService } from '../preferences.service';
import { HsAchievementsInfo } from './achievements-info';

@Injectable()
export class AchievementsMemoryMonitor {
	public nativeAchievements$$ = new BehaviorSubject<HsAchievementsInfo>(null);

	private numberOfCompletedAchievements$$ = new BehaviorSubject<number>(0);

	constructor(
		private readonly events: Events,
		private readonly memory: MemoryInspectionService,
		private readonly ow: OverwolfService,
		private readonly prefs: PreferencesService,
	) {
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
			.pipe(distinctUntilChanged(), debounceTime(1000))
			.subscribe(async (numberOfCompletedAchievements) => {
				const achievementsFromMemory = await this.memory.getAchievementsInfo();
				this.nativeAchievements$$.next(achievementsFromMemory);
			});
	}
}
