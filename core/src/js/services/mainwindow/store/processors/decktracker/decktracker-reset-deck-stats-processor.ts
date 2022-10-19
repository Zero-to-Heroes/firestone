import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { PreferencesService } from '../../../../preferences.service';
import { DecktrackerResetDeckStatsEvent } from '../../events/decktracker/decktracker-reset-deck-stats-event';
import { Processor } from '../processor';

export class DecktrackerResetDeckStatsProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: DecktrackerResetDeckStatsEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const currentPrefs = await this.prefs.getPreferences();
		const deckStatsResetDates: readonly number[] = currentPrefs.desktopDeckStatsReset[event.deckstring] ?? [];
		console.log('[deck-reset] deckStatsResetDates', event.deckstring, currentPrefs.desktopDeckStatsReset);
		const newResetDates: readonly number[] = [Date.now(), ...deckStatsResetDates];
		console.log('[deck-reset] newResetDates', newResetDates);
		const newPrefs = await this.prefs.setDeckResetDates(event.deckstring, newResetDates);
		console.log('[deck-reset] newPrefs', newPrefs.desktopDeckStatsReset);
		return [null, null];
	}
}
