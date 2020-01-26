import { AchievementCategoryProvider } from '../achievement-category-provider';
import { GalakrondTrackingSetProvider } from './galakrond-tracking';
import { GalakrondDominationSetProvider } from './galakrond-domination';
import { GalakrondAmazingPlaysSetProvider } from './galakrond-amazing-plays';

export class GalakrondCategoryProvider extends AchievementCategoryProvider {
	constructor() {
		super('galakrond', 'Galakrond', 'galakrond', [
			new GalakrondTrackingSetProvider(),
			new GalakrondDominationSetProvider(),
			new GalakrondAmazingPlaysSetProvider(),
		]);
	}
}
