import { MainWindowStoreEvent } from '../../main-window-store-event';

export class BgsCustomSimulationCloseSidePanelEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'BgsCustomSimulationCloseSidePanelEvent';
	}

	public eventName(): string {
		return 'BgsCustomSimulationCloseSidePanelEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}
}
