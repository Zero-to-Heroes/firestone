import {
	MainWindowState,
	MainWindowStoreEvent,
	NavigationState,
	StatsCategoryType,
} from '../../store-internal';
import { Processor } from '../processor';

export class ProfileSelectCategoryEvent implements MainWindowStoreEvent {
	
	readonly eventName = ProfileSelectCategoryEvent.eventName

	static readonly eventName = 'ProfileSelectCategoryEvent'

	constructor(public readonly categoryId: StatsCategoryType) {}
}

export class ProfileSelectCategoryProcessor implements Processor {
	public async process(
		event: ProfileSelectCategoryEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState | null, NavigationState | null]> {
		return [
			null,
			navigationState.update({
				navigationStats: navigationState.navigationStats.update({
					selectedCategoryId: event.categoryId,
				}),
			}),
		];
	}
}
