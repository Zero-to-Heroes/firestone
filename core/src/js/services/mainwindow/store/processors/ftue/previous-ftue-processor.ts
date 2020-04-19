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
			case 'achievements':
				nextStep = 'replays';
				break;
			case 'collection':
				nextStep = 'achievements';
				break;
			case 'decktracker':
				nextStep = 'collection';
				break;
			case 'replays':
				nextStep = 'decktracker';
				break;
		}
		return [null, navigationState.update({ currentApp: nextStep } as NavigationState)];
	}
}
