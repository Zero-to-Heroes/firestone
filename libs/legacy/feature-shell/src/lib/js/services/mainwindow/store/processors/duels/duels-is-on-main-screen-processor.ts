import { DuelsIsOnMainScreenEvent } from '@services/mainwindow/store/events/duels/duels-is-on-main-screen-event';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { Processor } from '../processor';

export class DuelsIsOnMainScreenProcessor implements Processor {
	public async process(
		event: DuelsIsOnMainScreenEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		return [
			currentState.update({
				duels: currentState.duels.update({
					isOnDuelsMainScreen: event.value,
				}),
			}),
			null,
		];
	}
}
