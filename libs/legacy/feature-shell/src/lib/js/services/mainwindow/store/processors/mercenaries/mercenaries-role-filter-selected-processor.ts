import { PreferencesService } from '@firestone/shared/common/service';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
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
