import { BattlegroundsCategory } from '../battlegrounds-category';

export class BattlegroundsPersonalStatsHeroDetailsCategory extends BattlegroundsCategory {
	public readonly heroId: string;

	public static create(
		base: BattlegroundsPersonalStatsHeroDetailsCategory,
	): BattlegroundsPersonalStatsHeroDetailsCategory {
		return Object.assign(new BattlegroundsPersonalStatsHeroDetailsCategory(), base);
	}
}
