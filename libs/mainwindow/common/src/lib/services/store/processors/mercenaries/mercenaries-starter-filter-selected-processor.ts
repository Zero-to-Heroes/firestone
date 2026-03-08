import { PreferencesService } from '@firestone/shared/common/service';
import {
	MainWindowState,
	MercenariesStarterFilterSelectedEvent,
	NavigationState,
} from '../../store-internal';
import { Processor } from '../processor';

export class MercenariesStarterFilterSelectedProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: MercenariesStarterFilterSelectedEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState | null, NavigationState | null]> {
		await this.prefs.updateMercenariesStarterFilter(event.starter);
		return [null, null];
	}
}
