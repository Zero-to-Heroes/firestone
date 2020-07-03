import { AchievementCategoryProvider } from '../achievement-category-provider';
import { ThijsSetProvider } from './thijs';

export class ThijsCategoryProvider extends AchievementCategoryProvider {
	constructor() {
		super('thijs', 'Thijs', 'thijs', [new ThijsSetProvider()]);
	}
}
