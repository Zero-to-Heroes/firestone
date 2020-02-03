import { AchievementCategoryProvider } from '../achievement-category-provider';
import { GlobalTrackingSetProvider } from './global-tracking';

export class GlobalCategoryProvider extends AchievementCategoryProvider {
	constructor() {
		super('global', 'Global', 'globals', [new GlobalTrackingSetProvider()]);
	}
}
