import { MainWindowState } from '@models/mainwindow/main-window-state';
import { NavigationState } from '@models/mainwindow/navigation/navigation-state';
import { Processor } from '@services/mainwindow/store/processors/processor';
import { ReferenceQuestsLoadedEvent } from '../../events/quests/reference-quests-loaded-event';

export class ReferenceQuestsLoadedProcessor implements Processor {
	public async process(
		event: ReferenceQuestsLoadedEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const newState = currentState.update({
			quests: currentState.quests.update({
				referenceQuests: event.data,
			}),
		});
		return [newState, null];
	}
}
