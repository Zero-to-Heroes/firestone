import { AchievementCategory } from '../../../../models/achievement-category';
import { AchievementSet } from '../../../../models/achievement-set';
import { AchievementsState } from '../../../../models/mainwindow/achievements-state';
import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { NavigationAchievements } from '../../../../models/mainwindow/navigation/navigation-achievements';
import { NavigationState } from '../../../../models/mainwindow/navigation/navigation-state';
import { VisualAchievementCategory } from '../../../../models/visual-achievement-category';
import { AchievementsRepository } from '../../../achievement/achievements-repository.service';
import { AchievementStateHelper } from './achievement-state-helper';

export class AchievementUpdateHelper {
	constructor(private achievementsRepository: AchievementsRepository, private helper: AchievementStateHelper) {}

	public async rebuildAchievements(
		dataState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[AchievementsState, NavigationAchievements]> {
		const globalCategories = await this.buildGlobalCategories(true);
		return this.helper.updateStateFromNewGlobalCategories(
			dataState.achievements,
			navigationState.navigationAchievements,
			globalCategories,
		);
	}

	public async buildGlobalCategories(useCache = false): Promise<readonly VisualAchievementCategory[]> {
		// console.log('[perf] getting global categories');
		const globalCategories: readonly AchievementCategory[] = await this.achievementsRepository.getCategories();
		// console.log('[perf] loading aggregated achievements');
		const achievementSets: AchievementSet[] = await this.achievementsRepository.loadAggregatedAchievements(
			useCache,
		);
		// console.log('[perf] building sets', achievementSets);
		// console.log('[achievements-update] achievementSets', achievementSets);
		const result = globalCategories.map(category => {
			return VisualAchievementCategory.create({
				id: category.id,
				name: category.name,
				icon: category.icon,
				achievementSets: this.buildSetsForCategory(achievementSets, category.achievementSetIds),
			} as VisualAchievementCategory);
		});
		// console.log('[perf] returning result');
		return result;
	}

	private buildSetsForCategory(achievementSets: AchievementSet[], achievementSetIds: string[]): AchievementSet[] {
		return achievementSets.filter(set => achievementSetIds.indexOf(set.id) !== -1);
	}
}
