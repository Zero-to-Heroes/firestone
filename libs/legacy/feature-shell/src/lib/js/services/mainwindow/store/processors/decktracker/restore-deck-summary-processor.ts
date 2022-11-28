import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { PreferencesService } from '../../../../preferences.service';
import { RestoreDeckSummaryEvent } from '../../events/decktracker/restore-deck-summary-event';
import { Processor } from '../processor';

export class RestoreDeckSummaryProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: RestoreDeckSummaryEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const currentPrefs = await this.prefs.getPreferences();
		const newHiddenDecks = (currentPrefs.desktopDeckHiddenDeckCodes ?? []).filter(
			(deckCode) => deckCode !== event.deckstring,
		);
		await this.prefs.setDesktopDeckHiddenDeckCodes(newHiddenDecks);
		return [null, null];
	}
}
