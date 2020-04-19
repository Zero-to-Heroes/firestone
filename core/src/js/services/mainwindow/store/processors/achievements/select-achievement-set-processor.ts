import { AchievementSet } from '../../../../../models/achievement-set';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationAchievements } from '../../../../../models/mainwindow/navigation/navigation-achievements';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { SelectAchievementSetEvent } from '../../events/achievements/select-achievement-set-event';
import { Processor } from '../processor';

export class SelectAchievementSetProcessor implements Processor {
	public async process(
		event: SelectAchievementSetEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const globalCategory = currentState.achievements.globalCategories.find(cat =>
			cat.achievementSets.some(set => set.id === event.achievementSetId),
		);
		const achievementSet: AchievementSet = globalCategory.achievementSets.find(
			set => set.id === event.achievementSetId,
		);
		const newAchievements = navigationState.navigationAchievements.update({
			currentView: 'list',
			menuDisplayType: 'breadcrumbs',
			selectedGlobalCategoryId: globalCategory.id,
			selectedCategoryId: achievementSet.id,
			// achievementCategories: globalCategory.achievementSets as readonly AchievementSet[],
			achievementsList: achievementSet.achievements.map(ach => ach.id) as readonly string[],
			displayedAchievementsList: achievementSet.achievements.map(ach => ach.id) as readonly string[],
			selectedAchievementId: undefined,
		} as NavigationAchievements);
		return [
			null,
			navigationState.update({
				isVisible: true,
				navigationAchievements: newAchievements,
				text:
					globalCategory.name !== achievementSet.displayName
						? globalCategory.name + ' ' + achievementSet.displayName
						: achievementSet.displayName,
				image: null,
			} as NavigationState),
		];
	}
}
