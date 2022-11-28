import { ArenaState } from '../../../../../models/arena/arena-state';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { PreferencesService } from '../../../../preferences.service';
import { ArenaTimeFilterSelectedEvent } from '../../events/arena/arena-time-filter-selected-event';
import { Processor } from '../processor';

export class ArenaTimeFilterSelectedProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: ArenaTimeFilterSelectedEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		await this.prefs.updateArenaTimeFilter(event.value);
		return [
			currentState.update({
				arena: currentState.arena.update({
					activeTimeFilter: event.value,
				} as ArenaState),
			} as MainWindowState),
			null,
		];
	}
}
