import { ConstructedPersonalDecksService, DeckSummary } from '@firestone/constructed/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { MainWindowState } from '@models/mainwindow/main-window-state';
import { NavigationState } from '@models/mainwindow/navigation/navigation-state';
import { Processor } from '@services/mainwindow/store/processors/processor';
import { ConstructedDeckbuilderSaveDeckEvent } from '../../events/decktracker/constructed-deckbuilder-save-deck-event';

export class ConstructedDeckbuilderSaveDeckProcessor implements Processor {
	constructor(
		private readonly prefs: PreferencesService,
		private readonly constructedPersonalDecks: ConstructedPersonalDecksService,
	) {}

	public async process(
		event: ConstructedDeckbuilderSaveDeckEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const newDeck: DeckSummary = {
			class: currentState.decktracker.deckbuilder.currentClass,
			format: currentState.decktracker.deckbuilder.currentFormat,
			deckstring: event.deckstring,
			isPersonalDeck: true,
			deckName: event.deckName,
			lastUsedTimestamp: new Date().getTime(),
		} as DeckSummary;
		await this.constructedPersonalDecks.addDeck(newDeck);
		return [null, null];
	}
}
