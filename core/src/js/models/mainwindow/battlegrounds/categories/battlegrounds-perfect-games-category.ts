import { BattlegroundsCategory } from '../battlegrounds-category';

export class BattlegroundsPerfectGamesCategory extends BattlegroundsCategory {
	constructor() {
		super();
		// @ts-ignore
		this.id = 'bgs-category-perfect-games';
	}

	public static create(base: BattlegroundsPerfectGamesCategory): BattlegroundsPerfectGamesCategory {
		return Object.assign(new BattlegroundsPerfectGamesCategory(), base);
	}
}
