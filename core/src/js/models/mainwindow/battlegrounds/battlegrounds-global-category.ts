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
}
