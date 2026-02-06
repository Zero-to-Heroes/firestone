import { MainWindowState, NavigationState } from '@firestone/mainwindow/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { DecktrackerResetDeckStatsEvent } from '../../events/decktracker/decktracker-reset-deck-stats-event';
import { Processor } from '../processor';

export class DecktrackerResetDeckStatsProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: DecktrackerResetDeckStatsEvent,
		currentState: MainWindowState,
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
