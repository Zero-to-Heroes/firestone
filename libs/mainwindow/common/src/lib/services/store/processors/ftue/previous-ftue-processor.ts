import { CurrentAppType } from '@firestone/shared/common/service';
import {
	MainWindowNavigationService,
	MainWindowState,
	NavigationState,
	PreviousFtueEvent,
} from '../../store-internal';
import { Processor } from '../processor';

export class PreviousFtueProcessor implements Processor {
	constructor(private readonly mainNav: MainWindowNavigationService) {}

	public async process(
		event: PreviousFtueEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState | null, NavigationState | null]> {
		let nextStep: CurrentAppType | null = null;
		switch (this.mainNav.currentApp$$.value) {
			case undefined:
				nextStep = null;
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
				nextStep = null;
				break;
		}
		this.mainNav.currentApp$$.next(nextStep ?? null);
		return [null, null];
	}
}
