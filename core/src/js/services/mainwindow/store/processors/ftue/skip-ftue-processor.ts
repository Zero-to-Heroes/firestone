import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { PreferencesService } from '../../../../preferences.service';
import { SkipFtueEvent } from '../../events/ftue/skip-ftue-event';
import { Processor } from '../processor';

export class SkipFtueProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(event: SkipFtueEvent, currentState: MainWindowState): Promise<MainWindowState> {
		await this.prefs.setGlobalFtueDone();
		return Object.assign(new MainWindowState(), currentState, {
			showFtue: false,
			currentApp: 'achievements',
		} as MainWindowState);
	}
}
