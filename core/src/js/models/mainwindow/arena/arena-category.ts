import { ArenaCategoryType } from './arena-category.type';

export class ArenaCategory {
	readonly id: ArenaCategoryType;
	readonly name: string;
	readonly icon: string;
	readonly enabled: boolean;
	readonly disabledTooltip?: string;

	public static create(base: ArenaCategory): ArenaCategory {
		return Object.assign(new ArenaCategory(), base);
	}
}
