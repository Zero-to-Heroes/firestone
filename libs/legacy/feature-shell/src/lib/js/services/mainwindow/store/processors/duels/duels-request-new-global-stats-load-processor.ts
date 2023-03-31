import { DuelsMetaHeroStatsAccessService } from '@firestone/duels/data-access';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { PreferencesService } from '../../../../preferences.service';
import { DuelsRequestNewGlobalStatsLoadEvent } from '../../events/duels/duels-request-new-global-stats-load-event';
import { Processor } from '../processor';

export class DuelsRequestNewGlobalStatsLoadProcessor implements Processor {
	constructor(
		private readonly duelsAccess: DuelsMetaHeroStatsAccessService,
		private readonly prefs: PreferencesService,
	) {}

	public async process(
		event: DuelsRequestNewGlobalStatsLoadEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const prefs = await this.prefs.getPreferences();
		const newStats = await this.duelsAccess.loadMetaHeroes(prefs.duelsActiveMmrFilter, prefs.duelsActiveTimeFilter);
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
