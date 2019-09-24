import { AchievementsState } from '../../../../../models/mainwindow/achievements-state';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { VisualAchievement } from '../../../../../models/visual-achievement';
import { FilterShownAchievementsEvent } from '../../events/achievements/filter-shown-achievements-event';
import { Processor } from '../processor';

export class FilterShownAchievementsProcessor implements Processor {
	public async process(event: FilterShownAchievementsEvent, currentState: MainWindowState): Promise<MainWindowState> {
		const searchString = (event.searchString || '').toLowerCase();
		console.log('[filter-shown-achievements] filtering shown achievements', searchString);
		const displayedAchievementsList: readonly VisualAchievement[] = (
			currentState.achievements.achievementsList || []
		).filter(
			achv =>
				achv.name.toLowerCase().indexOf(searchString) !== -1 ||
				achv.text.toLowerCase().indexOf(searchString) !== -1,
		);
		const newState = Object.assign(new AchievementsState(), currentState.achievements, {
			displayedAchievementsList: displayedAchievementsList,
		} as AchievementsState);
		return Object.assign(new MainWindowState(), currentState, {
			achievements: newState,
		} as MainWindowState);
	}
}
