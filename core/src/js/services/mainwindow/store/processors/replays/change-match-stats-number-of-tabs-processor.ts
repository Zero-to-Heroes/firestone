import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationReplays } from '../../../../../models/mainwindow/navigation/navigation-replays';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { PreferencesService } from '../../../../preferences.service';
import { ChangeMatchStatsNumberOfTabsEvent } from '../../events/replays/change-match-stats-number-of-tabs-event';
import { Processor } from '../processor';

export class ChangeMatchStatsNumberOfTabsProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: ChangeMatchStatsNumberOfTabsEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		await this.prefs.updateBgsNumberOfDisplayedTabs(event.tabsNumber);
		const newReplays = navigationState.navigationReplays.update({
			numberOfDisplayedTabs: event.tabsNumber,
		} as NavigationReplays);
		return [
			null,
			navigationState.update({
				isVisible: true,
				currentApp: 'replays',
				navigationReplays: newReplays,
			} as NavigationState),
		];
	}
}
