import { AchievementCategoryProvider } from '../achievement-category-provider';
import { AmazingPlaysSetProvider } from './amazing-plays';

export class AmazingPlaysCategoryProvider extends AchievementCategoryProvider {
	constructor() {
		super('amazing_plays', 'Amazing Plays', 'amazing_plays', [new AmazingPlaysSetProvider()]);
	}
}
