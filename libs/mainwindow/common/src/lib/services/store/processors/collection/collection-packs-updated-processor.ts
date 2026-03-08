import {
	CollectionPacksUpdatedEvent,
	MainWindowState,
	NavigationState,
} from '../../store-internal';
import { Processor } from '../processor';

export class CollectionPacksUpdatedProcessor implements Processor {
	public async process(
		event: CollectionPacksUpdatedEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState | null, NavigationState | null]> {
		return [null, null];
	}
}
