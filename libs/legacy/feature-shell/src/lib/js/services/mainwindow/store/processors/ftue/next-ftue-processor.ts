import { MainWindowNavigationService } from '@firestone/mainwindow/common';
import { CurrentAppType, PreferencesService } from '@firestone/shared/common/service';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { NextFtueEvent } from '../../events/ftue/next-ftue-event';
import { Processor } from '../processor';

export class NextFtueProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService, private readonly mainNav: MainWindowNavigationService) {}

	public async process(
		event: NextFtueEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		let nextStep: CurrentAppType = undefined;
		let showFtue = currentState.showFtue;
		switch (this.mainNav.currentApp$$.value) {
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
		if (this.mainNav.currentApp$$.value === 'collection') {
			await this.prefs.setGlobalFtueDone();
			showFtue = false;
		}
		this.mainNav.currentApp$$.next(nextStep);
		return [
			currentState.update({
				showFtue: showFtue,
			} as MainWindowState),
			null,
		];
	}
}
