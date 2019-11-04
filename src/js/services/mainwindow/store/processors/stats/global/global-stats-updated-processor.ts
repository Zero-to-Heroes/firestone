import { MainWindowState } from '../../../../../../models/mainwindow/main-window-state';
import { Events } from '../../../../../events.service';
import { GlobalStatsUpdatedEvent } from '../../../events/stats/global/global-stats-updated-event';
import { Processor } from '../../processor';

export class GlobalStatsUpdatedProcessor implements Processor {
	constructor(private readonly events: Events) {}

	public async process(event: GlobalStatsUpdatedEvent, currentState: MainWindowState): Promise<MainWindowState> {
		this.events.broadcast(Events.GLOBAL_STATS_UPDATED, event.stats);
		// console.log('[global-stats-updated-processor] sending new state');
		return Object.assign(new MainWindowState(), currentState, {
			globalStats: event.stats,
		} as MainWindowState);
	}
}
