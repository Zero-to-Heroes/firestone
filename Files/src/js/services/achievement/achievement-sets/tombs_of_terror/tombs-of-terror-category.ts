import { AchievementCategoryProvider } from '../achievement-category-provider';
import { TombsOfTerrorAmazingPlaysSetProvider } from './tombs-of-terror-amazing-plays';
import { TombsOfTerrorBobTreatsSetProvider } from './tombs-of-terror-bob-treats';
import { TombsOfTerrorBossSetProvider } from './tombs-of-terror-boss';
import { TombsOfTerrorPassivesSetProvider } from './tombs-of-terror-passves';
import { TombsOfTerrorPlagueLordsProvider } from './tombs-of-terror-plague-lors';
import { TombsOfTerrorTreasuresSetProvider } from './tombs-of-terror-treasures';

export class TombsOfTerrorCategoryProvider extends AchievementCategoryProvider {
	constructor() {
		super('tombs_of_terror', 'Tombs of Terror', 'tombs_of_terror', [
			new TombsOfTerrorTreasuresSetProvider(),
			new TombsOfTerrorPassivesSetProvider(),
			new TombsOfTerrorBobTreatsSetProvider(),
			new TombsOfTerrorBossSetProvider(),
			new TombsOfTerrorPlagueLordsProvider(),
			new TombsOfTerrorAmazingPlaysSetProvider(),
		]);
	}
}
