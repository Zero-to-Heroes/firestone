import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { MercenariesCollectionInformationFromMemoryEvent } from '../../events/mercenaries/mercenaries-collection-information-from-memory-event';
import { Processor } from '../processor';

export class MercenariesCollectionInformationFromMemoryProcessor implements Processor {
	public async process(
		event: MercenariesCollectionInformationFromMemoryEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		return [
			currentState.update({
				mercenaries: currentState.mercenaries.update({
					collectionInfo: event.info,
				}),
			}),
			null,
		];
	}
}
