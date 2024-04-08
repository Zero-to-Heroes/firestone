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
	) {}

	public async process(
		event: SelectDeckDetailsEvent,
		currentState: MainWindowState,
		stateHistory,
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
		return [
			null,
			navigationState.update({
				navigationDecktracker: navigationState.navigationDecktracker.update({
					currentView: 'deck-details',
					menuDisplayType: 'breadcrumbs',
					selectedDeckstring: event.deckstring,
				} as NavigationDecktracker),
			} as NavigationState),
		];
	}
}
