import { DuelsDeckSummary } from '@models/duels/duels-personal-deck';
import { MainWindowState } from '@models/mainwindow/main-window-state';
import { NavigationState } from '@models/mainwindow/navigation/navigation-state';
import { DuelsStateBuilderService } from '@services/duels/duels-state-builder.service';
import { DuelsDeckbuilderSaveDeckEvent } from '@services/mainwindow/store/events/duels/duels-deckbuilder-save-deck-event';
import { Processor } from '@services/mainwindow/store/processors/processor';
import { PreferencesService } from '@services/preferences.service';

export class DuelsDeckbuilderSaveDeckProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService, private readonly stateBuilder: DuelsStateBuilderService) {}

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
		} as DuelsDeckSummary;
		const newDecks: readonly DuelsDeckSummary[] = [...prefs.duelsPersonalAdditionalDecks, newDeck];
		await this.prefs.savePreferences({ ...prefs, duelsPersonalAdditionalDecks: newDecks });
		const newDuelsState = await this.stateBuilder.updateState(currentState.duels, currentState.stats.gameStats);
		return [
			currentState.update({
				duels: newDuelsState,
			}),
			null,
		];
	}
}
