import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { DuelsStateBuilderService } from '../../../../duels/duels-state-builder.service';
import { PreferencesService } from '../../../../preferences.service';
import { DuelsPersonalDeckRenameEvent } from '../../events/duels/duels-personal-deck-rename-event';
import { Processor } from '../processor';

export class DuelsPersonalDeckRenameProcessor implements Processor {
	constructor(private readonly duelsService: DuelsStateBuilderService, private readonly prefs: PreferencesService) {}

	public async process(
		event: DuelsPersonalDeckRenameEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		await this.prefs.updateDuelsDeckName(event.deckstring, event.newName);
		return [null, null];
	}
}
