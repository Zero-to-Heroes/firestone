import { AchievementCategoryProvider } from '../achievement-category-provider';
import { DeckbuildingSetProvider } from './deckbuilding';

export class DeckbuildingCategoryProvider extends AchievementCategoryProvider {
	constructor() {
		super('deckbuilding', 'Deckbuilding', 'deckbuilding', [new DeckbuildingSetProvider()]);
	}
}
