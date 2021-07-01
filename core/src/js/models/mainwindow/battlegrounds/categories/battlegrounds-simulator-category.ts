import { BattlegroundsCategory } from '../battlegrounds-category';

export class BattlegroundsSimulatorCategory extends BattlegroundsCategory {
	// readonly stats: BgsStats;

	constructor() {
		super();
		// @ts-ignore
		this.id = 'bgs-category-simulator';
		// @ts-ignore
		this.name = 'Simulator';
	}

	public static create(base: BattlegroundsSimulatorCategory): BattlegroundsSimulatorCategory {
		return Object.assign(new BattlegroundsSimulatorCategory(), base);
	}
}
