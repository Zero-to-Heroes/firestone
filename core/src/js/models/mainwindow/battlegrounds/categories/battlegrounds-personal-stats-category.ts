import { BattlegroundsCategory } from '../battlegrounds-category';

export class BattlegroundsPersonalStatsCategory extends BattlegroundsCategory {
	constructor() {
		super();
		// @ts-ignore
		this.id = 'bgs-category-personal-stats';
	}

	public static create(base: BattlegroundsPersonalStatsCategory): BattlegroundsPersonalStatsCategory {
		return Object.assign(new BattlegroundsPersonalStatsCategory(), base);
	}
}
