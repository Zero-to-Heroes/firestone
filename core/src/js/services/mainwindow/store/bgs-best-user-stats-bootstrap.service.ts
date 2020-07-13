import { EventEmitter, Injectable } from '@angular/core';
import { BgsBestUserStatsService } from '../../battlegrounds/bgs-best-user-stats.service';
import { Events } from '../../events.service';
import { OverwolfService } from '../../overwolf.service';
import { MainWindowStoreEvent } from './events/main-window-store-event';
import { BgsBestUserStatsInitEvent } from './events/stats/bgs-best-user-stats-init-event';

@Injectable()
export class BgsBestUserStatsBootstrapService {
	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly events: Events,
		private readonly bgs: BgsBestUserStatsService,
		private readonly ow: OverwolfService,
	) {
		this.events.on(Events.START_POPULATE_BGS_BEST_USER_STATS_STATE).subscribe(event => this.initBgsBestUserStats());
		setTimeout(() => {
			this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
		});
	}

	public async initBgsBestUserStats() {
		console.log('retrieving bgs best stats');
		const bgsBestUserStats = await this.bgs.getBgsBestUserStats();
		console.log('retrieved bgs best stats', bgsBestUserStats?.length);
		this.stateUpdater.next(new BgsBestUserStatsInitEvent(bgsBestUserStats));
	}
}
