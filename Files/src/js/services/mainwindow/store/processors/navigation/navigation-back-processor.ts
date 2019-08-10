import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationBackEvent } from '../../events/navigation/navigation-back-event';
import { StateHistory } from '../../state-history';
import { Processor } from '../processor';

export class NavigationBackProcessor implements Processor {
	public async process(
		event: NavigationBackEvent,
		currentState: MainWindowState,
		history: readonly StateHistory[],
	): Promise<MainWindowState> {
		let targetIndex = NavigationBackProcessor.getTargetIndex(currentState, history);
		if (targetIndex === -1) {
			console.error('invalid previous state', history, currentState);
			return currentState;
		}
		console.log('processing back navigation event', history);
		return history[targetIndex].state;
	}

	public static getTargetIndex(currentState: MainWindowState, history: readonly StateHistory[]): number {
		let currentIndex = history.map(history => history.state).indexOf(currentState);
		while (currentIndex >= 0 && !history[currentIndex].navigation) {
			currentIndex--;
		}
		// We go back until we find an item that is a navigation state
		let targetIndex = -1;
		for (let i = currentIndex - 1; i >= 0; i--) {
			if (history[i].navigation) {
				targetIndex = i;
				break;
			}
		}
		console.log('back index', targetIndex, history);
		return targetIndex;
	}
}
