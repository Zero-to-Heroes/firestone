import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { DuelsStateBuilderService } from '../../../../duels/duels-state-builder.service';
import { PreferencesService } from '../../../../preferences.service';
import { DuelsTreasureSortFilterSelectedEvent } from '../../events/duels/duels-treasure-sort-filter-selected-event';
import { Processor } from '../processor';

export class DuelsTreasureSortFilterSelectedProcessor implements Processor {
	constructor(private readonly duelsService: DuelsStateBuilderService, private readonly prefs: PreferencesService) {}

	public async process(
		event: DuelsTreasureSortFilterSelectedEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		await this.prefs.updateDuelsTreasureSortFilter(event.value);
		const duels = await this.duelsService.updateState(currentState.duels, currentState.stats.gameStats);
		console.log('updated duels treasure sort filter', duels);
		return [
			currentState.update({
				duels: duels,
			} as MainWindowState),
			null,
		];
	}
}
