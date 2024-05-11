import { PreferencesService } from '@firestone/shared/common/service';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { RestoreDeckSummaryEvent } from '../../events/decktracker/restore-deck-summary-event';
import { Processor } from '../processor';

export class RestoreDeckSummaryProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: RestoreDeckSummaryEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState, NavigationState]> {
		const currentPrefs = await this.prefs.getPreferences();
		console.log(
			'[restore-deck-summary-processor] removing deck from hidden decks',
			event.deckstring,
			currentPrefs.desktopDeckHiddenDeckCodes,
		);
		const newHiddenDecks = (currentPrefs.desktopDeckHiddenDeckCodes ?? []).filter(
			(deckCode) => deckCode !== event.deckstring,
		);
		console.log('[restore-deck-summary-processor] new hidden decks', newHiddenDecks);
		await this.prefs.setDesktopDeckHiddenDeckCodes(newHiddenDecks);
		return [null, null];
	}
}
