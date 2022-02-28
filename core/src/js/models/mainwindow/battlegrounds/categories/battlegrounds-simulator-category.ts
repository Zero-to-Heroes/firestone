import { BattlegroundsCategory } from '../battlegrounds-category';

export class BattlegroundsSimulatorCategory extends BattlegroundsCategory {
	constructor() {
		super();
		// @ts-ignore
		this.id = 'bgs-category-simulator';
	}

	public static create(base: BattlegroundsSimulatorCategory): BattlegroundsSimulatorCategory {
		return Object.assign(new BattlegroundsSimulatorCategory(), base);
	}
}
