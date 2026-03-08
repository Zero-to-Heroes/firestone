import { ConstructedNavigationService } from '@firestone/constructed/common';
import {
	MainWindowNavigationService,
	MainWindowState,
	NavigationDecktracker,
	NavigationState,
	SelectDeckDetailsEvent,
} from '../../store-internal';
import { Processor } from '../processor';
import { ISelectDeckDetailsDecksProvider } from './select-deck-details-provider.interface';

export class SelectDeckDetailsProcessor implements Processor {
	constructor(
		private readonly decksProviderService: ISelectDeckDetailsDecksProvider,
		private readonly mainNav: MainWindowNavigationService,
		private readonly nav: ConstructedNavigationService,
	) {}

	public async process(
		event: SelectDeckDetailsEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState | null, NavigationState | null]> {
		const decks = await this.decksProviderService.decks$$.getValueWithInit();
		this.mainNav.text$$.next(
			decks.find(
				(deck) =>
					deck.deckstring === event.deckstring ||
					(deck.allVersions?.map((v) => v.deckstring) ?? []).includes(event.deckstring),
			)?.deckName ?? null,
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
