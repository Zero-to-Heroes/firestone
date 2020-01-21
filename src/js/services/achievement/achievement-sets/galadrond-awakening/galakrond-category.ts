import { AchievementCategoryProvider } from '../achievement-category-provider';
import { GalakrondTrackingSetProvider } from './galakrond-tracking';

export class GalakrondCategoryProvider extends AchievementCategoryProvider {
	constructor() {
		super('galakrond', 'Galakrond', 'galakrond', [
			new GalakrondTrackingSetProvider(),
		]);
	}
}
