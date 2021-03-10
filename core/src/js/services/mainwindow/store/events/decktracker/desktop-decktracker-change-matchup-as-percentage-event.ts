import { MainWindowStoreEvent } from '../main-window-store-event';

export class DesktopDecktrackerChangeMatchupAsPercentagesEvent implements MainWindowStoreEvent {
	constructor(public readonly usePercentages: boolean) {}

	public static eventName(): string {
		return 'DesktopDecktrackerChangeMatchupAsPercentagesEvent';
	}

	public eventName(): string {
		return 'DesktopDecktrackerChangeMatchupAsPercentagesEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
