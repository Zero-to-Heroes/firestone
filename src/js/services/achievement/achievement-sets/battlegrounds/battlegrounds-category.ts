import { AchievementCategoryProvider } from '../achievement-category-provider';
import { BattlegroundsTrackingSetProvider } from './battlegrounds-tracking';

export class BattlegroundsCategoryProvider extends AchievementCategoryProvider {
	constructor() {
		super('battlegrounds', 'Batlegrounds', 'battlegrounds', [new BattlegroundsTrackingSetProvider()]);
	}
}
