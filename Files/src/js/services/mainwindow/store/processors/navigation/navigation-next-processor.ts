import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationNextEvent } from '../../events/navigation/navigation-next-event';
import { StateHistory } from '../../state-history';
import { Processor } from '../processor';

export class NavigationNextProcessor implements Processor {
	public async process(
		event: NavigationNextEvent,
		currentState: MainWindowState,
		history: readonly StateHistory[],
	): Promise<MainWindowState> {
		// We go back until we find an item that is a navigation state
		let targetIndex = NavigationNextProcessor.getTargetIndex(currentState, history);
		if (targetIndex === -1) {
			console.error('invalid next state', history, currentState);
			return currentState;
		}
		return history[targetIndex].state;
	}

	public static getTargetIndex(currentState: MainWindowState, history: readonly StateHistory[]): number {
		let currentIndex = history.map(history => history.state).indexOf(currentState);
		while (currentIndex >= 0 && !history[currentIndex].navigation) {
			currentIndex--;
		}
		// We go back until we find an item that is a navigation state
		let targetIndex = -1;
		for (let i = currentIndex + 1; i < history.length; i++) {
			if (history[i].navigation) {
				targetIndex = i;
				break;
			}
		}
		return targetIndex;
	}
}
