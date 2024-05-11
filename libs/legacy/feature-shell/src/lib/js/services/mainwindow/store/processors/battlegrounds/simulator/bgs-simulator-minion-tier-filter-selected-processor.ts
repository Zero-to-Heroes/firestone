import { PreferencesService } from '@firestone/shared/common/service';
import { MainWindowState } from '../../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../../models/mainwindow/navigation/navigation-state';
import { BgsSimulatorMinionTierFilterSelectedEvent } from '../../../events/battlegrounds/simulator/bgs-simulator-minion-tier-filter-selected-event';
import { Processor } from '../../processor';

export class BgsSimulatorMinionTierFilterSelectedProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: BgsSimulatorMinionTierFilterSelectedEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		this.prefs.updateBgsActiveSimulatorMinionTierFilter(event.tier);
		return [null, null];
	}
}
