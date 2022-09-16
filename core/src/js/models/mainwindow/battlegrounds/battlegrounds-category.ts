import { NonFunctionProperties } from '../../../services/utils';

export class BattlegroundsCategory {
	readonly id:
		| 'bgs-category-overview'
		| 'bgs-category-personal-heroes'
		| 'bgs-category-personal-quests'
		| 'bgs-category-personal-hero-details-' // Also add the hero card Id as suffix
		| 'bgs-category-personal-rating'
		| 'bgs-category-personal-stats'
		| 'bgs-category-perfect-games'
		| 'bgs-category-simulator'
		| 'bgs-category-personal-ai';
	readonly name: string;
	readonly icon: string;
	readonly disabledTooltip?: string;
	readonly categories: readonly BattlegroundsCategory[] = [];

	public static create(base: Partial<NonFunctionProperties<BattlegroundsCategory>>): BattlegroundsCategory {
		return Object.assign(new BattlegroundsCategory(), base);
	}

	public findCategory(categoryId: string) {
		if (this.id === categoryId) {
			return this;
		}

		const result = this.categories?.find((cat) => cat.id === categoryId);
		if (result) {
			return result;
		}

		return this.categories
			.map((cat) => cat.categories)
			.reduce((a, b) => a.concat(b), [])
			.find((cat) => cat.findCategory(categoryId));
	}
}
