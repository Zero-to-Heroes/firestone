import { BattlegroundsCategory } from '../battlegrounds-category';

export class BattlegroundsPersonalStatsCategory extends BattlegroundsCategory {
	// readonly stats: BgsStats;

	constructor() {
		super();
		// @ts-ignore
		this.id = 'bgs-category-personal-stats';
		// @ts-ignore
		this.name = 'Records Broken';
	}

	public static create(base: BattlegroundsPersonalStatsCategory): BattlegroundsPersonalStatsCategory {
		return Object.assign(new BattlegroundsPersonalStatsCategory(), base);
	}
}
