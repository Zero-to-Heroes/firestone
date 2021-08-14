import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { DuelsStateBuilderService } from '../../../../duels/duels-state-builder.service';
import { PreferencesService } from '../../../../preferences.service';
import { DuelsMmrFilterSelectedEvent } from '../../events/duels/duels-mmr-filter-selected-event';
import { Processor } from '../processor';

export class DuelsMmrFilterSelectedProcessor implements Processor {
	constructor(private readonly duelsService: DuelsStateBuilderService, private readonly prefs: PreferencesService) {}

	public async process(
		event: DuelsMmrFilterSelectedEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		await this.prefs.updateDuelsMmrFilter(event.value);
		// Try to not update the whole data inside the service, but let the UI handle
		// the filtering, so that things happen more reactively
		// const duels = currentState.duels.update({
		// 	activeMmrFilter: event.value,
		// } as DuelsState);
		console.log('updated duels top decks mmr filter', event.value);
		return [
			// currentState.update({
			// 	duels: duels,
			// } as MainWindowState),
			null,
			null,
		];
	}
}
