import { MainWindowState, NavigationState } from '@firestone/mainwindow/common';
import { PackStatsService } from '../../../../../../libs/packs/services/pack-stats.service';
import { CollectionRefreshPacksEvent } from '../../events/collection/colection-refresh-packs-event';
import { Processor } from '../processor';

export class CollectionRefreshPacksProcessor implements Processor {
	constructor(private readonly packsService: PackStatsService) {}

	public async process(
		event: CollectionRefreshPacksEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		this.packsService.refreshPackStats();
		return [null, null];
	}
}
