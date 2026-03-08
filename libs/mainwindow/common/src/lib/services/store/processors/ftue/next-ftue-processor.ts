import { CurrentAppType, PreferencesService } from '@firestone/shared/common/service';
import {
	MainWindowNavigationService,
	MainWindowState,
	NavigationState,
	NextFtueEvent,
} from '../../store-internal';
import { Processor } from '../processor';

export class NextFtueProcessor implements Processor {
	constructor(
		private readonly prefs: PreferencesService,
		private readonly mainNav: MainWindowNavigationService,
	) {}

	public async process(
		event: NextFtueEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState | null, NavigationState | null]> {
		let nextStep: CurrentAppType | null = null;
		let showFtue = currentState.showFtue;
		switch (this.mainNav.currentApp$$.value) {
			case undefined:
				nextStep = 'decktracker';
				break;
			case 'decktracker':
				nextStep = 'battlegrounds';
				break;
			case 'battlegrounds':
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
		this.mainNav.currentApp$$.next(nextStep ?? null);
		return [
			currentState.update({
				showFtue: showFtue,
			} as MainWindowState),
			null,
		];
	}
}
