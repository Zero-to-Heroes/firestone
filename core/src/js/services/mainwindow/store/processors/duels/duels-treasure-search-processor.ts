import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationDuels } from '../../../../../models/mainwindow/navigation/navigation-duels';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { DuelsTreasureSortFilterSelectedEvent } from '../../events/duels/duels-treasure-sort-filter-selected-event';
import { Processor } from '../processor';

export class DuelsTreasureSearchProcessor implements Processor {
	public async process(
		event: DuelsTreasureSortFilterSelectedEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		return [
			null,
			navigationState.update({
				navigationDuels: navigationState.navigationDuels.update({
					treasureSearchString: event.value,
				} as NavigationDuels),
			} as NavigationState),
		];
	}
}
