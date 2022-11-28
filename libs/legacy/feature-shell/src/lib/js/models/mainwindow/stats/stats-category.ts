import { StatsCategoryType } from './stats-category.type';

export class StatsCategory {
	readonly id: StatsCategoryType;
	readonly name: string;
	readonly icon: string;
	readonly enabled: boolean;
	readonly disabledTooltip?: string;

	public static create(base: StatsCategory): StatsCategory {
		return Object.assign(new StatsCategory(), base);
	}
}
