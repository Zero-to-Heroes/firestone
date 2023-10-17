import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationDuels } from '../../../../../models/mainwindow/navigation/navigation-duels';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { DuelsHeroSearchEvent } from '../../events/duels/duels-hero-search-event';
import { Processor } from '../processor';

export class DuelsHeroSearchProcessor implements Processor {
	public async process(
		event: DuelsHeroSearchEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		return [
			null,
			navigationState.update({
				navigationDuels: navigationState.navigationDuels.update({
					heroSearchString: event.value,
				} as NavigationDuels),
			} as NavigationState),
		];
	}
}
