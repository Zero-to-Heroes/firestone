import { AchievementCategoryProvider } from '../achievement-category-provider';
import { MonsterHuntBossSetProvider } from './monster-hunt-boss';
import { MonsterHuntPassivesSetProvider } from './monster-hunt-passves';
import { MonsterHuntProgressionSetProvider } from './monster-hunt-progression';
import { MonsterHuntTreasuresSetProvider } from './monster-hunt-treasures';

export class MonsterHuntCategoryProvider extends AchievementCategoryProvider {
	constructor() {
		super('monster_hunt', 'Monster Hunt', 'monster_hunt', [
			new MonsterHuntProgressionSetProvider(),
			new MonsterHuntBossSetProvider(),
			new MonsterHuntTreasuresSetProvider(),
			new MonsterHuntPassivesSetProvider(),
		]);
	}
}
