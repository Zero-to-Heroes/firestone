import { MainWindowNavigationService } from '@firestone/mainwindow/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationReplays } from '../../../../../models/mainwindow/navigation/navigation-replays';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { ChangeMatchStatsNumberOfTabsEvent } from '../../events/replays/change-match-stats-number-of-tabs-event';
import { Processor } from '../processor';

export class ChangeMatchStatsNumberOfTabsProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService, private readonly mainNav: MainWindowNavigationService) {}

	public async process(
		event: ChangeMatchStatsNumberOfTabsEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		await this.prefs.updateBgsNumberOfDisplayedTabs(event.tabsNumber);
		const newReplays = navigationState.navigationReplays.update({
			numberOfDisplayedTabs: event.tabsNumber,
		} as NavigationReplays);
		this.mainNav.isVisible$$.next(true);
		this.mainNav.currentApp$$.next('replays');
		return [
			null,
			navigationState.update({
				navigationReplays: newReplays,
			} as NavigationState),
		];
	}
}
