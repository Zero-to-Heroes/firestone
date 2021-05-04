import { BattlegroundsAppState } from './battlegrounds-app-state';
import { BattlegroundsCategory } from './battlegrounds-category';

export class BattlegroundsGlobalCategory {
	readonly id: string;
	readonly enabled: boolean;
	readonly name: string;
	readonly disabledTooltip?: string;
	readonly categories: readonly BattlegroundsCategory[];

	public static create(base: BattlegroundsGlobalCategory): BattlegroundsGlobalCategory {
		return Object.assign(new BattlegroundsGlobalCategory(), base);
	}

	public hasSubCategory(categoryId: string): boolean {
		const allCategories = this.categories
			.map((category) => BattlegroundsAppState.extractCategory(category))
			.reduce((a, b) => a.concat(b), []);
		return allCategories.some((cat) => cat.id === categoryId);
	}
}
