import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { DuelsUserRunsService } from '../../../../duels/duels-user-runs.service';
import { DungeonLootInfoUpdatedEvent } from '../../events/duels/dungeon-loot-info-updated-event';
import { Processor } from '../processor';

export class DungeonLootInfoUpdatedProcessor implements Processor {
	constructor(private readonly duelsUserRuns: DuelsUserRunsService) {}

	public async process(
		event: DungeonLootInfoUpdatedEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState, NavigationState]> {
		console.debug('[duels-loot] handling loot', event.dungeonLootInfo);
		const dungeonLootInfo = event.dungeonLootInfo;
		this.duelsUserRuns.newLoot(dungeonLootInfo);
		return [null, null];
	}
}
