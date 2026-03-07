import { MainWindowState, NavigationState, StatsState } from '@firestone/mainwindow/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { StatsXpGraphFilterSelectedEvent } from '@firestone/mainwindow/common';
import { Processor } from '../processor';

export class StatsXpGraphFilterSelectedProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: StatsXpGraphFilterSelectedEvent,
		currentState: MainWindowState,
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
