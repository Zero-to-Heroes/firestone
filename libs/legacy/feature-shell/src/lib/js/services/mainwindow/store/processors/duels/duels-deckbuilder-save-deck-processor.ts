import { DuelsDeckSummary, DuelsPersonalDecksService } from '@firestone/duels/general';
import { PreferencesService } from '@firestone/shared/common/service';
import { MainWindowState } from '@models/mainwindow/main-window-state';
import { NavigationState } from '@models/mainwindow/navigation/navigation-state';
import { DuelsDeckbuilderSaveDeckEvent } from '@services/mainwindow/store/events/duels/duels-deckbuilder-save-deck-event';
import { Processor } from '@services/mainwindow/store/processors/processor';

export class DuelsDeckbuilderSaveDeckProcessor implements Processor {
	constructor(
		private readonly prefs: PreferencesService,
		private readonly duelsPersonalDecks: DuelsPersonalDecksService,
	) {}

	public async process(
		event: DuelsDeckbuilderSaveDeckEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState, NavigationState]> {
		const prefs = await this.prefs.getPreferences();
		const newDeck: DuelsDeckSummary = {
			heroCardId: currentState.duels.deckbuilder.currentHeroCardId,
			initialDeckList: event.deckstring,
			isPersonalDeck: true,
			deckName: event.deckName,
		} as DuelsDeckSummary;
		this.duelsPersonalDecks.addDeck(newDeck);
		return [null, null];
	}
}
