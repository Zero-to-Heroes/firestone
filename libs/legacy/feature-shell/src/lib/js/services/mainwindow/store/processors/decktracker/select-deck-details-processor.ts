import { ConstructedNavigationService } from '@firestone/constructed/common';
import { MainWindowNavigationService } from '@firestone/mainwindow/common';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationDecktracker } from '../../../../../models/mainwindow/navigation/navigation-decktracker';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { DecksProviderService } from '../../../../decktracker/main/decks-provider.service';
import { SelectDeckDetailsEvent } from '../../events/decktracker/select-deck-details-event';
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
