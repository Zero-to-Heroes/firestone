import { CurrentAppType } from '../../../../../models/mainwindow/current-app.type';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { PreferencesService } from '../../../../preferences.service';
import { NextFtueEvent } from '../../events/ftue/next-ftue-event';
import { Processor } from '../processor';

export class NextFtueProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(event: NextFtueEvent, currentState: MainWindowState): Promise<MainWindowState> {
		let nextStep: CurrentAppType = undefined;
		let showFtue = currentState.showFtue;
		switch (currentState.currentApp) {
			case undefined:
				nextStep = 'achievements';
				break;
			case 'achievements':
				nextStep = 'collection';
				break;
			case 'collection':
				nextStep = 'decktracker';
				break;
			case 'decktracker':
				nextStep = 'replays';
				break;
			case 'replays':
				nextStep = 'achievements'; // Default page
				break;
		}
		if (currentState.currentApp === 'replays') {
			await this.prefs.setGlobalFtueDone();
			showFtue = false;
		}
		return Object.assign(new MainWindowState(), currentState, {
			showFtue: showFtue,
			currentApp: nextStep,
		} as MainWindowState);
	}
}
