import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { MercenariesMapInformationFromMemoryEvent } from '../../events/mercenaries/mercenaries-map-information-from-memory-event';
import { Processor } from '../processor';

export class MercenariesMapInformationFromMemoryProcessor implements Processor {
	public async process(
		event: MercenariesMapInformationFromMemoryEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		return [
			currentState.update({
				mercenaries: currentState.mercenaries.update({
					mapInfo: event.info,
				}),
			}),
			null,
		];
	}
}
