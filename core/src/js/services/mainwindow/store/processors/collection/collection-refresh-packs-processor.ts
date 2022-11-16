import { PackStatsService } from '../../../../../../libs/packs/services/pack-stats.service';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { CollectionRefreshPacksEvent } from '../../events/collection/colection-refresh-packs-event';
import { Processor } from '../processor';

export class CollectionRefreshPacksProcessor implements Processor {
	constructor(private readonly packsService: PackStatsService) {}

	public async process(
		event: CollectionRefreshPacksEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		this.packsService.refreshPackStats();
		return [null, null];
	}
}
