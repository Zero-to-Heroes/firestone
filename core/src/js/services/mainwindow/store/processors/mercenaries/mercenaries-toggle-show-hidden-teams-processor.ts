import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { PreferencesService } from '../../../../preferences.service';
import { ToggleShowHiddenDecksEvent } from '../../events/decktracker/toggle-show-hidden-decks-event';
import { Processor } from '../processor';

export class MercenariesToggleShowHiddenTeamsProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: ToggleShowHiddenDecksEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		await this.prefs.updateMercenariesShowHiddenTeams(event.newValue);
		return [null, null];
	}
}
