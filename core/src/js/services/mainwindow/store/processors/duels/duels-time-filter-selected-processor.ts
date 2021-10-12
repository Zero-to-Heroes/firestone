import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { DuelsStateBuilderService } from '../../../../duels/duels-state-builder.service';
import { PreferencesService } from '../../../../preferences.service';
import { DuelsTimeFilterSelectedEvent } from '../../events/duels/duels-time-filter-selected-event';
import { Processor } from '../processor';

export class DuelsTimeFilterSelectedProcessor implements Processor {
	constructor(private readonly duelsService: DuelsStateBuilderService, private readonly prefs: PreferencesService) {}

	public async process(
		event: DuelsTimeFilterSelectedEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		await this.prefs.updateDuelsTimeFilter(event.value);
		return [null, null];
	}
}
