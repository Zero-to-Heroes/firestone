import { MainWindowState, NavigationState } from '@firestone/mainwindow/common';
import { ChangeDeckModeFilterEvent } from '../../events/decktracker/change-deck-mode-filter-event';
import { Processor } from '../processor';

export class ChangeDeckModeFilterProcessor implements Processor {
	public async process(
		event: ChangeDeckModeFilterEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState, NavigationState]> {
		return [null, null];
	}
}
