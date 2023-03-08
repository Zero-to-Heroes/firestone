import { PreferencesService } from '@legacy-import/src/lib/js/services/preferences.service';
import { DuelsDeckSummary } from '@models/duels/duels-personal-deck';
import { MainWindowState } from '@models/mainwindow/main-window-state';
import { NavigationState } from '@models/mainwindow/navigation/navigation-state';
import { DuelsDeckbuilderSaveDeckEvent } from '@services/mainwindow/store/events/duels/duels-deckbuilder-save-deck-event';
import { Processor } from '@services/mainwindow/store/processors/processor';

export class DuelsDeckbuilderSaveDeckProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: DuelsDeckbuilderSaveDeckEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const prefs = await this.prefs.getPreferences();
		const newDeck: DuelsDeckSummary = {
			heroCardId: currentState.duels.deckbuilder.currentHeroCardId,
			initialDeckList: event.deckstring,
			isPersonalDeck: true,
			deckName: event.deckName,
		} as DuelsDeckSummary;
		const existingDecks = [...prefs.duelsPersonalAdditionalDecks, newDeck].map((deck) =>
			deck.initialDeckList !== event.deckstring ? deck : { ...deck, ...newDeck },
		);
		await this.prefs.savePreferences({ ...prefs, duelsPersonalAdditionalDecks: existingDecks });
		return [null, null];
	}
}
