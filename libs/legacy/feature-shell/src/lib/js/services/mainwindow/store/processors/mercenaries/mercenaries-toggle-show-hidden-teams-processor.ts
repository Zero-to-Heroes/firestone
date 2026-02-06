import { MainWindowState, NavigationState } from '@firestone/mainwindow/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { ToggleShowHiddenDecksEvent } from '../../events/decktracker/toggle-show-hidden-decks-event';
import { Processor } from '../processor';

export class MercenariesToggleShowHiddenTeamsProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: ToggleShowHiddenDecksEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState, NavigationState]> {
		await this.prefs.updateMercenariesShowHiddenTeams(event.newValue);
		return [null, null];
	}
}
