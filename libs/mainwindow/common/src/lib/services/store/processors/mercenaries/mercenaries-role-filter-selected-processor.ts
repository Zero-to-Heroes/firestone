import { PreferencesService } from '@firestone/shared/common/service';
import {
	MainWindowState,
	MercenariesRoleFilterSelectedEvent,
	NavigationState,
} from '../../store-internal';
import { Processor } from '../processor';

export class MercenariesRoleFilterSelectedProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: MercenariesRoleFilterSelectedEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState | null, NavigationState | null]> {
		await this.prefs.updateMercenariesRoleFilter(event.role);
		return [null, null];
	}
}
