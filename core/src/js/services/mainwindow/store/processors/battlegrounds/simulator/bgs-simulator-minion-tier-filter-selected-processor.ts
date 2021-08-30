import { MainWindowState } from '../../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../../models/mainwindow/navigation/navigation-state';
import { PreferencesService } from '../../../../../preferences.service';
import { BgsSimulatorMinionTierFilterSelectedEvent } from '../../../events/battlegrounds/simulator/bgs-simulator-minion-tier-filter-selected-event';
import { Processor } from '../../processor';

export class BgsSimulatorMinionTierFilterSelectedProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: BgsSimulatorMinionTierFilterSelectedEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		this.prefs.updateBgsActiveSimulatorMinionTierFilter(event.tier);
		return [null, null];
	}
}
