import { MainWindowState } from '../../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../../models/mainwindow/navigation/navigation-state';
import { Events } from '../../../../../events.service';
import { GlobalStatsUpdatedEvent } from '../../../events/stats/global/global-stats-updated-event';
import { Processor } from '../../processor';

export class GlobalStatsUpdatedProcessor implements Processor {
	constructor(private readonly events: Events) {}

	public async process(
		event: GlobalStatsUpdatedEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		this.events.broadcast(Events.GLOBAL_STATS_UPDATED, event.stats);

		return [
			currentState.update({
				globalStats: event.stats,
			} as MainWindowState),
			null,
		];
	}
}
