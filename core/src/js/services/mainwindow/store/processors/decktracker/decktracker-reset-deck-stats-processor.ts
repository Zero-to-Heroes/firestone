import { DecktrackerState } from '../../../../../models/mainwindow/decktracker/decktracker-state';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { DecksStateBuilderService } from '../../../../decktracker/main/decks-state-builder.service';
import { ReplaysStateBuilderService } from '../../../../decktracker/main/replays-state-builder.service';
import { PreferencesService } from '../../../../preferences.service';
import { DecktrackerResetDeckStatsEvent } from '../../events/decktracker/decktracker-reset-deck-stats-event';
import { Processor } from '../processor';

export class DecktrackerResetDeckStatsProcessor implements Processor {
	constructor(
		private readonly decksStateBuilder: DecksStateBuilderService,
		private readonly prefs: PreferencesService,
		private readonly replaysBuilder: ReplaysStateBuilderService,
	) {}

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
		const newState: DecktrackerState = Object.assign(new DecktrackerState(), currentState.decktracker, {
			decks: this.decksStateBuilder.buildState(
				currentState.stats,
				currentState.decktracker.filters,
				currentState.decktracker.patch,
				newPrefs,
			),
		} as DecktrackerState);
		const replays = await this.replaysBuilder.buildState(currentState.replays, currentState.stats, newState.decks);
		return [
			Object.assign(new MainWindowState(), currentState, {
				decktracker: newState,
				replays: replays,
			} as MainWindowState),
			null,
		];
	}
}
