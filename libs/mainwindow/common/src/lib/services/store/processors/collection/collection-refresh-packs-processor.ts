import { PackStatsService } from '@firestone/collection/data-access';
import {
	CollectionRefreshPacksEvent,
	MainWindowState,
	NavigationState,
} from '../../store-internal';
import { Processor } from '../processor';

export class CollectionRefreshPacksProcessor implements Processor {
	constructor(private readonly packsService: PackStatsService) {}

	public async process(
		event: CollectionRefreshPacksEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState | null, NavigationState | null]> {
		this.packsService.refreshPackStats();
		return [null, null];
	}
}
