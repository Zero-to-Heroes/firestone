import { DuelsStateUpdatedEvent } from '@services/mainwindow/store/events/duels/duels-state-updated-event';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { Processor } from '../processor';

export class DuelsStateUpdatedProcessor implements Processor {
	public async process(
		event: DuelsStateUpdatedEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		return [
			currentState.update({
				duels: currentState.duels.update({
					adventuresInfo: event.adventuresInfo,
				}),
			}),
			null,
		];
	}
}
