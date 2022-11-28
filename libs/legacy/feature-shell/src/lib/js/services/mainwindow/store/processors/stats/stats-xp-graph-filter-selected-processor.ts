import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { StatsState } from '../../../../../models/mainwindow/stats/stats-state';
import { PreferencesService } from '../../../../preferences.service';
import { StatsXpGraphFilterSelectedEvent } from '../../events/stats/stats-xp-graph-filter-selected-event';
import { Processor } from '../processor';

export class StatsXpGraphFilterSelectedProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: StatsXpGraphFilterSelectedEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		await this.prefs.updateStatsXpGraphFilter(event.value);
		return [
			currentState.update({
				stats: currentState.stats.update({
					filters: {
						...currentState.stats.filters,
						xpGraphSeasonFilter: event.value,
					},
				} as StatsState),
			} as MainWindowState),
			null,
		];
	}
}
