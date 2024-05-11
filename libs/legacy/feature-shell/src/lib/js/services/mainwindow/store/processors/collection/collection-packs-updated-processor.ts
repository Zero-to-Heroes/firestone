import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { CollectionPacksUpdatedEvent } from '../../events/collection/colection-packs-updated-event';
import { Processor } from '../processor';

export class CollectionPacksUpdatedProcessor implements Processor {
	public async process(
		event: CollectionPacksUpdatedEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		return [null, null];
	}
}
