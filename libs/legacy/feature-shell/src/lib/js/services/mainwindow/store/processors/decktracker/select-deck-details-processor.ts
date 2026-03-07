import { ConstructedNavigationService } from '@firestone/constructed/common';
import {
	MainWindowNavigationService,
	MainWindowState,
	NavigationDecktracker,
	NavigationState,
} from '@firestone/mainwindow/common';
import { DecksProviderService } from '@firestone/decktracker/common';
import { SelectDeckDetailsEvent } from '@firestone/mainwindow/common';
import { Processor } from '../processor';

export class SelectDeckDetailsProcessor implements Processor {
	constructor(
		private readonly decksProviderService: DecksProviderService,
		private readonly mainNav: MainWindowNavigationService,
		private readonly nav: ConstructedNavigationService,
	) {}

	public async process(
		event: SelectDeckDetailsEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const decks = await this.decksProviderService.decks$$.getValueWithInit();
		this.mainNav.text$$.next(
			decks.find(
				(deck) =>
					deck.deckstring === event.deckstring ||
					(deck.allVersions?.map((v) => v.deckstring) ?? []).includes(event.deckstring),
			)?.deckName,
		);
		this.nav.currentView$$.next('deck-details');
		this.nav.selectedDeckstring$$.next(event.deckstring);
		return [
			null,
			navigationState.update({
				navigationDecktracker: navigationState.navigationDecktracker.update({
					menuDisplayType: 'breadcrumbs',
				} as NavigationDecktracker),
			} as NavigationState),
		];
	}
}
