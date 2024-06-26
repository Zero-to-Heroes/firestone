import { MainWindowNavigationService } from '@firestone/mainwindow/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { SkipFtueEvent } from '../../events/ftue/skip-ftue-event';
import { Processor } from '../processor';

export class SkipFtueProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService, private readonly mainNav: MainWindowNavigationService) {}

	public async process(
		event: SkipFtueEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
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
