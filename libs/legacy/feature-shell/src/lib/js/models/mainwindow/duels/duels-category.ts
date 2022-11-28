import { DuelsCategoryType } from './duels-category.type';

export class DuelsCategory {
	readonly id: DuelsCategoryType;
	readonly name: string;
	readonly icon: string;
	readonly enabled: boolean;
	readonly disabledTooltip?: string;
	readonly categories: readonly DuelsCategory[];

	public static create(base: DuelsCategory): DuelsCategory {
		return Object.assign(new DuelsCategory(), base);
	}
}
