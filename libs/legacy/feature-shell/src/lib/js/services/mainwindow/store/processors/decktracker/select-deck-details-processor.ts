import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationDecktracker } from '../../../../../models/mainwindow/navigation/navigation-decktracker';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { DecksProviderService } from '../../../../decktracker/main/decks-provider.service';
import { SelectDeckDetailsEvent } from '../../events/decktracker/select-deck-details-event';
import { Processor } from '../processor';

export class SelectDeckDetailsProcessor implements Processor {
	constructor(private readonly decksProviderService: DecksProviderService) {}

	public async process(
		event: SelectDeckDetailsEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		return [
			null,
			navigationState.update({
				navigationDecktracker: navigationState.navigationDecktracker.update({
					currentView: 'deck-details',
					menuDisplayType: 'breadcrumbs',
					selectedDeckstring: event.deckstring,
				} as NavigationDecktracker),
				text: this.decksProviderService.decks$.value.find(
					(deck) =>
						deck.deckstring === event.deckstring ||
						(deck.allVersions?.map((v) => v.deckstring) ?? []).includes(event.deckstring),
				)?.deckName,
			} as NavigationState),
		];
	}
}
