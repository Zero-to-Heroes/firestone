import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { BgsBuilderService } from '../../../../battlegrounds/bgs-builder.service';
import { PreferencesService } from '../../../../preferences.service';
import { BgsMmrGroupFilterSelectedEvent } from '../../events/battlegrounds/bgs-mmr-group-filter-selected-event';
import { Processor } from '../processor';

export class BgsMmrGroupFilterSelectedProcessor implements Processor {
	constructor(private readonly bgsService: BgsBuilderService, private readonly prefs: PreferencesService) {}

	public async process(
		event: BgsMmrGroupFilterSelectedEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		await this.prefs.updateBgsMmrGroupFilter(event.mmrGroupFilter);
		const bgsState = await this.bgsService.updateStats(
			currentState.battlegrounds,
			currentState.stats.gameStats,
			currentState.battlegrounds.stats.currentBattlegroundsMetaPatch,
		);
		console.log('updated hero sort filter', bgsState);
		return [
			currentState.update({
				battlegrounds: bgsState,
			} as MainWindowState),
			null,
		];
	}
}
