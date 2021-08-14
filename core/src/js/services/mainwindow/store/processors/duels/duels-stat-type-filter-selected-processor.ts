import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { DuelsStateBuilderService } from '../../../../duels/duels-state-builder.service';
import { PreferencesService } from '../../../../preferences.service';
import { DuelsStatTypeFilterSelectedEvent } from '../../events/duels/duels-stat-type-filter-selected-event';
import { Processor } from '../processor';

export class DuelsStatTypeFilterSelectedProcessor implements Processor {
	constructor(private readonly duelsService: DuelsStateBuilderService, private readonly prefs: PreferencesService) {}

	public async process(
		event: DuelsStatTypeFilterSelectedEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		await this.prefs.updateDuelsStatTypeFilter(event.value);
		// const duels = await this.duelsService.updateState(
		// 	currentState.duels,
		// 	currentState.stats.gameStats,
		// 	currentState.binder,
		// );
		console.log('updated duels stat type filter', event.value);
		return [
			// currentState.update({
			// 	duels: duels,
			// } as MainWindowState),
			null,
			null,
		];
	}
}
