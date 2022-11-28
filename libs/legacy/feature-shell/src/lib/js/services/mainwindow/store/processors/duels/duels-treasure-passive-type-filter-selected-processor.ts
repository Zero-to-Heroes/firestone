import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { DuelsStateBuilderService } from '../../../../duels/duels-state-builder.service';
import { PreferencesService } from '../../../../preferences.service';
import { DuelsTreasurePassiveTypeFilterSelectedEvent } from '../../events/duels/duels-treasure-passive-type-filter-selected-event';
import { Processor } from '../processor';

export class DuelsTreasurePassiveTypeFilterSelectedProcessor implements Processor {
	constructor(private readonly duelsService: DuelsStateBuilderService, private readonly prefs: PreferencesService) {}

	public async process(
		event: DuelsTreasurePassiveTypeFilterSelectedEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		await this.prefs.updateDuelsTreasurePassiveTypeFilter(event.value);
		// const duels = await this.duelsService.updateState(
		// 	currentState.duels,
		// 	currentState.stats.gameStats,
		// 	currentState.binder,
		// );
		return [
			// currentState.update({
			// 	duels: duels,
			// } as MainWindowState),
			null,
			null,
		];
	}
}
