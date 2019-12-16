import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { ReplaysState } from '../../../../../models/mainwindow/replays/replays-state';
import { ReplaysStateBuilderService } from '../../../../decktracker/main/replays-state-builder.service';
import { ReplaysFilterEvent } from '../../events/replays/replays-filter-event';
import { Processor } from '../processor';

export class ReplaysFilterProcessor implements Processor {
	constructor(private readonly builder: ReplaysStateBuilderService) {}

	public async process(event: ReplaysFilterEvent, currentState: MainWindowState): Promise<MainWindowState> {
		const newState: ReplaysState = this.builder.filterReplays(
			currentState.replays,
			currentState.stats,
			event.type,
			event.selectedValue,
		);
		return Object.assign(new MainWindowState(), currentState, {
			replays: newState,
			isVisible: true,
			currentApp: 'replays',
		} as MainWindowState);
	}
}
