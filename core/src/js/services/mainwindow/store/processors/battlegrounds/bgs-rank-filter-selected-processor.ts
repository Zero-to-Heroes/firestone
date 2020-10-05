import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { BgsBuilderService } from '../../../../battlegrounds/bgs-builder.service';
import { PreferencesService } from '../../../../preferences.service';
import { BgsRankFilterSelectedEvent } from '../../events/battlegrounds/bgs-rank-filter-selected-event';
import { Processor } from '../processor';

export class BgsRankFilterSelectedProcessor implements Processor {
	constructor(private readonly bgsService: BgsBuilderService, private readonly prefs: PreferencesService) {}

	public async process(
		event: BgsRankFilterSelectedEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		await this.prefs.updateBgsRankFilter(event.rankFilter);
		const bgsState = await this.bgsService.updateStats(
			currentState.battlegrounds,
			currentState.stats.gameStats,
			currentState.battlegrounds.stats?.currentBattlegroundsMetaPatch,
		);
		console.log('updated time filter', bgsState);
		return [
			currentState.update({
				battlegrounds: bgsState,
			} as MainWindowState),
			null,
		];
	}
}
