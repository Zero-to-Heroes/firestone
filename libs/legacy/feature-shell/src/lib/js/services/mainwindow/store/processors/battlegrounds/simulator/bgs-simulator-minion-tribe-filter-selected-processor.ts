import { MainWindowState } from '../../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../../models/mainwindow/navigation/navigation-state';
import { PreferencesService } from '../../../../../preferences.service';
import { BgsSimulatorMinionTribeFilterSelectedEvent } from '../../../events/battlegrounds/simulator/bgs-simulator-minion-tribe-filter-selected-event';
import { Processor } from '../../processor';

export class BgsSimulatorMinionTribeFilterSelectedProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: BgsSimulatorMinionTribeFilterSelectedEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		this.prefs.updateBgsActiveSimulatorMinionTribeFilter(event.tribe);
		return [null, null];
	}
}
