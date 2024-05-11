import { PreferencesService } from '@firestone/shared/common/service';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
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
