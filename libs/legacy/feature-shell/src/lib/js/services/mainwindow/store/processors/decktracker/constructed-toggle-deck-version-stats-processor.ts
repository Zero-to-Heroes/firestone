import { MainWindowState, NavigationState } from '@firestone/mainwindow/common';
import { Processor } from '@services/mainwindow/store/processors/processor';
import { ConstructedToggleDeckVersionStatsEvent } from '../../events/decktracker/constructed-toggle-deck-version-stats-event';

export class ConstructedToggleDeckVersionStatsProcessor implements Processor {
	public async process(
		event: ConstructedToggleDeckVersionStatsEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		return [
			null,
			navigationState.update({
				navigationDecktracker: navigationState.navigationDecktracker.update({
					selectedVersionDeckstring:
						navigationState.navigationDecktracker.selectedVersionDeckstring === event.versionDeckstring
							? null
							: event.versionDeckstring,
				}),
			}),
		];
	}
}
