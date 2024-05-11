import { PreferencesService } from '@firestone/shared/common/service';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { DuelsHeroPowerFilterSelectedEvent } from '../../events/duels/duels-hero-power-filter-selected-event';
import { Processor } from '../processor';

export class DuelsHeroPowerFilterSelectedProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: DuelsHeroPowerFilterSelectedEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState, NavigationState]> {
		await this.prefs.updateDuelsHeroPowerFilter(event.value);
		return [null, null];
	}
}
