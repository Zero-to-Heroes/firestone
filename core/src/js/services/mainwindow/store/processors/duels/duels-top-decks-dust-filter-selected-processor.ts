import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { DuelsStateBuilderService } from '../../../../duels/duels-state-builder.service';
import { PreferencesService } from '../../../../preferences.service';
import { DuelsTopDecksDustFilterSelectedEvent } from '../../events/duels/duels-top-decks-dust-filter-selected-event';
import { Processor } from '../processor';

export class DuelsTopDecksDustFilterSelectedProcessor implements Processor {
	constructor(private readonly duelsService: DuelsStateBuilderService, private readonly prefs: PreferencesService) {}

	public async process(
		event: DuelsTopDecksDustFilterSelectedEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		await this.prefs.updateDuelsTopDecksDustFilter(event.value);
		// const duels = await this.duelsService.updateState(
		// 	currentState.duels,
		// 	currentState.stats.gameStats,
		// 	currentState.binder,
		// );
		console.log('updated duels top decks dust filter', event.value);
		return [
			// currentState.update({
			// 	duels: duels,
			// } as MainWindowState),
			null,
			null,
		];
	}
}
