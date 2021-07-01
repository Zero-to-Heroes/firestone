import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { ReplaysState } from '../../../../../models/mainwindow/replays/replays-state';
import { ReplaysStateBuilderService } from '../../../../decktracker/main/replays-state-builder.service';
import { PreferencesService } from '../../../../preferences.service';
import { ReplaysFilterEvent } from '../../events/replays/replays-filter-event';
import { Processor } from '../processor';

export class ReplaysFilterProcessor implements Processor {
	constructor(private readonly builder: ReplaysStateBuilderService, private readonly prefs: PreferencesService) {}

	public async process(
		event: ReplaysFilterEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		switch (event.type) {
			case 'deckstring':
				await this.prefs.updateReplayFilterDeckstring(event.type, event.selectedValue);
				await this.prefs.updateReplayFilterGameMode('gameMode', 'ranked');
				break;
			case 'gameMode':
				await this.prefs.updateReplayFilterGameMode(event.type, event.selectedValue);
				break;
			case 'bg-hero':
				await this.prefs.updateReplayFilterBgHero(event.type, event.selectedValue);
				break;
			case 'player-class':
				await this.prefs.updateReplayFilterPlayerClass(event.type, event.selectedValue);
				break;
			case 'opponent-class':
				await this.prefs.updateReplayFilterOpponentClass(event.type, event.selectedValue);
				break;
		}
		const newState: ReplaysState = await this.builder.filterReplays(currentState.replays, currentState.stats);
		return [
			Object.assign(new MainWindowState(), currentState, {
				replays: newState,
			} as MainWindowState),
			navigationState.update({
				isVisible: true,
				currentApp: 'replays',
				text: null,
			} as NavigationState),
		];
	}
}
