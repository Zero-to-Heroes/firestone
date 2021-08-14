import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { DuelsStateBuilderService } from '../../../../duels/duels-state-builder.service';
import { PreferencesService } from '../../../../preferences.service';
import { DuelsHidePersonalDeckSummaryEvent } from '../../events/duels/duels-hide-personal-deck-summary-event';
import { Processor } from '../processor';

export class DuelsHidePersonalDeckSummaryProcessor implements Processor {
	constructor(
		private readonly duelsStateBuilder: DuelsStateBuilderService,
		private readonly prefs: PreferencesService,
	) {}

	public async process(
		event: DuelsHidePersonalDeckSummaryEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const currentPrefs = await this.prefs.getPreferences();
		const newHiddenDecks = [...currentPrefs.duelsPersonalDeckHiddenDeckCodes, event.deckstring];
		await this.prefs.setDuelsPersonalDeckHiddenDeckCodes(newHiddenDecks);
		// const newState: DuelsState = await this.duelsStateBuilder.updateState(
		// 	currentState.duels,
		// 	currentState.stats.gameStats,
		// 	currentState.binder,
		// 	currentState.duels.currentDuelsMetaPatch,
		// );
		return [
			// Object.assign(new MainWindowState(), currentState, {
			// 	duels: newState,
			// } as MainWindowState),
			null,
			null,
		];
	}
}
