import { PreferencesService } from '@firestone/shared/common/service';
import { MainWindowState } from '../../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../../models/mainwindow/navigation/navigation-state';
import { BgsSimulatorMinionTribeFilterSelectedEvent } from '@firestone/mainwindow/common';
import { Processor } from '../../processor';

export class BgsSimulatorMinionTribeFilterSelectedProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: BgsSimulatorMinionTribeFilterSelectedEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		this.prefs.updateBgsActiveSimulatorMinionTribeFilter(event.tribe);
		return [null, null];
	}
}
