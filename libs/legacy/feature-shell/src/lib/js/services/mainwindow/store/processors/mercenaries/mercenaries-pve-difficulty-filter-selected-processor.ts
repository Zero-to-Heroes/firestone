import { MainWindowState, NavigationState } from '@firestone/mainwindow/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { MercenariesPveDifficultyFilterSelectedEvent } from '../../events/mercenaries/mercenaries-pve-difficulty-filter-selected-event';
import { Processor } from '../processor';

export class MercenariesPveDifficultyFilterSelectedProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: MercenariesPveDifficultyFilterSelectedEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState, NavigationState]> {
		await this.prefs.updateMercenariesPveDifficultyFilter(event.difficulty);
		return [null, null];
	}
}
