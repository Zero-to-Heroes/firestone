import { BattlegroundsCategory } from '../battlegrounds-category';

export class BattlegroundsPersonalRatingCategory extends BattlegroundsCategory {
	// readonly stats: BgsStats;

	constructor() {
		super();
		// @ts-ignore
		this.id = 'bgs-category-personal-rating';
		// @ts-ignore
		this.name = 'Rating';
	}

	public static create(base: BattlegroundsPersonalRatingCategory): BattlegroundsPersonalRatingCategory {
		return Object.assign(new BattlegroundsPersonalRatingCategory(), base);
	}
}
