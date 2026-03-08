import { PreferencesService } from '@firestone/shared/common/service';
import {
	MainWindowNavigationService,
	MainWindowState,
	NavigationState,
	SkipFtueEvent,
} from '../../store-internal';
import { Processor } from '../processor';

export class SkipFtueProcessor implements Processor {
	constructor(
		private readonly prefs: PreferencesService,
		private readonly mainNav: MainWindowNavigationService,
	) {}

	public async process(
		event: SkipFtueEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState | null, NavigationState | null]> {
		await this.prefs.setGlobalFtueDone();
		this.mainNav.currentApp$$.next('decktracker');
		return [
			currentState.update({
				showFtue: false,
			} as MainWindowState),
			null,
		];
	}
}
