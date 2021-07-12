import { ArenaState } from '../../../../../models/arena/arena-state';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { PreferencesService } from '../../../../preferences.service';
import { ArenaClassFilterSelectedEvent } from '../../events/arena/arena-class-filter-selected-event';
import { Processor } from '../processor';

export class ArenaClassFilterSelectedProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: ArenaClassFilterSelectedEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		await this.prefs.updateArenaClassFilter(event.value);
		return [
			currentState.update({
				arena: currentState.arena.update({
					activeHeroFilter: event.value,
				} as ArenaState),
			} as MainWindowState),
			null,
		];
	}
}
