import { MainWindowState } from '@models/mainwindow/main-window-state';
import { NavigationState } from '@models/mainwindow/navigation/navigation-state';
import { Processor } from '@services/mainwindow/store/processors/processor';
import { MercenariesReferenceDataLoadedEvent } from '../../events/mercenaries/mercenaries-reference-data-loaded-event';

export class MercenariesReferenceDataLoadedProcessor implements Processor {
	public async process(
		event: MercenariesReferenceDataLoadedEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const newState = currentState.update({
			mercenaries: currentState.mercenaries.update({
				referenceData: event.data,
			}),
		});
		console.debug('merc ref data loaded', newState, currentState, event.data);
		return [newState, null];
	}
}
