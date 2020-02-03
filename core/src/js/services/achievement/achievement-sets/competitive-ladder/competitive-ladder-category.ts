import { AchievementCategoryProvider } from '../achievement-category-provider';
import { CompetitiveLadderSetProvider } from './competitive-ladder';

export class CompetitiveLadderCategoryProvider extends AchievementCategoryProvider {
	constructor() {
		super('competitive_ladder', 'Ladder', 'competitive_ladder', [new CompetitiveLadderSetProvider()]);
	}
}
