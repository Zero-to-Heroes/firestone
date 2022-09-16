import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { BgsQuestsDataLoadedEvent } from '../../events/battlegrounds/bgs-quests-data-loaded-event';
import { Processor } from '../processor';

export class BgsQuestsDataLoadedProcessor implements Processor {
	public async process(
		event: BgsQuestsDataLoadedEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		return [
			currentState.update({
				battlegrounds: currentState.battlegrounds.update({
					globalStats: currentState.battlegrounds.globalStats.update({
						questStats: event.data,
					}),
				}),
			}),
			null,
		];
	}
}
