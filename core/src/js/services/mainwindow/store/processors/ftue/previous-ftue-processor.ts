import { CurrentAppType } from '../../../../../models/mainwindow/current-app.type';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { PreviousFtueEvent } from '../../events/ftue/previous-ftue-event';
import { Processor } from '../processor';

export class PreviousFtueProcessor implements Processor {
	public async process(
		event: PreviousFtueEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		let nextStep: CurrentAppType = undefined;
		switch (navigationState.currentApp) {
			case undefined:
				nextStep = undefined;
				break;
			case 'collection':
				nextStep = 'achievements';
				break;
			case 'achievements':
				nextStep = 'replays';
				break;
			case 'replays':
				nextStep = 'arena';
				break;
			case 'arena':
				nextStep = 'duels';
				break;
			case 'duels':
				nextStep = 'battlegrounds';
				break;
			case 'battlegrounds':
				nextStep = 'decktracker';
				break;
			case 'decktracker':
				nextStep = undefined;
				break;
		}
		return [null, navigationState.update({ currentApp: nextStep } as NavigationState)];
	}
}
