import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { PreferencesService } from '../../../../preferences.service';
import { MercenariesPvpMmrFilterSelectedEvent } from '../../events/mercenaries/mercenaries-pvp-mmr-filter-selected-event';
import { Processor } from '../processor';

export class MercenariesPvpMmrFilterSelectedProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: MercenariesPvpMmrFilterSelectedEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		await this.prefs.updateMercenariesPvpMmrFilter(event.mmr);
		return [null, null];
	}
}
