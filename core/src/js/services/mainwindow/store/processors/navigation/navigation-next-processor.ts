import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { NavigationNextEvent } from '../../events/navigation/navigation-next-event';
import { NavigationHistory } from '../../navigation-history';
import { Processor } from '../processor';

export class NavigationNextProcessor implements Processor {
	public async process(
		event: NavigationNextEvent,
		currentState: MainWindowState,
		history: NavigationHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const newState =
			history.currentIndexInHistory >= history.stateHistory.length
				? null
				: history.stateHistory[history.currentIndexInHistory + 1].state;
		return [null, newState];
	}

	// public static getTargetIndex(currentState: NavigationState, history: readonly StateHistory[]): number {
	// 	let currentIndex = history.map(history => history.state).indexOf(currentState);
	// 	// We go back until we find an item that is a navigation state
	// 	let targetIndex = -1;
	// 	for (let i = currentIndex + 1; i < history.length; i++) {
	// 		if (history[i].navigation) {
	// 			targetIndex = i;
	// 			break;
	// 		}
	// 	}
	// 	return targetIndex;
	// }
}
