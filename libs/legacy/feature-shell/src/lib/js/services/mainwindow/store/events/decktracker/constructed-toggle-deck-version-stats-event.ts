import { MainWindowStoreEvent } from '@firestone/mainwindow/common';

export class ConstructedToggleDeckVersionStatsEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'ConstructedToggleDeckVersionStatsEvent';
	}

	constructor(public readonly versionDeckstring: string) {}

	public eventName(): string {
		return 'ConstructedToggleDeckVersionStatsEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
