import { BgsHeroStatsFilterId } from '@firestone/battlegrounds/services';
import { BattlegroundsCategory } from '../battlegrounds-category';

export class BattlegroundsPersonalStatsHeroDetailsCategory extends BattlegroundsCategory {
	readonly heroId: string;
	readonly tabs: readonly BgsHeroStatsFilterId[];

	public static create(
		base: BattlegroundsPersonalStatsHeroDetailsCategory,
	): BattlegroundsPersonalStatsHeroDetailsCategory {
		return Object.assign(new BattlegroundsPersonalStatsHeroDetailsCategory(), base);
	}

	public update(base: BattlegroundsPersonalStatsHeroDetailsCategory): BattlegroundsPersonalStatsHeroDetailsCategory {
		return Object.assign(new BattlegroundsPersonalStatsHeroDetailsCategory(), this, base);
	}
}
