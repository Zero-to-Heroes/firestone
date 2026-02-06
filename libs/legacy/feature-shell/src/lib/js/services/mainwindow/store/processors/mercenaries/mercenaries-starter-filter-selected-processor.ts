import { MainWindowState, NavigationState } from '@firestone/mainwindow/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { MercenariesStarterFilterSelectedEvent } from '../../events/mercenaries/mercenaries-starter-filter-selected-event';
import { Processor } from '../processor';

export class MercenariesStarterFilterSelectedProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: MercenariesStarterFilterSelectedEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState, NavigationState]> {
		await this.prefs.updateMercenariesStarterFilter(event.starter);
		return [null, null];
	}
}
