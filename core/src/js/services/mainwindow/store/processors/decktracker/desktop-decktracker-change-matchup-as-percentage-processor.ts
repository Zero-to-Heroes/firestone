import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationDecktracker } from '../../../../../models/mainwindow/navigation/navigation-decktracker';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { PreferencesService } from '../../../../preferences.service';
import { DesktopDecktrackerChangeMatchupAsPercentagesEvent } from '../../events/decktracker/desktop-decktracker-change-matchup-as-percentage-event';
import { Processor } from '../processor';

export class DesktopDecktrackerChangeMatchupAsPercentagesProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: DesktopDecktrackerChangeMatchupAsPercentagesEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		await this.prefs.updateDesktopDecktrackerChangeMatchupAsPercentages(event.usePercentages);
		return [
			null,
			navigationState.update({
				navigationDecktracker: navigationState.navigationDecktracker.update({
					showMatchupAsPercentages: event.usePercentages,
				} as NavigationDecktracker),
			} as NavigationState),
		];
	}
}
