import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { StatsCategory } from './stats-category';
import { StatsFilters } from './stats-filters';

export class StatsState {
	readonly loading: boolean = true;
	readonly categories: readonly StatsCategory[] = [];
	readonly filters: StatsFilters = new StatsFilters();

	readonly initComplete: boolean = false;

	public static create(base: Partial<NonFunctionProperties<StatsState>>): StatsState {
		return Object.assign(new StatsState(), base);
	}

	public update(base: Partial<NonFunctionProperties<StatsState>>): StatsState {
		return Object.assign(new StatsState(), this, base);
	}

	public findCategory(categoryId: string): StatsCategory | undefined {
		const result = this.categories?.find((cat) => cat.id === categoryId);
		return result;
	}
}
