import { PreferencesService } from '@firestone/shared/common/service';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { DuelsStateBuilderService } from '../../../../duels/duels-state-builder.service';
import { DuelsTopDecksDustFilterSelectedEvent } from '../../events/duels/duels-top-decks-dust-filter-selected-event';
import { Processor } from '../processor';

export class DuelsTopDecksDustFilterSelectedProcessor implements Processor {
	constructor(private readonly duelsService: DuelsStateBuilderService, private readonly prefs: PreferencesService) {}

	public async process(
		event: DuelsTopDecksDustFilterSelectedEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState, NavigationState]> {
		await this.prefs.updateDuelsTopDecksDustFilter(event.value);
		return [null, null];
	}
}
