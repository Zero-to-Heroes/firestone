import { DeckFilters, DecktrackerState, MainWindowState, NavigationState } from '@firestone/mainwindow/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { ChangeDeckTimeFilterEvent } from '@firestone/mainwindow/common';
import { Processor } from '../processor';

export class ChangeDeckTimeFilterProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: ChangeDeckTimeFilterEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState, NavigationState]> {
		const filters = Object.assign(new DeckFilters(), currentState.decktracker.filters, {
			time: event.newFormat,
		} as DeckFilters);
		await this.prefs.setDesktopDeckFilters(filters);
		const newState: DecktrackerState = Object.assign(new DecktrackerState(), currentState.decktracker, {
			filters: filters,
		} as DecktrackerState);
		return [
			currentState.update({
				decktracker: newState,
			} as MainWindowState),
			null,
		];
	}
}
