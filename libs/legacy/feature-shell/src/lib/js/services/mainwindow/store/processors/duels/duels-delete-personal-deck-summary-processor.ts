import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { PreferencesService } from '../../../../preferences.service';
import { DuelsDeletePersonalDeckSummaryEvent } from '../../events/duels/duels-delete-personal-deck-summary-event';
import { Processor } from '../processor';

export class DuelsDeletePersonalDeckSummaryProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: DuelsDeletePersonalDeckSummaryEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const currentPrefs = await this.prefs.getPreferences();
		const newDecks = currentPrefs.duelsPersonalAdditionalDecks.filter(
			(deck) => deck.initialDeckList !== event.deckstring,
		);
		await this.prefs.savePreferences({ ...currentPrefs, duelsPersonalAdditionalDecks: newDecks });

		const deletedDeckDates: readonly number[] = currentPrefs.duelsDeckDeletes[event.deckstring] ?? [];
		const newDeleteDates: readonly number[] = [Date.now(), ...deletedDeckDates];
		await this.prefs.setDuelsDeckDeleteDates(event.deckstring, newDeleteDates);
		return [null, null];
	}
}
