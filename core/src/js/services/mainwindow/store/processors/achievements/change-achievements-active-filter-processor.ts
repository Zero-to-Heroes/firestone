import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NonNavigationState } from '../../../../../models/mainwindow/non-navigation-state';
import { ChangeAchievementsActiveFilterEvent } from '../../events/achievements/change-achievements-active-filter-event';
import { Processor } from '../processor';

export class ChangeAchievementsActiveFilterProcessor implements Processor {
	public async process(
		event: ChangeAchievementsActiveFilterEvent,
		currentState: MainWindowState,
	): Promise<MainWindowState> {
		console.log('setting new filter', event.newFilter);
		const newState = Object.assign(new NonNavigationState(), currentState.nonNavigationState, {
			achievementActiveFilter: event.newFilter,
		} as NonNavigationState);
		return Object.assign(new MainWindowState(), currentState, {
			nonNavigationState: newState,
		} as MainWindowState);
	}
}
