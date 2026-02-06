import { MainWindowState, NavigationState } from '@firestone/mainwindow/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { MercenariesRoleFilterSelectedEvent } from '../../events/mercenaries/mercenaries-role-filter-selected-event';
import { Processor } from '../processor';

export class MercenariesRoleFilterSelectedProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: MercenariesRoleFilterSelectedEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState, NavigationState]> {
		await this.prefs.updateMercenariesRoleFilter(event.role);
		return [null, null];
	}
}
