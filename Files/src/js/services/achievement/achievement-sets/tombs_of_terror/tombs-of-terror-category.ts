import { AchievementCategoryProvider } from '../achievement-category-provider';
import { TombsOfTerrorBossSetProvider } from './tombs-of-terror-boss';
import { TombsOfTerrorPassivesSetProvider } from './tombs-of-terror-passves';
import { TombsOfTerrorTreasuresSetProvider } from './tombs-of-terror-treasures';

export class TombsOfTerrorCategoryProvider extends AchievementCategoryProvider {
	constructor() {
		super('tombs_of_terror', 'Tombs of Terror', 'tombs_of_terror', [
			new TombsOfTerrorTreasuresSetProvider(),
			new TombsOfTerrorPassivesSetProvider(),
			new TombsOfTerrorBossSetProvider(),
		]);
	}
}
