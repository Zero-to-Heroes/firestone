import { PreferencesService } from '@firestone/shared/common/service';
import {
	MainWindowState,
	MercenariesModeFilterSelectedEvent,
	NavigationState,
} from '../../store-internal';
import { Processor } from '../processor';

export class MercenariesModeFilterSelectedProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: MercenariesModeFilterSelectedEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState | null, NavigationState | null]> {
		await this.prefs.updateMercenariesModeFilter(event.mode);
		return [null, null];
	}
}
