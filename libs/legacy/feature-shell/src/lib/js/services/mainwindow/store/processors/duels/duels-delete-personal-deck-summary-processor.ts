import { DuelsPersonalDecksService } from '@firestone/duels/general';
import { PreferencesService } from '@firestone/shared/common/service';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { DuelsDeletePersonalDeckSummaryEvent } from '../../events/duels/duels-delete-personal-deck-summary-event';
import { Processor } from '../processor';

export class DuelsDeletePersonalDeckSummaryProcessor implements Processor {
	constructor(
		private readonly prefs: PreferencesService,
		private readonly duelsPersonalDecks: DuelsPersonalDecksService,
	) {}

	public async process(
		event: DuelsDeletePersonalDeckSummaryEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState, NavigationState]> {
		const currentPrefs = await this.prefs.getPreferences();
		this.duelsPersonalDecks.deleteDeck(event.deckstring);

		const deletedDeckDates: readonly number[] = currentPrefs.duelsDeckDeletes[event.deckstring] ?? [];
		const newDeleteDates: readonly number[] = [Date.now(), ...deletedDeckDates];
		await this.prefs.setDuelsDeckDeleteDates(event.deckstring, newDeleteDates);
		return [null, null];
	}
}
