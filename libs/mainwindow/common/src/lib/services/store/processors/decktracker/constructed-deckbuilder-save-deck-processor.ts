import { ConstructedPersonalDecksService, DeckSummary } from '@firestone/constructed/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { Processor } from '../processor';
import {
	ConstructedDeckbuilderSaveDeckEvent,
	MainWindowState,
	NavigationState,
} from '../../store-internal';

export class ConstructedDeckbuilderSaveDeckProcessor implements Processor {
	constructor(
		private readonly prefs: PreferencesService,
		private readonly constructedPersonalDecks: ConstructedPersonalDecksService,
	) {}

	public async process(
		event: ConstructedDeckbuilderSaveDeckEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState | null, NavigationState | null]> {
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
