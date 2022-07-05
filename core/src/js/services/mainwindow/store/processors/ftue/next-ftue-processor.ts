import { CurrentAppType } from '../../../../../models/mainwindow/current-app.type';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { PreferencesService } from '../../../../preferences.service';
import { NextFtueEvent } from '../../events/ftue/next-ftue-event';
import { Processor } from '../processor';

export class NextFtueProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: NextFtueEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		let nextStep: CurrentAppType = undefined;
		let showFtue = currentState.showFtue;
		switch (navigationState.currentApp) {
			case undefined:
				nextStep = 'decktracker';
				break;
			case 'decktracker':
				nextStep = 'battlegrounds';
				break;
			case 'battlegrounds':
				nextStep = 'duels';
				break;
			case 'duels':
				nextStep = 'arena';
				break;
			case 'arena':
				nextStep = 'replays';
				break;
			case 'replays':
				nextStep = 'achievements';
				break;
			case 'achievements':
				nextStep = 'collection';
				break;
			case 'collection':
				nextStep = 'decktracker'; // Default page
				break;
		}
		if (navigationState.currentApp === 'collection') {
			await this.prefs.setGlobalFtueDone();
			showFtue = false;
		}
		return [
			currentState.update({
				showFtue: showFtue,
			} as MainWindowState),
			navigationState.update({
				currentApp: nextStep,
			} as NavigationState),
		];
	}
}
