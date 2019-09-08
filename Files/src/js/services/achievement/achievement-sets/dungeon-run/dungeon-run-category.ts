import { AchievementCategoryProvider } from '../achievement-category-provider';
import { DungeonRunBossSetProvider } from './dungeon-run-boss';
import { DungeonRunPassivesSetProvider } from './dungeon-run-passives';
import { DungeonRunProgressionSetProvider } from './dungeon-run-progression';
import { DungeonRunTreasuresSetProvider } from './dungeon-run-treasures';

export class DungeonRunCategoryProvider extends AchievementCategoryProvider {
	constructor() {
		super('dungeon_run', 'Dungeon Run', 'dungeon_run', [
			new DungeonRunProgressionSetProvider(),
			new DungeonRunBossSetProvider(),
			new DungeonRunTreasuresSetProvider(),
			new DungeonRunPassivesSetProvider(),
		]);
	}
}
