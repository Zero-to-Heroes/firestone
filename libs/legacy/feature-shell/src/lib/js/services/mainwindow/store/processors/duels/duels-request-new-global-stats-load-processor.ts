import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { DuelsStateBuilderService } from '../../../../duels/duels-state-builder.service';
import { DuelsRequestNewGlobalStatsLoadEvent } from '../../events/duels/duels-request-new-global-stats-load-event';
import { Processor } from '../processor';

export class DuelsRequestNewGlobalStatsLoadProcessor implements Processor {
	constructor(private readonly duelsService: DuelsStateBuilderService) {}

	public async process(
		event: DuelsRequestNewGlobalStatsLoadEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const newStats = await this.duelsService.loadGlobalStats();
		return [
			currentState.update({
				duels: currentState.duels.update({
					loading: false,
					globalStats: newStats,
				}),
			}),
			null,
		];
	}
}
