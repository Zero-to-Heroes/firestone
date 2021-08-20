import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { PreferencesService } from '../../../../preferences.service';
import { DuelsSignatureTreasureFilterSelectedEvent } from '../../events/duels/duels-signature-treasure-filter-selected-event';
import { Processor } from '../processor';

export class DuelsSignatureTreasureFilterSelectedProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: DuelsSignatureTreasureFilterSelectedEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		await this.prefs.updateDuelsSignatureTreasureFilter(event.value);
		console.log('updated duels signature treasure filter', event.value);
		return [null, null];
	}
}
