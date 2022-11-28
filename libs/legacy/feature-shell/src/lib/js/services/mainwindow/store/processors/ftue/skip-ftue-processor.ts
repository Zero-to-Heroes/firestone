import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { PreferencesService } from '../../../../preferences.service';
import { SkipFtueEvent } from '../../events/ftue/skip-ftue-event';
import { Processor } from '../processor';

export class SkipFtueProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: SkipFtueEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		await this.prefs.setGlobalFtueDone();
		return [
			currentState.update({
				showFtue: false,
			} as MainWindowState),
			navigationState.update({
				currentApp: 'achievements',
			} as NavigationState),
		];
	}
}
