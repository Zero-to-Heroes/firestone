import { AchievementSet } from '../../../../../models/achievement-set';
import { AchievementsState } from '../../../../../models/mainwindow/achievements-state';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { Navigation } from '../../../../../models/mainwindow/navigation';
import { SelectAchievementSetEvent } from '../../events/achievements/select-achievement-set-event';
import { Processor } from '../processor';

export class SelectAchievementSetProcessor implements Processor {
	public async process(event: SelectAchievementSetEvent, currentState: MainWindowState): Promise<MainWindowState> {
		const globalCategory = currentState.achievements.globalCategories.find(cat =>
			cat.achievementSets.some(set => set.id === event.achievementSetId),
		);
		const achievementSet: AchievementSet = globalCategory.achievementSets.find(
			set => set.id === event.achievementSetId,
		);
		const newState = Object.assign(new AchievementsState(), currentState.achievements, {
			currentView: 'list',
			menuDisplayType: 'breadcrumbs',
			selectedGlobalCategoryId: globalCategory.id,
			selectedCategoryId: achievementSet.id,
			// achievementCategories: globalCategory.achievementSets as readonly AchievementSet[],
			achievementsList: achievementSet.achievements,
			displayedAchievementsList: achievementSet.achievements.map(ach => ach.id) as readonly string[],
			selectedAchievementId: undefined,
		} as AchievementsState);
		return Object.assign(new MainWindowState(), currentState, {
			achievements: newState,
			isVisible: true,
			navigation: Object.assign(new Navigation(), currentState.navigation, {
				text:
					globalCategory.name !== achievementSet.displayName
						? globalCategory.name + ' ' + achievementSet.displayName
						: achievementSet.displayName,
				image: null,
			} as Navigation),
		} as MainWindowState);
	}
}
