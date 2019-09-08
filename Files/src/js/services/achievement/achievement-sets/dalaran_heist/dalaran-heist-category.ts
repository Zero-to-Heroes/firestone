import { AchievementCategoryProvider } from '../achievement-category-provider';
import { DalaranHeistBossSetProvider } from './dalaran-heist-boss';
import { DalaranHeistPassivesSetProvider } from './dalaran-heist-passves';
import { DalaranHeistTreasuresSetProvider } from './dalaran-heist-treasures';

export class DalaranHeistCategoryProvider extends AchievementCategoryProvider {
	constructor() {
		super('dalaran_heist', 'Dalaran Heist', 'dalaran_heist', [
			new DalaranHeistTreasuresSetProvider(),
			new DalaranHeistPassivesSetProvider(),
			new DalaranHeistBossSetProvider(),
		]);
	}
}
