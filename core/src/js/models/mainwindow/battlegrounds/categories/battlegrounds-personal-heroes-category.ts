import { BattlegroundsCategory } from '../battlegrounds-category';

export class BattlegroundsPersonalHeroesCategory extends BattlegroundsCategory {
	constructor() {
		super();
		// @ts-ignore
		this.id = 'bgs-category-personal-heroes';
	}

	public static create(base: BattlegroundsPersonalHeroesCategory): BattlegroundsPersonalHeroesCategory {
		return Object.assign(new BattlegroundsPersonalHeroesCategory(), base);
	}
}
