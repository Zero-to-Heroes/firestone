import { AchievementCategory } from '../../../models/achievement-category';
import { SetProvider } from './set-provider';

export abstract class AchievementCategoryProvider {
	constructor(
		protected readonly id: string,
		protected readonly name: string,
		protected readonly icon: string,
		public readonly setProviders: readonly SetProvider[],
	) {}

	public buildCategory() {
		return new AchievementCategory(this.id, this.name, this.icon, this.setProviders.map(provider => provider.id));
	}
}
