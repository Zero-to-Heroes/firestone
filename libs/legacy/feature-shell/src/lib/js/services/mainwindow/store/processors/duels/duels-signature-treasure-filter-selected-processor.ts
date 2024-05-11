import { PreferencesService } from '@firestone/shared/common/service';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { DuelsSignatureTreasureFilterSelectedEvent } from '../../events/duels/duels-signature-treasure-filter-selected-event';
import { Processor } from '../processor';

export class DuelsSignatureTreasureFilterSelectedProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: DuelsSignatureTreasureFilterSelectedEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState, NavigationState]> {
		await this.prefs.updateDuelsSignatureTreasureFilter(event.values);
		return [null, null];
	}
}
