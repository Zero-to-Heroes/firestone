import { DuelsIsOnDeckBuildingLobbyScreenEvent } from '@services/mainwindow/store/events/duels/duels-is-on-deck-building-lobby-screen-event';
import { MemoryInspectionService } from '@services/plugins/memory-inspection.service';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { Processor } from '../processor';

export class DuelsIsOnDeckBuildingLobbyScreenProcessor implements Processor {
	constructor(private readonly memory: MemoryInspectionService) {}

	public async process(
		event: DuelsIsOnDeckBuildingLobbyScreenEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const tempDuelsDeck = event.value ? await this.memory.getDuelsDeck() : null;
		return [
			currentState.update({
				duels: currentState.duels.update({
					isOnDuelsDeckBuildingLobbyScreen: event.value,
					tempDuelsDeck: tempDuelsDeck,
				}),
			}),
			null,
		];
	}
}
