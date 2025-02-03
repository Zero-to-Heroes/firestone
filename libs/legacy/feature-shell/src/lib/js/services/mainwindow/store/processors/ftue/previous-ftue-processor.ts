import { MainWindowNavigationService } from '@firestone/mainwindow/common';
import { CurrentAppType } from '@firestone/shared/common/service';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { PreviousFtueEvent } from '../../events/ftue/previous-ftue-event';
import { Processor } from '../processor';

export class PreviousFtueProcessor implements Processor {
	constructor(private readonly mainNav: MainWindowNavigationService) {}

	public async process(
		event: PreviousFtueEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		let nextStep: CurrentAppType = undefined;
		switch (this.mainNav.currentApp$$.value) {
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
				nextStep = 'battlegrounds';
				break;
			case 'battlegrounds':
				nextStep = 'decktracker';
				break;
			case 'decktracker':
				nextStep = undefined;
				break;
		}
		this.mainNav.currentApp$$.next(nextStep);
		return [null, null];
	}
}
