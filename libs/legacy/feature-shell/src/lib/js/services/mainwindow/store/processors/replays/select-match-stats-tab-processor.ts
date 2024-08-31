import { BgsStatsFilterId } from '@firestone/battlegrounds/core';
import { MainWindowNavigationService } from '@firestone/mainwindow/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationReplays } from '../../../../../models/mainwindow/navigation/navigation-replays';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { SelectMatchStatsTabEvent } from '../../events/replays/select-match-stats-tab-event';
import { Processor } from '../processor';

export class SelectMatchStatsTabProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService, private readonly mainNav: MainWindowNavigationService) {}

	public async process(
		event: SelectMatchStatsTabEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const selectedStatsTabs: readonly BgsStatsFilterId[] = navigationState.navigationReplays.selectedStatsTabs.map(
			(tab, index) => (index === event.tabIndex ? event.tab : tab),
		);
		await this.prefs.updateBgsSelectedTabs(selectedStatsTabs);
		const newReplays = navigationState.navigationReplays.update({
			selectedStatsTabs: selectedStatsTabs,
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
