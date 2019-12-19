import { EventEmitter, Injectable } from '@angular/core';
import { Events } from '../../events.service';
import { GlobalStatsService } from '../../global-stats/global-stats.service';
import { OverwolfService } from '../../overwolf.service';
import { MainWindowStoreEvent } from './events/main-window-store-event';
import { GlobalStatsInitEvent } from './events/stats/global/global-stats-init-event';

@Injectable()
export class GlobalStatsBootstrapService {
	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly events: Events,
		private readonly globalStats: GlobalStatsService,
		private readonly ow: OverwolfService,
	) {
		this.events.on(Events.START_POPULATE_GLOBAL_STATS_STATE).subscribe(event => this.initGlobalStats());
		setTimeout(() => {
			this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
		});
	}

	public async initGlobalStats() {
		const newState = await this.globalStats.getGlobalStats();
		this.stateUpdater.next(new GlobalStatsInitEvent(newState));
	}
}
