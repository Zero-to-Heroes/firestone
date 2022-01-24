import { EventEmitter } from '@angular/core';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { PreferencesService } from '../../../../preferences.service';
import { DuelsMmrFilterSelectedEvent } from '../../events/duels/duels-mmr-filter-selected-event';
import { DuelsRequestNewGlobalStatsLoadEvent } from '../../events/duels/duels-request-new-global-stats-load-event';
import { MainWindowStoreEvent } from '../../events/main-window-store-event';
import { Processor } from '../processor';

export class DuelsMmrFilterSelectedProcessor implements Processor {
	constructor(
		private readonly prefs: PreferencesService,
		private readonly stateUpdater: EventEmitter<MainWindowStoreEvent>,
	) {}

	public async process(
		event: DuelsMmrFilterSelectedEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		await this.prefs.updateDuelsMmrFilter(event.value);
		this.stateUpdater.next(new DuelsRequestNewGlobalStatsLoadEvent());
		return [
			currentState.update({
				duels: currentState.duels.update({
					loading: true,
				}),
			}),
			null,
		];
	}
}
