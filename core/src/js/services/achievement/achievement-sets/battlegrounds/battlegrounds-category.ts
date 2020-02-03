import { AchievementCategoryProvider } from '../achievement-category-provider';
import { BattlegroundsAmazingPlaysSetProvider } from './battlegrounds-amazing-plays';
import { BattlegroundsCompetitiveSetProvider } from './battlegrounds-competitive';
import { BattlegroundsHeroPowersSetProvider } from './battlegrounds-hero-powers';
import { BattlegroundsMinionsSetProvider } from './battlegrounds-minions';
import { BattlegroundsTrackingSetProvider } from './battlegrounds-tracking';

export class BattlegroundsCategoryProvider extends AchievementCategoryProvider {
	constructor() {
		super('battlegrounds', 'Battlegrounds', 'battlegrounds', [
			new BattlegroundsTrackingSetProvider(),
			new BattlegroundsCompetitiveSetProvider(),
			new BattlegroundsMinionsSetProvider(),
			new BattlegroundsHeroPowersSetProvider(),
			new BattlegroundsAmazingPlaysSetProvider(),
		]);
	}
}
