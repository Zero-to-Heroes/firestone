import { BattlegroundsCategory } from '../battlegrounds-category';

export class BattlegroundsPersonalHeroesCategory extends BattlegroundsCategory {
	// readonly stats: BgsStats;

	constructor() {
		super();
		// @ts-ignore
		this.id = 'bgs-category-personal-heroes';
		// @ts-ignore
		this.name = 'Heroes';
	}

	public static create(base: BattlegroundsPersonalHeroesCategory): BattlegroundsPersonalHeroesCategory {
		return Object.assign(new BattlegroundsPersonalHeroesCategory(), base);
	}
}
