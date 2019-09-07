import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AchievementCategory } from '../../models/achievement-category';
import { AchievementSet } from '../../models/achievement-set';
import { AchievementConfService } from './achievement-conf.service';
import { AmazingPlaysSetProvider } from './achievement-sets/amazing-plays/amazing-plays';
import { DalaranHeistBossSetProvider } from './achievement-sets/dalaran_heist/dalaran-heist-boss';
import { DalaranHeistPassivesSetProvider } from './achievement-sets/dalaran_heist/dalaran-heist-passves';
import { DalaranHeistTreasuresSetProvider } from './achievement-sets/dalaran_heist/dalaran-heist-treasures';
import { DungeonRunBossSetProvider } from './achievement-sets/dungeon-run/dungeon-run-boss';
import { DungeonRunPassivesSetProvider } from './achievement-sets/dungeon-run/dungeon-run-passives';
import { DungeonRunProgressionSetProvider } from './achievement-sets/dungeon-run/dungeon-run-progression';
import { DungeonRunTreasuresSetProvider } from './achievement-sets/dungeon-run/dungeon-run-treasures';
import { MonsterHuntBossSetProvider } from './achievement-sets/monster_hunt/monster-hunt-boss';
import { MonsterHuntPassivesSetProvider } from './achievement-sets/monster_hunt/monster-hunt-passves';
import { MonsterHuntProgressionSetProvider } from './achievement-sets/monster_hunt/monster-hunt-progression';
import { MonsterHuntTreasuresSetProvider } from './achievement-sets/monster_hunt/monster-hunt-treasures';
import { RumbleRunPassivesSetProvider } from './achievement-sets/rumble_run/rumble-run-passves';
import { RumbleRunProgressionSetProvider } from './achievement-sets/rumble_run/rumble-run-progression';
import { RumbleRunShrinesSetProvider } from './achievement-sets/rumble_run/rumble-run-shrine-play';
import { RumbleRunTeammatesSetProvider } from './achievement-sets/rumble_run/rumble-run-teammates';
import { SetProvider } from './achievement-sets/set-provider';
import { AchievementsStorageService } from './achievements-storage.service';
import { AchievementsLoaderService } from './data/achievements-loader.service';

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
		const dungeonRunTreasureProvider = new DungeonRunTreasuresSetProvider(this.conf);
		const dungeonRunPassivesProvider = new DungeonRunPassivesSetProvider(this.conf);
		const monsterHuntProgressProvider = new MonsterHuntProgressionSetProvider(this.conf);
		const monsterHuntBossProvider = new MonsterHuntBossSetProvider(this.conf);
		const monsterHuntTreasureProvider = new MonsterHuntTreasuresSetProvider(this.conf);
		const monsterHuntPassiveProvider = new MonsterHuntPassivesSetProvider(this.conf);
		const rumbleRunProgressionProvider = new RumbleRunProgressionSetProvider(this.conf);
		const rumbleRunShrinePlayProvider = new RumbleRunShrinesSetProvider(this.conf);
		const rumbleRunTeammateProvider = new RumbleRunTeammatesSetProvider(this.conf);
		const rumbleRunPassiveProvider = new RumbleRunPassivesSetProvider(this.conf);
		const dalaranHeistTreasureProvider = new DalaranHeistTreasuresSetProvider(this.conf);
		const dalaranHeistPassiveProvider = new DalaranHeistPassivesSetProvider(this.conf);
		const dalaranHeistBossProvider = new DalaranHeistBossSetProvider(this.conf);

		const amazingPlaysProvider = new AmazingPlaysSetProvider(this.conf);

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
			amazingPlaysProvider,
		];
		this.categories = [
			new AchievementCategory('amazing_plays', 'Amazing Plays', 'amazing_plays', [amazingPlaysProvider.id]),
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
