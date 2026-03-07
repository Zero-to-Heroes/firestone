import { MainWindowState, NavigationState } from '@firestone/mainwindow/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { MercenariesModeFilterSelectedEvent } from '@firestone/mainwindow/common';
import { Processor } from '../processor';

export class MercenariesModeFilterSelectedProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: MercenariesModeFilterSelectedEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState, NavigationState]> {
		await this.prefs.updateMercenariesModeFilter(event.mode);
		return [null, null];
	}
}
