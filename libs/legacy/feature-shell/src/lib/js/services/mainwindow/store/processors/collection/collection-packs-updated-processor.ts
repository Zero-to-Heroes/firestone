import { MainWindowState, NavigationState } from '@firestone/mainwindow/common';
import { CollectionPacksUpdatedEvent } from '@firestone/mainwindow/common';
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
