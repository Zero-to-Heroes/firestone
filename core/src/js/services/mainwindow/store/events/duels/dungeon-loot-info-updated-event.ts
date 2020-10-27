import { Input } from '@firestone-hs/save-dungeon-loot-info/dist/input';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class DungeonLootInfoUpdatedEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'DungeonLootInfoUpdatedEvent';
	}

	constructor(public readonly dungeonLootInfo: Input) {}

	public eventName(): string {
		return 'DungeonLootInfoUpdatedEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
