import { MainWindowState, NavigationState } from '@firestone/mainwindow/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { MercenariesHeroLevelFilterSelectedEvent } from '../../events/mercenaries/mercenaries-hero-level-filter-selected-event';
import { Processor } from '../processor';

export class MercenariesHeroLevelFilterSelectedProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: MercenariesHeroLevelFilterSelectedEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState, NavigationState]> {
		await this.prefs.updateMercenariesHeroLevelFilter(event.level);
		return [null, null];
	}
}
