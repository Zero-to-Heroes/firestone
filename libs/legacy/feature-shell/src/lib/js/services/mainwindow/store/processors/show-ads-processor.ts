import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../models/mainwindow/navigation/navigation-state';
import { ShowAdsEvent } from '../events/show-ads-event';
import { Processor } from './processor';

export class ShowAdsProcessor implements Processor {
	public async process(
		event: ShowAdsEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		return [
			currentState.update({
				showAds: event.showAds,
			} as MainWindowState),
			null,
		];
	}
}
