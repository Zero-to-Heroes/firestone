import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { BgsBuilderService } from '../../../../battlegrounds/bgs-builder.service';
import { PreferencesService } from '../../../../preferences.service';
import { BgsHeroFilterSelectedEvent } from '../../events/battlegrounds/bgs-hero-filter-selected-event';
import { Processor } from '../processor';

export class BgsHeroFilterSelectedProcessor implements Processor {
	constructor(private readonly bgsService: BgsBuilderService, private readonly prefs: PreferencesService) {}

	public async process(
		event: BgsHeroFilterSelectedEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		await this.prefs.updateBgsHeroFilter(event.heroFilter);
		const bgsState = await this.bgsService.updateStats(
			currentState.battlegrounds,
			currentState.stats.gameStats,
			currentState.battlegrounds.stats.currentBattlegroundsMetaPatch,
		);
		return [
			currentState.update({
				battlegrounds: bgsState,
			} as MainWindowState),
			null,
		];
	}
}
