import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationMercenaries } from '../../../../../models/mainwindow/navigation/navigation-mercenaries';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { MercenariesHeroSearchEvent } from '../../events/mercenaries/mercenaries-hero-search-event';
import { Processor } from '../processor';

export class MercenariesHeroSearchProcessor implements Processor {
	public async process(
		event: MercenariesHeroSearchEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		return [
			null,
			navigationState.update({
				navigationMercenaries: navigationState.navigationMercenaries.update({
					heroSearchString: event.value,
				} as NavigationMercenaries),
			} as NavigationState),
		];
	}
}
