import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { BgsBuilderService } from '../../../../battlegrounds/bgs-builder.service';
import { PreferencesService } from '../../../../preferences.service';
import { BgsHeroSortFilterSelectedEvent } from '../../events/battlegrounds/bgs-hero-sort-filter-selected-event';
import { Processor } from '../processor';

export class BgsHeroSortFilterSelectedProcessor implements Processor {
	constructor(private readonly bgsService: BgsBuilderService, private readonly prefs: PreferencesService) {}

	public async process(
		event: BgsHeroSortFilterSelectedEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		await this.prefs.updateBgsHeroSortFilter(event.heroSortFilter);
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
