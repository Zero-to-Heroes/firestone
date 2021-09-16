import { BattlegroundsAppState } from '../../../../../models/mainwindow/battlegrounds/battlegrounds-app-state';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { BgsGlobalStatsService } from '../../../../battlegrounds/bgs-global-stats.service';
import { BgsRequestNewGlobalStatsLoadEvent } from '../../events/battlegrounds/bgs-request-new-global-stats-load-event';
import { Processor } from '../processor';

export class BgsRequestNewGlobalStatsLoadProcessor implements Processor {
	constructor(private readonly globalStatsService: BgsGlobalStatsService) {}

	public async process(
		event: BgsRequestNewGlobalStatsLoadEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const newStats = await this.globalStatsService.loadGlobalStats(event.tribes);
		return [
			currentState.update({
				battlegrounds: currentState.battlegrounds.update({
					loading: false,
					globalStats: newStats,
				} as BattlegroundsAppState),
			} as MainWindowState),
			null,
		];
	}
}
