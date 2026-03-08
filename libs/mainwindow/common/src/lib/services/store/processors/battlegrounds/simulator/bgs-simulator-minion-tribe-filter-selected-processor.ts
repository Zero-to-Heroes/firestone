import {
	BgsSimulatorMinionTribeFilterSelectedEvent,
	MainWindowState,
	NavigationState,
} from '../../../store-internal';
import { PreferencesService } from '@firestone/shared/common/service';
import { Processor } from '../../processor';

export class BgsSimulatorMinionTribeFilterSelectedProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: BgsSimulatorMinionTribeFilterSelectedEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState | null, NavigationState | null]> {
		this.prefs.updateBgsActiveSimulatorMinionTribeFilter(event.tribe);
		return [null, null];
	}
}
