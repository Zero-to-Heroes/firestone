import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { PackStatsService } from '../../../../collection/pack-stats.service';
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
