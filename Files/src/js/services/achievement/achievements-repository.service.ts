import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AchievementCategory } from '../../models/achievement-category';
import { AchievementSet } from '../../models/achievement-set';
import { AchievementCategoryProvider } from './achievement-sets/achievement-category-provider';
import { AmazingPlaysCategoryProvider } from './achievement-sets/amazing-plays/amazing-plays-category';
import { DalaranHeistCategoryProvider } from './achievement-sets/dalaran_heist/dalaran-heist-category';
import { DungeonRunCategoryProvider } from './achievement-sets/dungeon-run/dungeon-run-category';
import { MonsterHuntCategoryProvider } from './achievement-sets/monster_hunt/monster-hunt-category';
import { RumbleRunCategoryProvider } from './achievement-sets/rumble_run/rumble-run-category';
import { SetProvider } from './achievement-sets/set-provider';
import { AchievementsStorageService } from './achievements-storage.service';
import { AchievementsLoaderService } from './data/achievements-loader.service';

@Injectable()
export class AchievementsRepository {
	public modulesLoaded = new BehaviorSubject<boolean>(false);

	private setProviders: readonly SetProvider[] = [];
	private categories: readonly AchievementCategory[] = [];

	constructor(private storage: AchievementsStorageService, private achievementsLoader: AchievementsLoaderService) {
		this.init();
	}

	public async loadAggregatedAchievements(): Promise<AchievementSet[]> {
		const [allAchievements, completedAchievements] = await Promise.all([
			this.achievementsLoader.getAchievements(),
			this.storage.loadAchievements(),
		]);
		return this.setProviders.map(provider => provider.provide(allAchievements, completedAchievements));
	}

	public getCategories(): readonly AchievementCategory[] {
		return this.categories;
	}

	private async init() {
		await this.achievementsLoader.initializeAchievements();
		this.buildCategories();
		this.modulesLoaded.next(true);
	}

	private buildCategories() {
		const categoryProviders: readonly AchievementCategoryProvider[] = [
			new AmazingPlaysCategoryProvider(),
			new DungeonRunCategoryProvider(),
			new MonsterHuntCategoryProvider(),
			new RumbleRunCategoryProvider(),
			new DalaranHeistCategoryProvider(),
		];

		this.categories = categoryProviders.map(provider => provider.buildCategory());
		this.setProviders = categoryProviders.map(provider => provider.setProviders).reduce((a, b) => a.concat(b));
	}
}
