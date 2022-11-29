import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { PreferencesService } from '../../../../preferences.service';
import { HideDeckSummaryEvent } from '../../events/decktracker/hide-deck-summary-event';
import { Processor } from '../processor';

export class HideDeckSummaryProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: HideDeckSummaryEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const currentPrefs = await this.prefs.getPreferences();
		const newHiddenDecks = [...currentPrefs.desktopDeckHiddenDeckCodes, event.deckstring];
		await this.prefs.setDesktopDeckHiddenDeckCodes(newHiddenDecks);
		return [null, null];
	}
}
