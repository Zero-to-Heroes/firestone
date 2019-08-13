import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AchievementCategory } from '../../models/achievement-category.js';
import { AchievementSet } from '../../models/achievement-set';
import { AchievementConfService } from './achievement-conf.service.js';
import { DalaranHeistBossSetProvider } from './achievement-sets/dalaran-heist-boss.js';
import { DalaranHeistPassivesSetProvider } from './achievement-sets/dalaran-heist-passive.js';
import { DalaranHeistTreasureSetProvider } from './achievement-sets/dalaran-heist-treasure.js';
import { DungeonRunBossSetProvider } from './achievement-sets/dungeon-run-boss';
import { DungeonRunProgressionSetProvider } from './achievement-sets/dungeon-run-progression.js';
import { DungeonRunTreasureSetProvider } from './achievement-sets/dungeon-run-treasure.js';
import { DungeonRunPassivesSetProvider } from './achievement-sets/dungeon-un-passive.js';
import { MonsterHuntBossSetProvider } from './achievement-sets/monster-hunt-boss.js';
import { MonsterHuntPassivesSetProvider } from './achievement-sets/monster-hunt-passive.js';
import { MonsterHuntProgressionSetProvider } from './achievement-sets/monster-hunt-progression.js';
import { MonsterHuntTreasureSetProvider } from './achievement-sets/monster-hunt-treasure.js';
import { RumbleRunPassivesSetProvider } from './achievement-sets/rumble-passive.js';
import { RumbleRunProgressionSetProvider } from './achievement-sets/rumble-progression.js';
import { RumbleRunShrinePlaySetProvider } from './achievement-sets/rumble-shrine-play.js';
import { RumbleRunTeammatesSetProvider } from './achievement-sets/rumble-teammate.js';
import { SetProvider } from './achievement-sets/set-provider';
import { AchievementsStorageService } from './achievements-storage.service';
import { AchievementsLoaderService } from './data/achievements-loader.service.js';

@Injectable()
export class AchievementsRepository {
	public modulesLoaded = new BehaviorSubject<boolean>(false);

	private setProviders: SetProvider[] = [];
	private categories: AchievementCategory[] = [];

	constructor(
		private storage: AchievementsStorageService,
		private conf: AchievementConfService,
		private achievementsLoader: AchievementsLoaderService,
	) {
		this.init();
	}

	public async loadAggregatedAchievements(): Promise<AchievementSet[]> {
		const [allAchievements, completedAchievements] = await Promise.all([
			this.achievementsLoader.getAchievements(),
			this.storage.loadAchievements(),
		]);
		return this.setProviders.map(provider => provider.provide(allAchievements, completedAchievements));
	}

	public getCategories(): AchievementCategory[] {
		return this.categories;
	}

	private async init() {
		await this.achievementsLoader.initializeAchievements();
		this.buildCategories();
		this.modulesLoaded.next(true);
	}

	private buildCategories() {
		// Initialize set providers
		const dungeonRunProgressionProvider = new DungeonRunProgressionSetProvider(this.conf);
		const dungeonRunBossProvider = new DungeonRunBossSetProvider(this.conf);
		const dungeonRunTreasureProvider = new DungeonRunTreasureSetProvider(this.conf);
		const dungeonRunPassivesProvider = new DungeonRunPassivesSetProvider(this.conf);
		const monsterHuntProgressProvider = new MonsterHuntProgressionSetProvider(this.conf);
		const monsterHuntBossProvider = new MonsterHuntBossSetProvider(this.conf);
		const monsterHuntTreasureProvider = new MonsterHuntTreasureSetProvider(this.conf);
		const monsterHuntPassiveProvider = new MonsterHuntPassivesSetProvider(this.conf);
		const rumbleRunProgressionProvider = new RumbleRunProgressionSetProvider(this.conf);
		const rumbleRunShrinePlayProvider = new RumbleRunShrinePlaySetProvider(this.conf);
		const rumbleRunTeammateProvider = new RumbleRunTeammatesSetProvider(this.conf);
		const rumbleRunPassiveProvider = new RumbleRunPassivesSetProvider(this.conf);
		const dalaranHeistTreasureProvider = new DalaranHeistTreasureSetProvider(this.conf);
		const dalaranHeistPassiveProvider = new DalaranHeistPassivesSetProvider(this.conf);
		const dalaranHeistBossProvider = new DalaranHeistBossSetProvider(this.conf);

		this.setProviders = [
			dungeonRunProgressionProvider,
			dungeonRunBossProvider,
			dungeonRunTreasureProvider,
			dungeonRunPassivesProvider,
			monsterHuntProgressProvider,
			monsterHuntBossProvider,
			monsterHuntTreasureProvider,
			monsterHuntPassiveProvider,
			rumbleRunProgressionProvider,
			rumbleRunShrinePlayProvider,
			rumbleRunTeammateProvider,
			rumbleRunPassiveProvider,
			dalaranHeistPassiveProvider,
			dalaranHeistTreasureProvider,
			dalaranHeistBossProvider,
		];
		this.categories = [
			new AchievementCategory('dungeon_run', 'Dungeon Run', 'dungeon_run', [
				dungeonRunProgressionProvider.id,
				dungeonRunBossProvider.id,
				dungeonRunTreasureProvider.id,
				dungeonRunPassivesProvider.id,
			]),
			new AchievementCategory('monster_hunt', 'Monster Hunt', 'monster_hunt', [
				monsterHuntProgressProvider.id,
				monsterHuntBossProvider.id,
				monsterHuntTreasureProvider.id,
				monsterHuntPassiveProvider.id,
			]),
			new AchievementCategory('rumble_run', 'Rumble Run', 'rumble_run', [
				rumbleRunProgressionProvider.id,
				rumbleRunShrinePlayProvider.id,
				rumbleRunTeammateProvider.id,
				rumbleRunPassiveProvider.id,
			]),
			new AchievementCategory('dalaran_heist', 'Dalaran Heist', 'dalaran_heist', [
				dalaranHeistPassiveProvider.id,
				dalaranHeistTreasureProvider.id,
				dalaranHeistBossProvider.id,
			]),
		];
	}
}
