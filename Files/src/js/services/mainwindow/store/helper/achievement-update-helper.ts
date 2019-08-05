import { AchievementSet } from '../../../../models/achievement-set';
import { AchievementsRepository } from '../../../achievement/achievements-repository.service';
import { AchievementsState } from '../../../../models/mainwindow/achievements-state';
import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { AchievementCategory } from '../../../../models/achievement-category';
import { VisualAchievementCategory } from '../../../../models/visual-achievement-category';
import { AchievementStateHelper } from './achievement-state-helper';

export class AchievementUpdateHelper {
	constructor(private achievementsRepository: AchievementsRepository, private helper: AchievementStateHelper) {}

	public async rebuildAchievements(currentState: MainWindowState): Promise<AchievementsState> {
		const globalCategories = await this.buildGlobalCategories();
		return this.helper.updateStateFromNewGlobalCategories(currentState.achievements, globalCategories);
	}

	private async buildGlobalCategories(): Promise<readonly VisualAchievementCategory[]> {
		const globalCategories: AchievementCategory[] = this.achievementsRepository.getCategories();
		const achievementSets: AchievementSet[] = await this.achievementsRepository.loadAggregatedAchievements();
		return globalCategories.map(category => {
			return {
				id: category.id,
				name: category.name,
				icon: category.icon,
				achievementSets: this.buildSetsForCategory(achievementSets, category.achievementSetIds),
			} as VisualAchievementCategory;
		});
	}

	private buildSetsForCategory(achievementSets: AchievementSet[], achievementSetIds: string[]): AchievementSet[] {
		return achievementSets.filter(set => achievementSetIds.indexOf(set.id) !== -1);
	}
}
