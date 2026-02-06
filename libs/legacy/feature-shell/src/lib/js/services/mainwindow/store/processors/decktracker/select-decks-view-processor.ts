import { ConstructedNavigationService } from '@firestone/constructed/common';
import { MainWindowState, NavigationDecktracker, NavigationState } from '@firestone/mainwindow/common';
import { SelectDecksViewEvent } from '../../events/decktracker/select-decks-view-event';
import { Processor } from '../processor';

export class SelectDeckViewProcessor implements Processor {
	constructor(private readonly nav: ConstructedNavigationService) {}

	public async process(
		event: SelectDecksViewEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		this.nav.currentView$$.next(event.newView);
		const newDecktracker = navigationState.navigationDecktracker.update({
			menuDisplayType: 'menu',
		} as NavigationDecktracker);
		return [
			null,
			navigationState.update({
				navigationDecktracker: newDecktracker,
			} as NavigationState),
		];
	}
}
