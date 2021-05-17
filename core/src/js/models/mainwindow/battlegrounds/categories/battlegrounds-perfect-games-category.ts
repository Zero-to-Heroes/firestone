import { BattlegroundsCategory } from '../battlegrounds-category';

export class BattlegroundsPerfectGamesCategory extends BattlegroundsCategory {
	// readonly stats: BgsStats;

	constructor() {
		super();
		// @ts-ignore
		this.id = 'bgs-category-perfect-games';
		// @ts-ignore
		this.name = 'Perfect Games';
	}

	public static create(base: BattlegroundsPerfectGamesCategory): BattlegroundsPerfectGamesCategory {
		return Object.assign(new BattlegroundsPerfectGamesCategory(), base);
	}
}
