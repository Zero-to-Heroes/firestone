import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AchievementCategory } from '../../models/achievement-category';
import { AchievementSet } from '../../models/achievement-set';
import { AchievementCategoryProvider } from './achievement-sets/achievement-category-provider';
import { AmazingPlaysCategoryProvider } from './achievement-sets/amazing-plays/amazing-plays-category';
import { CompetitiveLadderCategoryProvider } from './achievement-sets/competitive-ladder/competitive-ladder-category';
import { DalaranHeistCategoryProvider } from './achievement-sets/dalaran_heist/dalaran-heist-category';
import { DungeonRunCategoryProvider } from './achievement-sets/dungeon-run/dungeon-run-category';
import { MonsterHuntCategoryProvider } from './achievement-sets/monster_hunt/monster-hunt-category';
import { RumbleRunCategoryProvider } from './achievement-sets/rumble_run/rumble-run-category';
import { SetProvider } from './achievement-sets/set-provider';
import { TombsOfTerrorCategoryProvider } from './achievement-sets/tombs_of_terror/tombs-of-terror-category';
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

	public async getCategories(): Promise<readonly AchievementCategory[]> {
		await this.waitForInit();
		return this.categories;
	}

	private async init() {
		await this.achievementsLoader.initializeAchievements();
		this.buildCategories();
		console.log('[achievements-repository] achievements initialised');
		this.modulesLoaded.next(true);
	}

	private buildCategories() {
		const categoryProviders: readonly AchievementCategoryProvider[] = [
			new CompetitiveLadderCategoryProvider(),
			new AmazingPlaysCategoryProvider(),
			new DungeonRunCategoryProvider(),
			new MonsterHuntCategoryProvider(),
			new RumbleRunCategoryProvider(),
			new DalaranHeistCategoryProvider(),
			new TombsOfTerrorCategoryProvider(),
		];

		this.categories = categoryProviders.map(provider => provider.buildCategory());
		this.setProviders = categoryProviders.map(provider => provider.setProviders).reduce((a, b) => a.concat(b));
	}

	private waitForInit(): Promise<void> {
		return new Promise<void>(resolve => {
			const dbWait = () => {
				// console.log('Promise waiting for db');
				if (this.setProviders) {
					// console.log('wait for db init complete');
					resolve();
				} else {
					// console.log('waiting for db init');
					setTimeout(() => dbWait(), 50);
				}
			};
			dbWait();
		});
	}
}
