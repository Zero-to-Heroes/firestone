import { Processor } from '../processor';
import {
	ConstructedToggleDeckVersionStatsEvent,
	MainWindowState,
	NavigationState,
} from '../../store-internal';

export class ConstructedToggleDeckVersionStatsProcessor implements Processor {
	public async process(
		event: ConstructedToggleDeckVersionStatsEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState | null, NavigationState | null]> {
		return [
			null,
			navigationState.update({
				navigationDecktracker: navigationState.navigationDecktracker.update({
					selectedVersionDeckstring:
						navigationState.navigationDecktracker.selectedVersionDeckstring === event.versionDeckstring
							? undefined
							: event.versionDeckstring,
				}),
			}),
		];
	}
}
