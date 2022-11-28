import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationDuels } from '../../../../../models/mainwindow/navigation/navigation-duels';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { DuelsToggleExpandedRunEvent } from '../../events/duels/duels-toggle-expanded-run-event';
import { Processor } from '../processor';

export class DuelsToggleExpandedRunProcessor implements Processor {
	public async process(
		event: DuelsToggleExpandedRunEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const expandedRunIds: readonly string[] = navigationState.navigationDuels.expandedRunIds.includes(event.runId)
			? navigationState.navigationDuels.expandedRunIds.filter((runId) => runId !== event.runId)
			: [...navigationState.navigationDuels.expandedRunIds, event.runId];
		return [
			null,
			navigationState.update({
				navigationDuels: navigationState.navigationDuels.update({
					expandedRunIds: expandedRunIds,
					treasureSearchString: null,
					heroSearchString: null,
				} as NavigationDuels),
			} as NavigationState),
		];
	}
}
