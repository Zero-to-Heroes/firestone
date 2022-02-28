import { BattlegroundsCategory } from '../battlegrounds-category';

export class BattlegroundsPersonalRatingCategory extends BattlegroundsCategory {
	constructor() {
		super();
		// @ts-ignore
		this.id = 'bgs-category-personal-rating';
	}

	public static create(base: BattlegroundsPersonalRatingCategory): BattlegroundsPersonalRatingCategory {
		return Object.assign(new BattlegroundsPersonalRatingCategory(), base);
	}
}
