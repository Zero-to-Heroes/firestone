import { MainWindowNavigationService } from '@firestone/mainwindow/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationDuels } from '../../../../../models/mainwindow/navigation/navigation-duels';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { DuelsDecksProviderService } from '../../../../duels/duels-decks-provider.service';
import { LocalizationService } from '../../../../localization.service';
import { DuelsViewPersonalDeckDetailsEvent } from '../../events/duels/duels-view-personal-deck-details-event';
import { Processor } from '../processor';

export class DuelsViewPersonalDeckDetailsProcessor implements Processor {
	constructor(
		private readonly prefs: PreferencesService,
		private readonly i18n: LocalizationService,
		private readonly duelsDecksProvider: DuelsDecksProviderService,
		private readonly mainNav: MainWindowNavigationService,
	) {}

	public async process(
		event: DuelsViewPersonalDeckDetailsEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const duelsDecks = await this.duelsDecksProvider.duelsDecks$$.getValueWithInit();
		const deck = duelsDecks.find((stat) => stat.initialDeckList === event.deckstring);
		const firstRun = deck.runs?.length ? deck.runs[0] : null;
		const expandedRunIds: readonly string[] = !!firstRun ? [firstRun.id] : [];
		const prefs = await this.prefs.getPreferences();
		const deckName =
			prefs.duelsPersonalDeckNames[deck.initialDeckList] ??
			deck.deckName ??
			this.i18n.translateString('decktracker.deck-name.unnamed-deck');
		this.mainNav.text$$.next(deckName);
		return [
			null,
			navigationState.update({
				navigationDuels: navigationState.navigationDuels.update({
					selectedCategoryId: 'duels-personal-deck-details',
					selectedPersonalDeckstring: event.deckstring,
					selectedDeckId: undefined,
					menuDisplayType: 'breadcrumbs',
					expandedRunIds: expandedRunIds,
					treasureSearchString: null,
				} as NavigationDuels),
			} as NavigationState),
		];
	}
}
